# 🛡️ PhishGuard

> ML-powered real-time phishing URL detection — Chrome extension, threat intelligence, and analyst dashboard.

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green?logo=fastapi)
![XGBoost](https://img.shields.io/badge/XGBoost-2.0.3-orange)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Chrome](https://img.shields.io/badge/Chrome-Manifest_V3-yellow?logo=googlechrome)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

## 📌 Overview

PhishGuard automatically scans every website you visit and warns you in real time if it detects a phishing attempt. Unlike traditional blacklist-based blockers that only catch known-bad URLs, PhishGuard uses three complementary intelligence layers to catch both known and newly created phishing sites:

- **ML Model** — XGBoost classifier trained on 353,406 URLs, achieving 95.4% accuracy on structural URL features
- **Threat Intelligence** — Live lookups against VirusTotal (70+ AV engines) and URLhaus (active malware DB)
- **Domain Forensics** — DNS resolution checks and typosquatting detection against top domains

---

## 🌐 Live Demo

| Service | URL |
|---|---|
| API Docs | https://phishguard-api-8l8a.onrender.com/docs |
| Analyst Dashboard | https://your-dashboard.onrender.com |

---

## ✨ Features

- 🔍 **Auto-scans every URL** you visit — no manual action needed
- 🎨 **Colour-coded badge** on extension icon (green / orange / red) with risk score
- ⚠️ **Warning banner** injected into suspicious pages with "Go back" and "Proceed anyway" options
- 📊 **Risk score 0–100** synthesised from ML + threat intel + domain forensics
- 🧠 **Explainable flags** — every verdict comes with human-readable reasons
- 📋 **Analyst dashboard** with scan history, risk distribution charts, and CSV export
- 💾 **Persistent storage** — all scans stored in PostgreSQL via Supabase
- ⚡ **10-minute result caching** to avoid redundant API calls

---

## 🏗️ Architecture

```
User's Chrome Browser
        │
        ▼
Chrome Extension (Manifest V3)
        │  POST /scan
        ▼
FastAPI Backend (Render)
        │
        ├──▶ ML Model (XGBoost)          ← URL structural features
        ├──▶ VirusTotal API              ← 70+ AV engine consensus
        ├──▶ URLhaus API                 ← Active malware database
        └──▶ DNS + Typosquatting check   ← Domain forensics
        │
        ▼
Score Synthesizer
  ML (max 30pts) + Threat Intel (max 45pts) + DNS (max 25pts)
        │
        ├──▶ PostgreSQL / Supabase       ← Scan history
        └──▶ React Dashboard (Render)    ← Analytics & reporting
```

---

## 📊 Model Performance

| Metric | Legitimate | Phishing | Overall |
|---|---|---|---|
| Precision | 0.96 | 0.95 | — |
| Recall | 0.95 | 0.96 | — |
| F1-Score | 0.96 | 0.96 | — |
| **Accuracy** | — | — | **95.41%** |

**Confusion Matrix** (test set of 70,682 URLs):

|  | Predicted Legit | Predicted Phishing |
|---|---|---|
| **Actual Legit** | TN = 33,930 ✅ | FP = 1,411 |
| **Actual Phishing** | FN = 1,733 | TP = 33,608 ✅ |

**Models evaluated:** Logistic Regression, Decision Tree, Random Forest, XGBoost (selected)

**Dataset:** 353,406 balanced URLs from PhishTank, URLhaus, ISCX URL 2016, and Tranco Top 1M

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Machine Learning | Python, XGBoost, scikit-learn, pandas, NumPy |
| Backend API | FastAPI, Uvicorn, Pydantic, asyncio |
| Threat Intelligence | VirusTotal API v3, URLhaus API |
| Domain Forensics | dnspython, python-whois, difflib |
| Database | PostgreSQL, SQLAlchemy, psycopg2-binary |
| Frontend | React, Recharts, Axios, lucide-react |
| Chrome Extension | JavaScript, Manifest V3, WebNavigation API |
| Hosting | Render (API + Dashboard), Supabase (DB) |

---

## 🚀 Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- Chrome browser
- VirusTotal API key (free at virustotal.com)

### 1. Clone the repo

```bash
git clone https://github.com/SriramSatvik-dev/PhishGuard.git
cd PhishGuard
```

### 2. Set up Python environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```
VIRUSTOTAL_API_KEY=your_key_here
ALLOWED_ORIGINS=http://localhost:3000
```

### 4. Run the backend

```bash
uvicorn backend.main:app --reload --port 8000
```

API is now live at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

### 5. Run the dashboard

```bash
cd dashboard
npm install
npm start
```

Dashboard is now live at `http://localhost:3000`

### 6. Load the Chrome extension

1. Open Chrome → `chrome://extensions`
2. Enable **Developer Mode** (top right toggle)
3. Click **Load unpacked** → select the `extension/` folder
4. Pin PhishGuard to your toolbar (puzzle piece icon)

---

## 📁 Project Structure

```
PhishGuard/
├── backend/
│   ├── main.py                 # FastAPI app and routes
│   ├── model_loader.py         # XGBoost model loading and inference
│   ├── feature_extractor.py    # URL feature extraction (18 features)
│   ├── threat_intel.py         # VirusTotal + URLhaus API calls
│   ├── dns_whois.py            # DNS resolution + typosquatting
│   ├── score_synthesizer.py    # Weighted risk score combination
│   └── database.py             # SQLAlchemy models + CRUD
├── ml/
│   ├── models/
│   │   ├── final_model.json    # Trained XGBoost model (native format)
│   │   └── feature_names.pkl   # Feature column names for inference
│   └── notebooks/
│       └── training.ipynb      # Full training pipeline
├── dashboard/
│   ├── src/
│   │   ├── App.js              # Main dashboard component
│   │   └── components/
│   │       ├── StatsCards.jsx  # Summary statistics cards
│   │       ├── RiskChart.jsx   # Pie + bar charts
│   │       ├── ScanTable.jsx   # History table with search + export
│   │       └── ScanModal.jsx   # Full scan report modal
│   └── public/
├── extension/
│   ├── manifest.json           # Chrome Manifest V3 config
│   ├── background.js           # Service worker - auto scanning
│   ├── content.js              # Warning banner injection
│   ├── popup.html              # Extension popup UI
│   └── popup.js                # Popup logic
└── requirements.txt
```

---

## 🔌 API Reference

**Base URL:** `https://phishguard-api-8l8a.onrender.com`

### Scan a URL

```http
POST /scan
Content-Type: application/json

{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "risk_score": 48,
  "verdict": "suspicious",
  "color": "orange",
  "flags": [
    "URL structure highly suspicious — ML confidence 99.8%",
    "VirusTotal: 2 engines marked suspicious",
    "Domain does not resolve — likely fake or inactive"
  ],
  "ml": { "ml_verdict": "phishing", "ml_confidence": 99.8, "ml_phishing_probability": 99.8 },
  "threat_intel": { "vt_malicious": 0, "vt_suspicious": 2, "urlhaus_listed": false },
  "dns_whois": { "dns_resolves": false, "is_typosquat": false }
}
```

### Get scan history

```http
GET /history?limit=50
```

### Get statistics

```http
GET /stats
```

### Health check

```http
GET /health
```

---

## 🔒 Risk Score Breakdown

| Score | Verdict | Meaning |
|---|---|---|
| 0 – 44 | 🟢 Legitimate | No significant risk signals detected |
| 45 – 74 | 🟠 Suspicious | One or more risk signals present — proceed with caution |
| 75 – 100 | 🔴 Phishing | Multiple confirmed risk signals — do not proceed |

---

## ⚠️ Limitations

- The ML model operates on URL structure only — a carefully crafted URL can evade it. The threat intelligence layer compensates for this.
- WHOIS-based domain age analysis is disabled in the cloud deployment as hosting providers block outbound WHOIS connections (port 43).
- VirusTotal free tier allows 4 requests/minute — high traffic may cause rate limiting.

---

## 👤 Author

**Sriram Satvik**
IIT Guwahati — B.Tech Electronics and Electrical Engineering

[![GitHub](https://img.shields.io/badge/GitHub-SriramSatvik--dev-black?logo=github)](https://github.com/SriramSatvik-dev)