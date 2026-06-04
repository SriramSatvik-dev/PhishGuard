import requests

BASE = "https://phishguard-api-8l8a.onrender.com"

tests = [
    ("GET",  "/health", None),
    ("POST", "/scan",   {"url": "https://www.google.com"}),
    ("POST", "/scan",   {"url": "http://paypa1-secure-login.tk/verify"}),
    ("GET",  "/history", None),
    ("GET",  "/stats",   None),
]

for method, path, body in tests:
    r = requests.get(f"{BASE}{path}") if method == "GET" else requests.post(f"{BASE}{path}", json=body)
    d = r.json()
    if path == "/scan":
        print(f"{method} {path} → {r.status_code} — {d.get('verdict')} ({d.get('risk_score')}/100)")
    else:
        print(f"{method} {path} → {r.status_code} {'✅' if r.status_code == 200 else '❌'}")