import requests
import json

BASE = "http://localhost:8000"

print("="*50)
print("PHISHGUARD FINAL LOCAL VERIFICATION")
print("="*50)

# Test 1: Health
r = requests.get(f"{BASE}/health")
print(f"\n1. Health check: {'✅' if r.status_code == 200 else '❌'}")

# Test 2: Legitimate URL
r = requests.post(f"{BASE}/scan", json={"url": "https://www.google.com"})
d = r.json()
passed = d['verdict'] == 'legitimate' and d['risk_score'] < 45
print(f"2. Legitimate URL scan: {'✅' if passed else '❌'} — {d['verdict']} ({d['risk_score']}/100)")

# Test 3: Phishing URL
r = requests.post(f"{BASE}/scan", json={"url": "http://paypa1-secure-login.tk/verify"})
d = r.json()
passed = d['risk_score'] > 0
print(f"3. Phishing URL scan: {'✅' if passed else '❌'} — {d['verdict']} ({d['risk_score']}/100)")

# Test 4: History saves correctly
r = requests.get(f"{BASE}/history")
d = r.json()
passed = isinstance(d, list) and len(d) >= 2
print(f"4. History saving: {'✅' if passed else '❌'} — {len(d)} scans stored")

# Test 5: Stats
r = requests.get(f"{BASE}/stats")
d = r.json()
passed = d['total_scans'] > 0
print(f"5. Stats endpoint: {'✅' if passed else '❌'} — {d['total_scans']} total scans")

# Test 6: Invalid URL handled gracefully
r = requests.post(f"{BASE}/scan", json={"url": "not-a-url"})
passed = r.status_code == 400
print(f"6. Invalid URL handling: {'✅' if passed else '❌'} — status {r.status_code}")

# Test 7: Empty URL
r = requests.post(f"{BASE}/scan", json={"url": ""})
passed = r.status_code == 400
print(f"7. Empty URL handling: {'✅' if passed else '❌'} — status {r.status_code}")

print("\n" + "="*50)