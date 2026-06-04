import requests
import json

BASE = "https://phishguard-api-8l8a.onrender.com"

urls = [
    "https://www.google.com",
    "https://www.github.com",
    "https://leetcode.com/problemset/",
    "http://paypa1-secure-login.tk/verify",
    "http://192.168.1.45/login",
]

for url in urls:
    r = requests.post(f"{BASE}/scan", json={"url": url})
    d = r.json()
    print(f"{d['verdict']:12} ({d['risk_score']:3}/100)  {url}")
    if d.get('flags'):
        for flag in d['flags']:
            print(f"  → {flag}")