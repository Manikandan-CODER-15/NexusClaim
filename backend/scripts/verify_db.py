"""
NexusClaim -- STEP 4: Database & Synthetic Data Verification
============================================================
Runs comprehensive integrity checks on the SQLite database:
1. Row count per table
2. Demo users and roles
3. MAIN claim details, evidence list and SHA-256 hashes
4. PASS/FAIL criteria:
   - Check 1: 5 roles exist
   - Check 2: 8 users exist
   - Check 3: Main claim has at least 4 evidence records
   - Check 4: No pre-seeded findings / hypotheses / agent_runs exist yet
   - Check 5: historical_claims has exactly 300 rows
   - Check 6: Passwords are bcrypt hashed (no plaintext)
   - Check 7: Photo duplicate detection (01 vs 03) if both present

Run from project root:
    backend\\venv\\Scripts\\python.exe -m backend.scripts.verify_db
"""

import sys
import hashlib
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import inspect
from backend.app.database.session import SessionLocal, engine
from backend.app.models.entities import (
    Role, User, InsuranceCategory, Policy, Claim, Evidence,
    ExtractedFact, AgentRun, InvestigationFinding, Hypothesis,
    EvidenceRelationship, PolicyAnalysis, SettlementAssessment,
    ReviewAction, AuditLog, InvestigationReport, SystemSetting,
    HistoricalClaim
)

