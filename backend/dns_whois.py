import whois
import dns.resolver
from datetime import datetime
from difflib import SequenceMatcher
from urllib.parse import urlparse


# Load top 1000 well-known domains for typosquatting check
# In production you'd load the full Tranco list
TOP_DOMAINS = [
    "google.com", "youtube.com", "facebook.com", "amazon.com",
    "twitter.com", "instagram.com", "linkedin.com", "microsoft.com",
    "apple.com", "netflix.com", "paypal.com", "ebay.com",
    "wikipedia.org", "reddit.com", "github.com", "stackoverflow.com",
    "dropbox.com", "spotify.com", "adobe.com", "wordpress.com"
    # add more from your Tranco list
]


def get_domain(url: str) -> str:
    try:
        return urlparse(url).netloc.split(":")[0]
    except:
        return ""


def check_whois(domain: str) -> dict:
    try:
        w           = whois.whois(domain)
        creation    = w.creation_date
        expiration  = w.expiration_date

        # whois sometimes returns a list instead of a single date
        if isinstance(creation, list):
            creation = creation[0]
        if isinstance(expiration, list):
            expiration = expiration[0]

        age_days = (datetime.now() - creation).days if creation else None

        return {
            "domain_age_days"   : age_days,
            "newly_registered"  : age_days < 30 if age_days else True,
            "registrar"         : w.registrar,
            "whois_checked"     : True
        }

    except Exception:
        # If WHOIS fails, domain is probably fake or very new
        return {
            "domain_age_days"  : None,
            "newly_registered" : True,
            "registrar"        : None,
            "whois_checked"    : False
        }


def check_dns(domain: str) -> dict:
    try:
        answers = dns.resolver.resolve(domain, "A")
        return {
            "dns_resolves" : True,
            "ip_address"   : str(answers[0])
        }
    except Exception:
        return {
            "dns_resolves" : False,
            "ip_address"   : None
        }


def check_typosquatting(domain: str) -> dict:
    # Strip www. for cleaner comparison
    domain_clean = domain.replace("www.", "")

    best_match  = None
    best_score  = 0.0

    for legit in TOP_DOMAINS:
        # Don't flag the real domain itself
        if domain_clean == legit:
            return {"is_typosquat": False, "typosquat_of": None}

        score = SequenceMatcher(None, domain_clean, legit).ratio()
        if score > best_score:
            best_score = score
            best_match = legit

    # Threshold: 0.85 means very similar but not identical
    is_typosquat = best_score >= 0.85 and domain_clean != best_match

    return {
        "is_typosquat"  : is_typosquat,
        "typosquat_of"  : best_match if is_typosquat else None,
        "similarity"    : round(best_score, 3)
    }


def run_dns_whois(url: str) -> dict:
    domain = get_domain(url)
    result = {}
    result["domain"] = domain

    # WHOIS is blocked on Railway's network — skip it entirely
    # to avoid slow timeouts on every request
    result.update({
        "domain_age_days"  : None,
        "newly_registered" : False,   # ← don't assume newly registered
        "registrar"        : None,
        "whois_checked"    : False
    })

    result.update(check_dns(domain))
    result.update(check_typosquatting(domain))
    return result