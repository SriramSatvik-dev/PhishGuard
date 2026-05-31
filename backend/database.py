import os
import json
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import (create_engine, Column, Integer, String,
                        Float, Boolean, Text, DateTime)
from sqlalchemy.orm import declarative_base, sessionmaker
from contextlib import contextmanager

load_dotenv()

# Uses PostgreSQL in production, SQLite locally
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./phishguard.db"
)

# Railway gives Postgres URLs starting with postgres://
# SQLAlchemy needs postgresql:// — fix it automatically
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Replace your current create_engine call with this:
if "supabase" in DATABASE_URL or "amazonaws" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"sslmode": "require"}
    )
else:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
        if "sqlite" in DATABASE_URL else {}
    )

SessionLocal = sessionmaker(bind=engine)
Base         = declarative_base()


# ─────────────────────────────────────────
# Table schema
# ─────────────────────────────────────────
class Scan(Base):
    __tablename__ = "scans"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    url             = Column(String,  nullable=False)
    verdict         = Column(String,  nullable=False)
    risk_score      = Column(Integer, nullable=False)
    flags           = Column(Text)
    ml_verdict      = Column(String)
    ml_confidence   = Column(Float)
    vt_malicious    = Column(Integer)
    urlhaus_listed  = Column(Boolean)
    domain_age_days = Column(Integer)
    is_typosquat    = Column(Boolean)
    full_report     = Column(Text)
    scanned_at      = Column(DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────
# Connection manager
# ─────────────────────────────────────────
@contextmanager
def get_session():
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()


# ─────────────────────────────────────────
# Create tables
# ─────────────────────────────────────────
def init_db():
    Base.metadata.create_all(bind=engine)
    print(f"Database initialised: {DATABASE_URL.split('@')[-1]}")


# ─────────────────────────────────────────
# Save scan
# ─────────────────────────────────────────
def save_scan(url: str, result: dict):
    ml  = result.get("ml", {})
    ti  = result.get("threat_intel", {})
    dns = result.get("dns_whois", {})

    with get_session() as session:
        scan = Scan(
            url             = url,
            verdict         = result.get("verdict"),
            risk_score      = result.get("risk_score"),
            flags           = json.dumps(result.get("flags", [])),
            ml_verdict      = ml.get("ml_verdict"),
            ml_confidence   = ml.get("ml_confidence"),
            vt_malicious    = ti.get("vt_malicious", 0),
            urlhaus_listed  = ti.get("urlhaus_listed", False),
            domain_age_days = dns.get("domain_age_days"),
            is_typosquat    = dns.get("is_typosquat", False),
            full_report     = json.dumps(result),
            scanned_at      = datetime.utcnow()
        )
        session.add(scan)


# ─────────────────────────────────────────
# Get history
# ─────────────────────────────────────────
def get_history(limit: int = 50) -> list:
    with get_session() as session:
        scans = (session.query(Scan)
                 .order_by(Scan.scanned_at.desc())
                 .limit(limit)
                 .all())
        return [
            {
                "url"            : s.url,
                "verdict"        : s.verdict,
                "risk_score"     : s.risk_score,
                "flags"          : json.loads(s.flags or "[]"),
                "ml_verdict"     : s.ml_verdict,
                "vt_malicious"   : s.vt_malicious,
                "is_typosquat"   : s.is_typosquat,
                "domain_age_days": s.domain_age_days,
                "scanned_at"     : s.scanned_at.isoformat()
            }
            for s in scans
        ]


# ─────────────────────────────────────────
# Get stats
# ─────────────────────────────────────────
def get_stats() -> dict:
    with get_session() as session:
        from sqlalchemy import func

        total = session.query(func.count(Scan.id)).scalar()

        by_verdict = (session.query(Scan.verdict, func.count(Scan.id))
                      .group_by(Scan.verdict)
                      .all())

        avg_score = session.query(func.avg(Scan.risk_score)).scalar()

    return {
        "total_scans"    : total or 0,
        "avg_risk_score" : round(float(avg_score or 0), 1),
        "by_verdict"     : {v: c for v, c in by_verdict}
    }


# ─────────────────────────────────────────
# Clear history
# ─────────────────────────────────────────
def clear_history():
    with get_session() as session:
        session.query(Scan).delete()
    print("Scan history cleared.")