import requests

BASE = "http://localhost:8000"

tests = [
    ("GET",  "/health",  None),
    ("POST", "/scan",    {"url": "https://www.google.com"}),
    ("POST", "/scan",    {"url": "http://paypa1-secure-login.tk/verify"}),
    ("GET",  "/history", None),
    ("GET",  "/stats",   None),
]

for method, path, body in tests:
    if method == "GET":
        r = requests.get(f"{BASE}{path}")
    else:
        r = requests.post(f"{BASE}{path}", json=body)
    print(f"{method} {path} → {r.status_code} {'✅' if r.status_code == 200 else '❌'}")