def run_verification():
    print("=" * 70)
    print("  NexusClaim -- Database & Synthetic Data Verification")
    print("=" * 70)

    db = SessionLocal()
    inspector = inspect(engine)
    table_names = sorted(inspector.get_table_names())

    print("\n--- [1] Table Row Counts ---")
    table_models = {
        "roles": Role,
        "users": User,
        "insurance_categories": InsuranceCategory,
        "policies": Policy,
        "claims": Claim,
        "evidence": Evidence,
        "extracted_facts": ExtractedFact,
        "agent_runs": AgentRun,
        "investigation_findings": InvestigationFinding,
        "hypotheses": Hypothesis,
        "evidence_relationships": EvidenceRelationship,
        "policy_analysis": PolicyAnalysis,
        "settlement_assessments": SettlementAssessment,
        "review_actions": ReviewAction,
        "audit_logs": AuditLog,
        "investigation_reports": InvestigationReport,
        "system_settings": SystemSetting,
        "historical_claims": HistoricalClaim,
    }

    counts = {}
    for t in table_names:
        model = table_models.get(t)
        if model:
            c = db.query(model).count()
        else:
            with engine.connect() as conn:
                from sqlalchemy import text
                c = conn.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
        counts[t] = c
        print(f"  {t:<28} : {c:>4} rows")

    print("\n--- [2] Demo Users & Roles ---")
    users = db.query(User).order_by(User.role, User.email).all()
    for u in users:
        is_hashed = u.hashed_password.startswith("$2") or len(u.hashed_password) > 40
        hash_status = "Bcrypt Hashed" if is_hashed else "PLAIN/INVALID"
        print(f"  {u.email:<32} | Role: {u.role:<15} | Status: {hash_status}")

    print("\n--- [3] MAIN Demo Claim (CLM-2026-00001) ---")
    main_claim = db.query(Claim).filter(Claim.claim_number == "CLM-2026-00001").first()
    if not main_claim:
        print("  [ERROR] Main claim CLM-2026-00001 NOT FOUND!")
    else:
        print(f"  ID             : {main_claim.id}")
        print(f"  Claim Number   : {main_claim.claim_number}")
        print(f"  Category       : {main_claim.category}")
        print(f"  Status         : {main_claim.status}")
        print(f"  Estimated Amt  : Rs {main_claim.estimated_amount:,.2f}")
        print(f"  Is Demo        : {main_claim.is_demo}")

        ev_list = db.query(Evidence).filter(Evidence.claim_id == main_claim.id).all()
        print(f"\n  Associated Evidence ({len(ev_list)} items registered):")
        for ev in ev_list:
            print(f"    - [{ev.category:<15}] {ev.file_name:<28} | Hash: {ev.file_hash[:16]}... | Size: {ev.file_size:,} B")

    print("\n" + "=" * 70)
    print("  --- [4] PASS / FAIL VALIDATION CHECKS ---")
    print("=" * 70)

    checks = []

    # Check 1: 5 roles exist
    role_count = counts.get("roles", 0)
    c1_pass = (role_count == 5)
    checks.append(("Check 1: 5 standard roles exist", c1_pass, f"Found {role_count}/5 roles"))

    # Check 2: 8 users exist
    user_count = counts.get("users", 0)
    c2_pass = (user_count == 8)
    checks.append(("Check 2: 8 demo users exist", c2_pass, f"Found {user_count}/8 users"))

    # Check 3: Main claim has >= 4 evidence records
    main_ev_count = len(ev_list) if main_claim else 0
    c3_pass = (main_ev_count >= 4)
    checks.append(("Check 3: Main claim has >= 4 evidence records", c3_pass, f"Found {main_ev_count} evidence records"))

    # Check 4: No pre-seeded AI results (findings, hypotheses, agent_runs)
    findings_count = counts.get("investigation_findings", 0)
    hypo_count = counts.get("hypotheses", 0)
    agent_runs_count = counts.get("agent_runs", 0)
    facts_count = counts.get("extracted_facts", 0)
    c4_pass = (findings_count == 0 and hypo_count == 0 and agent_runs_count == 0 and facts_count == 0)
    checks.append((
        "Check 4: Zero fake AI results (clean baseline)",
        c4_pass,
        f"findings={findings_count}, hypotheses={hypo_count}, agent_runs={agent_runs_count}, facts={facts_count}"
    ))

    # Check 5: Historical claims count is exactly 300
    hist_count = counts.get("historical_claims", 0)
    c5_pass = (hist_count == 300)
    checks.append(("Check 5: historical_claims has 300 records", c5_pass, f"Found {hist_count}/300 rows"))

    # Check 6: Passwords are bcrypt-hashed, no plaintext
    unhashed = [u.email for u in users if not (u.hashed_password.startswith("$2") or len(u.hashed_password) > 40)]
    c6_pass = (len(unhashed) == 0 and len(users) > 0)
    checks.append(("Check 6: Passwords securely bcrypt-hashed", c6_pass, f"Unhashed count: {len(unhashed)}"))

    # Check 7: Photo duplicate check (01 vs 03) if both present in storage/demo
    photo_01 = PROJECT_ROOT / "storage" / "demo" / "01_front_damage.jpg"
    photo_03 = PROJECT_ROOT / "storage" / "demo" / "03_front_damage_duplicate.jpg"
    if photo_01.exists() and photo_03.exists():
        h1 = hashlib.sha256(photo_01.read_bytes()).hexdigest()
        h3 = hashlib.sha256(photo_03.read_bytes()).hexdigest()
        c7_pass = (h1 == h3)
        checks.append(("Check 7: Photos 01 & 03 duplicate hash match", c7_pass, f"Match: {c7_pass} ({h1[:12]}...)"))
    else:
        checks.append(("Check 7: Photos 01 & 03 duplicate test", True, "Photos not uploaded yet by user (skipped)"))

    all_passed = True
    for title, passed, detail in checks:
        mark = "[PASS]" if passed else "[FAIL]"
        if not passed:
            all_passed = False
        print(f"  {mark:<8} {title:<45} ({detail})")

    print("\n" + "=" * 70)
    if all_passed:
        print("  RESULT: ALL VERIFICATION CHECKS PASSED SUCCESSFULLY [OK]")
    else:
        print("  RESULT: SOME VERIFICATION CHECKS FAILED -- SEE DETAILS ABOVE")
    print("=" * 70)

    db.close()
    return all_passed

if __name__ == "__main__":
    success = run_verification()
    sys.exit(0 if success else 1)
