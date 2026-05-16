import re
import math
from urllib.parse import urlparse


def extract_features(url):
    features = {}
    
    try:
        parsed   = urlparse(url)
        scheme   = parsed.scheme            # "http" or "https"
        domain   = parsed.netloc            # "www.paypal.com"
        path     = parsed.path              # "/login/verify"
        query    = parsed.query             # "id=123&token=abc"
        fragment = parsed.fragment          # "#section"
        
        # Strip port from domain if present: "paypal.com:8080" → "paypal.com"
        domain_clean = domain.split(":")[0]
        
        # Separate subdomain from registered domain
        # e.g. "secure.login.paypal.com" → parts = ["secure","login","paypal","com"]
        parts = domain_clean.split(".")
        
    except Exception:
        return None


    # =========================================================
    # GROUP 1: Length-based features
    # Phishing URLs tend to be longer because they pack in
    # fake brand names, random strings, and long paths
    # =========================================================
    features["url_length"]      = len(url)
    features["domain_length"]   = len(domain_clean)
    features["path_length"]     = len(path)
    features["query_length"]    = len(query)


    # =========================================================
    # GROUP 2: Count-based character features
    # Phishing URLs use more special characters to obfuscate
    # =========================================================
    features["num_dots"]              = url.count(".")
    features["num_hyphens"]           = url.count("-")
    features["num_underscores"]       = url.count("_")
    features["num_slashes"]           = url.count("/")
    features["num_question_marks"]    = url.count("?")
    features["num_equals"]            = url.count("=")
    features["num_at_signs"]          = url.count("@")   # trick: user@paypal.com@evil.com
    features["num_percent"]           = url.count("%")   # URL encoding obfuscation
    features["num_ampersands"]        = url.count("&")
    features["num_hash"]              = url.count("#")
    features["num_digits_in_domain"]  = sum(c.isdigit() for c in domain_clean)
    features["num_digits_in_url"]     = sum(c.isdigit() for c in url)


    # =========================================================
    # GROUP 3: Domain structure features
    # =========================================================
    # Number of subdomains: "a.b.google.com" has 2 subdomains
    features["num_subdomains"] = max(0, len(parts) - 2)

    # TLD (top level domain): .com vs .tk vs .xyz
    features["tld"] = parts[-1] if parts else ""

    # Suspicious free TLDs commonly used by attackers
    suspicious_tlds = {"tk", "ml", "ga", "cf", "gq", "xyz",
                       "top", "click", "link", "work", "date"}
    features["is_suspicious_tld"] = int(
        features["tld"].lower() in suspicious_tlds
    )

    # Domain has hyphens (legitimate brands rarely use hyphens)
    features["domain_has_hyphen"] = int("-" in domain_clean)

    # Domain has digits (e.g. paypa1.com)
    features["domain_has_digits"] = int(
        any(c.isdigit() for c in domain_clean)
    )


    # =========================================================
    # GROUP 4: Protocol / security features
    # =========================================================
    features["has_https"]    = int(scheme == "https")
    features["has_http"]     = int(scheme == "http")

    # Raw IP address instead of domain name — strong phishing signal
    ip_pattern = r"^(\d{1,3}\.){3}\d{1,3}$"
    features["has_ip_address"] = int(
        bool(re.match(ip_pattern, domain_clean))
    )

    # Port number present in URL (unusual for normal browsing)
    features["has_port"] = int(":" in domain)


    # =========================================================
    # GROUP 5: Entropy features
    # Entropy measures randomness. Phishing domains are often
    # randomly generated: "xk92jdn.com" (high entropy)
    # vs "google.com" (low entropy, recognisable)
    # =========================================================
    def shannon_entropy(s):
        if not s or len(s) == 0:
            return 0
        freq = {}
        for c in s:
            freq[c] = freq.get(c, 0) + 1
        probs = [f / len(s) for f in freq.values()]
        return -sum(p * math.log2(p) for p in probs)

    features["domain_entropy"] = round(shannon_entropy(domain_clean), 4)
    features["url_entropy"]    = round(shannon_entropy(url), 4)
    features["path_entropy"]   = round(shannon_entropy(path), 4)


    # =========================================================
    # GROUP 6: Keyword / brand impersonation features
    # Phishing URLs often include brand names to look convincing
    # =========================================================
    brand_keywords = [
        "paypal", "google", "facebook", "amazon", "apple",
        "microsoft", "netflix", "instagram", "twitter", "linkedin",
        "bank", "secure", "login", "signin", "verify", "account",
        "update", "confirm", "billing", "password", "credential"
    ]
    url_lower = url.lower()
    features["num_brand_keywords"] = sum(
        kw in url_lower for kw in brand_keywords
    )
    features["has_login_keyword"]  = int(
        any(kw in url_lower for kw in ["login", "signin", "sign-in"])
    )
    features["has_verify_keyword"] = int(
        any(kw in url_lower for kw in ["verify", "confirm", "validate"])
    )
    features["has_secure_keyword"] = int("secure" in url_lower)
    features["has_bank_keyword"]   = int(
        any(kw in url_lower for kw in ["bank", "banking", "payment", "billing"])
    )


    # =========================================================
    # GROUP 7: Path and query features
    # =========================================================
    # Depth of the path: /a/b/c/d = depth 4
    features["path_depth"] = path.count("/")

    # Number of query parameters
    features["num_query_params"] = len(query.split("&")) if query else 0

    # Double slash in URL (common obfuscation trick)
    features["has_double_slash"] = int("//" in path)

    # Presence of encoded characters in path
    features["path_has_encoded"] = int("%" in path)


    # =========================================================
    # GROUP 8: Token / word features
    # =========================================================
    # Tokenize the domain by splitting on dots, hyphens, digits
    tokens = re.split(r"[\.\-\_\d]", domain_clean)
    tokens = [t for t in tokens if len(t) > 1]
    features["num_domain_tokens"] = len(tokens)

    # Longest word in domain — real brands have short, clean names
    features["longest_domain_token"] = max(
        (len(t) for t in tokens), default=0
    )

    return features