from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio

from backend.model_loader     import predict
from backend.feature_extractor import extract_features
from backend.threat_intel     import check_virustotal, check_urlhaus
from backend.dns_whois        import run_dns_whois
from backend.score_synthesizer import synthesize

import os
from dotenv import load_dotenv

load_dotenv()

from contextlib import asynccontextmanager
from backend.database import save_scan, get_history, get_stats, clear_history, init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("PhishGuard API started")
    yield
    print("PhishGuard API stopped")

app = FastAPI(title="PhishGuard API", lifespan=lifespan)

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"]
)


class ScanRequest(BaseModel):
    url: str


@app.post("/scan")
async def scan_url(request: ScanRequest):
    url = request.url.strip()

    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")

    # Step 1: extract features and run ML model
    features   = extract_features(url)
    ml_result  = predict(features)

    # Step 2: run threat intel and DNS checks in parallel
    # asyncio.gather runs both simultaneously — faster than sequential
    loop = asyncio.get_event_loop()
    vt_result, uh_result, dns_result = await asyncio.gather(
        loop.run_in_executor(None, check_virustotal, url),
        loop.run_in_executor(None, check_urlhaus, url),
        loop.run_in_executor(None, run_dns_whois, url),
    )

    ti_result = {**vt_result, **uh_result}

    # Step 3: combine into final score
    final = synthesize(ml_result, ti_result, dns_result)
    final["url"] = url

    # Step 4: save to database
    save_scan(url, final)

    return final


@app.get("/history")
def scan_history(limit: int = 50):
    return get_history(limit)


@app.get("/health")
def health():
    return {"status": "ok"}

# Add these routes below your existing ones

@app.get("/stats")
def scan_stats():
    return get_stats()

@app.delete("/history")
def clear_scan_history():
    clear_history()
    return {"message": "History cleared"}

@app.get("/debug")
def debug():
    import os
    return {
        "database_url_set"  : bool(os.getenv("DATABASE_URL")),
        "vt_key_set"        : bool(os.getenv("VIRUSTOTAL_API_KEY")),
        "model_exists"      : os.path.exists("ml/models/phishguard_model.pkl"),
        "features_exists"   : os.path.exists("ml/models/feature_names.pkl"),
        "cwd"               : os.getcwd(),
        "files_in_root"     : os.listdir("."),
    }

@app.post("/debug-scan")
async def debug_scan(request: ScanRequest):
    url = request.url.strip()
    
    # Step 1 - features
    features = extract_features(url)
    
    # Step 2 - ML prediction
    ml_result = predict(features)
    
    # Step 3 - threat intel
    vt_result = check_virustotal(url)
    uh_result = check_urlhaus(url)
    ti_result = {**vt_result, **uh_result}
    
    # Step 4 - DNS/WHOIS
    dns_result = run_dns_whois(url)
    
    return {
        "url"        : url,
        "features"   : features,
        "ml_result"  : ml_result,
        "ti_result"  : ti_result,
        "dns_result" : dns_result,
    }