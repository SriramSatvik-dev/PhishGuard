import requests
import os
import base64
from dotenv import load_dotenv

load_dotenv()
VT_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")


def check_virustotal(url: str) -> dict:
    """
    Submit URL to VirusTotal and get how many
    security engines flagged it as malicious.
    """
    if not VT_API_KEY:
        return {"vt_malicious": 0, "vt_total": 0, "vt_checked": False}

    headers = {"x-apikey": VT_API_KEY}

    try:
        # VirusTotal requires URL to be base64 encoded for lookup
        url_id   = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
        response = requests.get(
            f"https://www.virustotal.com/api/v3/urls/{url_id}",
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            stats = response.json()["data"]["attributes"]["last_analysis_stats"]
            return {
                "vt_malicious"  : stats.get("malicious", 0),
                "vt_suspicious" : stats.get("suspicious", 0),
                "vt_total"      : sum(stats.values()),
                "vt_checked"    : True
            }

        # URL not in VT database yet — submit it
        elif response.status_code == 404:
            requests.post(
                "https://www.virustotal.com/api/v3/urls",
                headers=headers,
                data={"url": url},
                timeout=5
            )
            return {"vt_malicious": 0, "vt_total": 0, "vt_checked": False,
                    "vt_note": "URL submitted for first-time analysis"}

    except requests.exceptions.Timeout:
        return {"vt_malicious": 0, "vt_total": 0, "vt_checked": False,
                "vt_note": "VirusTotal timeout"}
    except Exception as e:
        return {"vt_malicious": 0, "vt_total": 0, "vt_checked": False}


def check_urlhaus(url: str) -> dict:
    """
    Check if URL is in URLhaus active malware database.
    URLhaus is free and needs no API key.
    """
    try:
        response = requests.post(
            "https://urlhaus-api.abuse.ch/v1/url/",
            data={"url": url},
            timeout=5
        )
        data = response.json()

        is_listed = data.get("query_status") == "is_listed"
        return {
            "urlhaus_listed"  : is_listed,
            "urlhaus_threat"  : data.get("threat", None) if is_listed else None,
            "urlhaus_checked" : True
        }

    except Exception:
        return {"urlhaus_listed": False, "urlhaus_checked": False}