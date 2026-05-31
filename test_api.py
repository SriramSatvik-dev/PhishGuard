import requests

BASE = "https://phishguard-production-e3d7.up.railway.app"

for url in ["https://www.google.com", "http://paypa1-secure-login.tk/verify"]:
    r = requests.post(f"{BASE}/scan", json={"url": url})
    d = r.json()
    print(f"URL: {url}")
    print(f"Score: {d.get('risk_score')}")
    print(f"Verdict: {d.get('verdict')}")
    print(f"Flags: {d.get('flags')}")
    print("="*50)