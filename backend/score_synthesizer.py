def synthesize(ml_result: dict, ti_result: dict, dns_result: dict) -> dict:
    score = 0
    flags = []

    # ─────────────────────────────────────────
    # ML layer (max 30 points — supporting signal only)
    # 
    # The model sees URL structure, not behavior.
    # It's useful as a first filter but shouldn't
    # dominate the final verdict on its own.
    # Only contribute meaningfully at high confidence.
    # ─────────────────────────────────────────
    ml_prob = ml_result.get("ml_phishing_probability", 0)

    if ml_prob >= 90:
        ml_score = 30
        flags.append(f"URL structure highly suspicious — ML confidence {ml_prob:.1f}%")
    elif ml_prob >= 80:
        ml_score = 20
        flags.append(f"URL structure looks suspicious — ML confidence {ml_prob:.1f}%")
    elif ml_prob >= 65:
        ml_score = 10
        # Uncertain range — contribute small score, no flag
    else:
        ml_score = 0
        # Model considers it legitimate — no contribution

    score += ml_score


    # ─────────────────────────────────────────
    # Threat intelligence layer (max 45 points)
    #
    # This is verified ground truth — real security
    # engines and community-confirmed malware databases.
    # A single hit here is far more reliable than
    # any ML model prediction.
    # ─────────────────────────────────────────
    vt_malicious  = ti_result.get("vt_malicious", 0)
    vt_suspicious = ti_result.get("vt_suspicious", 0)
    vt_total      = ti_result.get("vt_total", 1)

    if vt_malicious >= 5:
        score += 45
        flags.append(f"VirusTotal: {vt_malicious}/{vt_total} engines confirmed malicious")
    elif vt_malicious >= 2:
        score += 30
        flags.append(f"VirusTotal: {vt_malicious}/{vt_total} engines flagged")
    elif vt_malicious == 1:
        score += 10
        flags.append(f"VirusTotal: 1 engine flagged — verify manually")
    elif vt_suspicious >= 3:
        score += 15
        flags.append(f"VirusTotal: {vt_suspicious} engines marked suspicious")
    elif vt_suspicious >= 1:
        score += 8
        flags.append(f"VirusTotal: {vt_suspicious} engines marked suspicious")

    # ─────────────────────────────────────────
    # DNS / WHOIS layer (max 25 points)
    #
    # Domain forensics — particularly domain age is
    # a strong signal because phishing campaigns
    # almost always use freshly registered domains.
    # ─────────────────────────────────────────
    whois_checked = dns_result.get("whois_checked", False)
    age_days      = dns_result.get("domain_age_days")

    if whois_checked and age_days is not None:
        if age_days < 7:
            score += 25
            flags.append(f"Domain registered only {age_days} days ago — extremely new")
        elif age_days < 30:
            score += 15
            flags.append(f"Domain recently registered ({age_days} days ago)")
        elif age_days < 90:
            score += 5
            # Young but not alarming — no flag

    if not dns_result.get("dns_resolves", True):
        score += 10
        flags.append("Domain does not resolve — likely fake or inactive")

    # Typosquatting check
    if dns_result.get("is_typosquat"):
        similarity   = dns_result.get("similarity", 0)
        typosquat_of = dns_result.get("typosquat_of", "")
        domain       = dns_result.get("domain", "")

        same_base = (
            domain.replace("www.", "").split(".")[0] ==
            typosquat_of.replace("www.", "").split(".")[0]
        )

        if not same_base and similarity >= 0.90:
            score += 20
            flags.append(
                f"Typosquatting — domain closely imitates {typosquat_of}"
            )
        elif not same_base and similarity >= 0.85:
            score += 8
            flags.append(
                f"Domain name similar to {typosquat_of} — verify carefully"
            )


    # ─────────────────────────────────────────
    # Clamp and verdict
    # ─────────────────────────────────────────
    score = min(100, max(0, round(score)))

    if score >= 75:
        verdict = "phishing"
        color   = "red"
    elif score >= 45:
        verdict = "suspicious"
        color   = "orange"
    else:
        verdict = "legitimate"
        color   = "green"

    # print(f"DEBUG synthesize: ml={ml_prob}, vt={vt_malicious}, score={score}, verdict={verdict}")

    return {
        "risk_score"   : score,
        "verdict"      : verdict,
        "color"        : color,
        "flags"        : flags,
        "ml"           : ml_result,
        "threat_intel" : ti_result,
        "dns_whois"    : dns_result
    }