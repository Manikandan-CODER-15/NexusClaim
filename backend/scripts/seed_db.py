"""
NexusClaim -- STEP 3: Seed the Database (Idempotent)
=====================================================
Populates roles, users, categories, policies, claims, evidence and
historical_claims.  Safe to run multiple times -- skips existing records.

ALL DATA IS SYNTHETIC DEMO DATA.
No findings, hypotheses, agent_runs, or AI output is seeded.

Run from project root:
    backend\\venv\\Scripts\\python.exe -m backend.scripts.seed_db
"""

import os
import sys
import csv
import hashlib
import uuid
from datetime import datetime, timedelta
from pathlib import Path

# ---------------------------------------------------------------------------
# Bootstrap -- ensure project root is on sys.path
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.database.session import SessionLocal, engine, Base
from backend.app.models.entities import (
    Role, User, InsuranceCategory, Policy, Claim, Evidence,
    AuditLog, HistoricalClaim
)
from backend.app.utils.security import get_password_hash

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
STORAGE_DEMO = PROJECT_ROOT / "storage" / "demo"
DATA_DIR = PROJECT_ROOT / "backend" / "app" / "data"

def uid():
    return str(uuid.uuid4())

def now():
    return datetime.utcnow()

def file_sha256(filepath: Path) -> str:
    """Compute SHA-256 hash of a file."""
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


# ===================================================================
# 1. ROLES
# ===================================================================
ROLES_DATA = [
    {"name": "admin",        "description": "Full system administrator"},
    {"name": "end_user",     "description": "Insurance claimant / policyholder"},
    {"name": "investigator", "description": "Claims investigator / analyst"},
    {"name": "manager",      "description": "Claims director / decision maker"},
    {"name": "fraud_risk",   "description": "Fraud and risk assessment specialist"},
]

def seed_roles(db):
    created = 0
    for rd in ROLES_DATA:
        exists = db.query(Role).filter(Role.name == rd["name"]).first()
        if not exists:
            db.add(Role(id=uid(), **rd, created_at=now()))
            created += 1
    db.flush()
    print(f"  Roles: {created} created, {len(ROLES_DATA) - created} already existed")
    return created


# ===================================================================
# 2. USERS
# ===================================================================
USERS_DATA = [
    # email, password, full_name, role
    ("admin@nexusclaim.demo",        "Admin@123",   "Eleanor Vance (Admin)",          "admin"),
    ("enduser@nexusclaim.demo",      "User@123",    "Arun Vijayan",                   "end_user"),
    ("investigator@nexusclaim.demo", "Invest@123",  "Priya Sharma (Investigator)",    "investigator"),
    ("manager@nexusclaim.demo",      "Manager@123", "Marcus Aurelius (Claims Director)", "manager"),
    ("risk@nexusclaim.demo",         "Risk@123",    "Deepak Nair (Risk Analyst)",     "fraud_risk"),
    # Extra end users
    ("user2@nexusclaim.demo",        "User@123",    "Kavitha Rajan",                  "end_user"),
    ("user3@nexusclaim.demo",        "User@123",    "Suresh Kumar",                   "end_user"),
    # Extra investigator
    ("inv2@nexusclaim.demo",         "Invest@123",  "Lakshmi Devi (Investigator)",    "investigator"),
]

def seed_users(db):
    created = 0
    user_map = {}  # email -> user id
    for email, pwd, full_name, role in USERS_DATA:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            user_map[email] = existing.id
        else:
            u = User(
                id=uid(),
                email=email,
                hashed_password=get_password_hash(pwd),
                full_name=full_name,
                role=role,
                is_active=True,
                created_at=now(),
                updated_at=now(),
            )
            db.add(u)
            db.flush()
            user_map[email] = u.id
            created += 1
    print(f"  Users: {created} created, {len(USERS_DATA) - created} already existed")
    return user_map


# ===================================================================
# 3. INSURANCE CATEGORIES
# ===================================================================
CATEGORIES_DATA = [
    ("motor",  "Motor",  "Motor vehicle insurance claims"),
    ("health", "Health", "Health and medical insurance claims"),
    ("home",   "Home",   "Home and property insurance claims"),
    ("travel", "Travel", "Travel insurance claims"),
]

