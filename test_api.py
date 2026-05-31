import requests

# Make sure no trailing slash on BASE
BASE = "https://phishguard-production-e3d7.up.railway.app"

for url in ["https://www.google.com", "http://paypa1-secure-login.tk/verify"]:
    r = requests.post(
        f"{BASE}/debug-scan",    # single slash, POST method
        json={"url": url}
    )
    import json
    print(json.dumps(r.json(), indent=2))
    print("="*60)