def seed_categories(db):
    created = 0
    for code, name, desc in CATEGORIES_DATA:
        exists = db.query(InsuranceCategory).filter(InsuranceCategory.code == code).first()
        if not exists:
            db.add(InsuranceCategory(
                id=uid(), code=code, name=name,
                description=desc, is_active=True, created_at=now()
            ))
            created += 1
    db.flush()
    print(f"  Categories: {created} created, {len(CATEGORIES_DATA) - created} already existed")
    return created


# ===================================================================
# 4. POLICIES
# ===================================================================
def seed_policies(db, user_map):
    created = 0
    policy_ids = []
    policies_data = [
        {
            "policy_number": "MOT-2026-NC-004417",
            "holder_email": "enduser@nexusclaim.demo",
            "title": "Comprehensive Motor Vehicle Insurance -- SYNTHETIC DEMO DATA",
            "category": "motor",
            "coverage_limit": 300000.0,
            "deductible": 5000.0,
            "terms_text": "Standard comprehensive motor policy with Rs 3,00,000 limit.",
            "pdf_path": "storage/demo/motor_policy.pdf",
            "start_date": datetime(2026, 1, 1),
            "end_date": datetime(2026, 12, 31),
        },
        {
            "policy_number": "MOT-2026-NC-005890",
            "holder_email": "user2@nexusclaim.demo",
            "title": "Third-Party Motor Insurance -- SYNTHETIC DEMO DATA",
            "category": "motor",
            "coverage_limit": 200000.0,
            "deductible": 3000.0,
            "terms_text": "Third-party motor liability policy.",
            "pdf_path": "storage/demo/motor_policy.pdf",
            "start_date": datetime(2026, 3, 15),
            "end_date": datetime(2027, 3, 14),
        },
        {
            "policy_number": "MOT-2026-NC-006201",
            "holder_email": "user3@nexusclaim.demo",
            "title": "Comprehensive Motor + PA Cover -- SYNTHETIC DEMO DATA",
            "category": "motor",
            "coverage_limit": 500000.0,
            "deductible": 7500.0,
            "terms_text": "Enhanced comprehensive motor with personal accident add-on.",
            "pdf_path": "storage/demo/motor_policy.pdf",
            "start_date": datetime(2026, 6, 1),
            "end_date": datetime(2027, 5, 31),
        },
    ]

    for pd in policies_data:
        exists = db.query(Policy).filter(Policy.policy_number == pd["policy_number"]).first()
        if exists:
            policy_ids.append(exists.id)
        else:
            pid = uid()
            holder_id = user_map.get(pd["holder_email"])
            db.add(Policy(
                id=pid,
                policy_number=pd["policy_number"],
                holder_id=holder_id,
                title=pd["title"],
                category=pd["category"],
                coverage_limit=pd["coverage_limit"],
                deductible=pd["deductible"],
                terms_text=pd["terms_text"],
                pdf_path=pd["pdf_path"],
                start_date=pd["start_date"],
                end_date=pd["end_date"],
                is_active=True,
                is_demo=True,
                created_at=now(),
                updated_at=now(),
            ))
            db.flush()
            policy_ids.append(pid)
            created += 1

    print(f"  Policies: {created} created, {len(policies_data) - created} already existed")
    return policy_ids


# ===================================================================
# 5. CLAIMS  (1 MAIN + 12 filler)
# ===================================================================
MAIN_CLAIM_NUMBER = "CLM-2026-00001"

def seed_claims(db, user_map, policy_ids):
    created = 0
    main_claim_id = None

    # --- MAIN demo claim ---
    existing_main = db.query(Claim).filter(Claim.claim_number == MAIN_CLAIM_NUMBER).first()
    if existing_main:
        main_claim_id = existing_main.id
    else:
        main_claim_id = uid()
        db.add(Claim(
            id=main_claim_id,
            claim_number=MAIN_CLAIM_NUMBER,
            claimant_id=user_map["enduser@nexusclaim.demo"],
            policy_id=policy_ids[0],
            category="motor",
            incident_date=datetime(2026, 10, 15, 8, 30),
            submission_date=datetime(2026, 10, 16),
            description=(
                "Vehicle rear-ended at Saidapet traffic signal. "
                "Damage to vehicle reported. SYNTHETIC DEMO DATA."
            ),
            status="submitted",
            priority="high",
            estimated_amount=67024.0,
            assigned_investigator_id=user_map["investigator@nexusclaim.demo"],
            is_demo=True,
            created_at=now(),
            updated_at=now(),
        ))
        created += 1
    db.flush()

    # --- 12 Filler claims ---
    end_users = [
        user_map["enduser@nexusclaim.demo"],
        user_map["user2@nexusclaim.demo"],
        user_map["user3@nexusclaim.demo"],
    ]
    investigators = [
        user_map["investigator@nexusclaim.demo"],
        user_map["inv2@nexusclaim.demo"],
    ]

    filler_claims = [
        # (claim_number, claimant_idx, category, status, priority, amount, days_ago, investigator_idx)
        ("CLM-2026-00002", 1, "motor",  "under_investigation", "medium", 45000,  60, 0),
        ("CLM-2026-00003", 2, "motor",  "approved",            "low",    32000,  90, 1),
        ("CLM-2026-00004", 0, "health", "submitted",           "medium", 85000,  15, None),
        ("CLM-2026-00005", 1, "health", "pending_review",      "high",   120000, 30, 0),
        ("CLM-2026-00006", 2, "home",   "submitted",           "low",    55000,  10, None),
        ("CLM-2026-00007", 0, "travel", "approved",            "low",    18000,  120, 1),
        ("CLM-2026-00008", 1, "motor",  "rejected",            "medium", 95000,  150, 0),
        ("CLM-2026-00009", 2, "health", "closed",              "low",    42000,  200, 1),
        ("CLM-2026-00010", 0, "motor",  "escalated",           "critical", 175000, 5, 0),
        ("CLM-2026-00011", 1, "home",   "under_investigation", "medium", 68000,  45, 1),
        ("CLM-2026-00012", 2, "travel", "pending_review",      "high",   29000,  25, 0),
        ("CLM-2026-00013", 0, "motor",  "submitted",           "medium", 52000,  3, None),
    ]

    for cn, ci, cat, status, prio, amt, days, inv_idx in filler_claims:
        exists = db.query(Claim).filter(Claim.claim_number == cn).first()
        if exists:
            continue

        inv_id = investigators[inv_idx] if inv_idx is not None else None
        incident = now() - timedelta(days=days + 1)
        submission = now() - timedelta(days=days)

        # Pick a policy for motor claims
        pol_id = None
        if cat == "motor" and policy_ids:
            pol_id = policy_ids[ci % len(policy_ids)]

        db.add(Claim(
            id=uid(),
            claim_number=cn,
            claimant_id=end_users[ci],
            policy_id=pol_id,
            category=cat,
            incident_date=incident,
            submission_date=submission,
            description=f"Filler claim for dashboard population. SYNTHETIC DEMO DATA. Category: {cat}.",
            status=status,
            priority=prio,
            estimated_amount=float(amt),
            assigned_investigator_id=inv_id,
            is_demo=True,
            created_at=now(),
            updated_at=now(),
        ))
        created += 1

    db.flush()
    print(f"  Claims: {created} created (1 MAIN + fillers), skipped existing")
    return main_claim_id


# ===================================================================
# 6. EVIDENCE for MAIN claim
# ===================================================================
DEMO_FILES = [
    # (file_name, relative_path, category, mime_type)
    ("claimant_statement.pdf",  "storage/demo/claimant_statement.pdf",  "statement",       "application/pdf"),
    ("repair_estimate.pdf",     "storage/demo/repair_estimate.pdf",     "repair_estimate",  "application/pdf"),
    ("motor_policy.pdf",        "storage/demo/motor_policy.pdf",        "policy_doc",       "application/pdf"),
    ("police_report.pdf",       "storage/demo/police_report.pdf",       "police_report",    "application/pdf"),
    ("01_front_damage.jpg",     "storage/demo/01_front_damage.jpg",     "photo",            "image/jpeg"),
    ("02_rear_side_damage.jpg", "storage/demo/02_rear_side_damage.jpg", "photo",            "image/jpeg"),
    ("03_front_damage_duplicate.jpg", "storage/demo/03_front_damage_duplicate.jpg", "photo", "image/jpeg"),
    ("04_spare.jpg",            "storage/demo/04_spare.jpg",            "photo",            "image/jpeg"),
]

def seed_evidence(db, main_claim_id, user_map):
    created = 0
    skipped = 0
    warnings = []
    uploader_id = user_map["enduser@nexusclaim.demo"]

    for file_name, rel_path, category, mime in DEMO_FILES:
        # Check if evidence already registered for this claim+file
        exists = db.query(Evidence).filter(
            Evidence.claim_id == main_claim_id,
            Evidence.file_name == file_name
        ).first()
        if exists:
            skipped += 1
            continue

        abs_path = PROJECT_ROOT / rel_path
        if not abs_path.exists():
            warnings.append(f"    WARNING: {rel_path} not found -- skipped")
            continue

        file_size = abs_path.stat().st_size
        file_hash = file_sha256(abs_path)

        db.add(Evidence(
            id=uid(),
            claim_id=main_claim_id,
            uploader_id=uploader_id,
            file_name=file_name,
            file_path=rel_path,
            file_hash=file_hash,
            file_size=file_size,
            mime_type=mime,
            category=category,
            source_label="SYNTHETIC DEMO DATA",
            is_demo=True,
            created_at=now(),
        ))
        created += 1

    db.flush()
    print(f"  Evidence: {created} created, {skipped} already existed")
    for w in warnings:
        print(w)
    return created


# ===================================================================
# 7. AUDIT LOG
# ===================================================================
def seed_audit_log(db, user_map):
    marker = "seed_completed"
    exists = db.query(AuditLog).filter(AuditLog.action == marker).first()
    if exists:
        print("  Audit log: seed_completed entry already exists")
        return
    db.add(AuditLog(
        id=uid(),
        user_id=user_map.get("admin@nexusclaim.demo"),
        action=marker,
        entity_type="system",
        entity_id="seed",
        details_json='{"message": "Database seeded with SYNTHETIC DEMO DATA"}',
        created_at=now(),
    ))
    db.flush()
    print("  Audit log: seed_completed entry created")


# ===================================================================
# 8. HISTORICAL CLAIMS from CSV
# ===================================================================
def seed_historical_claims(db):
    csv_path = DATA_DIR / "historical_claims.csv"
    if not csv_path.exists():
        print(f"  Historical claims: CSV not found at {csv_path} -- SKIPPED")
        return 0

    # Check if already loaded
    existing_count = db.query(HistoricalClaim).count()
    if existing_count >= 300:
        print(f"  Historical claims: {existing_count} rows already exist -- skipped")
        return existing_count

    # If partially loaded, clear and reload
    if existing_count > 0:
        db.query(HistoricalClaim).delete()
        db.flush()
        print(f"  Historical claims: cleared {existing_count} partial rows, reloading...")

    loaded = 0
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            db.add(HistoricalClaim(
                id=uid(),
                claim_id=row["claim_id"],
                incident_date=datetime.strptime(row["incident_date"], "%Y-%m-%d"),
                report_date=datetime.strptime(row["report_date"], "%Y-%m-%d"),
                days_to_report=int(row["days_to_report"]),
                estimate_amount=float(row["estimate_amount"]),
                policy_age_days=int(row["policy_age_days"]),
                claim_category=row["claim_category"],
                prior_claims_count=int(row["prior_claims_count"]),
                created_at=now(),
            ))
            loaded += 1

    db.flush()
    print(f"  Historical claims: {loaded} rows loaded from CSV")
    return loaded


# ===================================================================
# MAIN
# ===================================================================
def main():
    print("=" * 60)
    print("  NexusClaim -- STEP 3: Seed Database (Idempotent)")
    print("  ALL DATA IS SYNTHETIC DEMO DATA")
    print("=" * 60)
    print()

    # Ensure tables exist
    import backend.app.models.entities  # noqa
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("[1/8] Seeding roles ...")
        seed_roles(db)

        print("[2/8] Seeding users ...")
        user_map = seed_users(db)

        print("[3/8] Seeding insurance categories ...")
        seed_categories(db)

        print("[4/8] Seeding policies ...")
        policy_ids = seed_policies(db, user_map)

        print("[5/8] Seeding claims (1 MAIN + 12 filler) ...")
        main_claim_id = seed_claims(db, user_map, policy_ids)

        print("[6/8] Registering evidence for MAIN claim ...")
        seed_evidence(db, main_claim_id, user_map)

        print("[7/8] Creating audit log entry ...")
        seed_audit_log(db, user_map)

        print("[8/8] Loading historical claims from CSV ...")
        seed_historical_claims(db)

        db.commit()
        print()
        print("=" * 60)
        print("  SEED COMPLETE -- All data committed.")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"\nERROR: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

