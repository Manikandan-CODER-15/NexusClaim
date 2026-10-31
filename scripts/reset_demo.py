"""
NexusClaim -- Reset Demo Data
=============================
Deletes ONLY demo records (`is_demo = True`) and re-seeds with fresh synthetic demo data.
Preserves any non-demo real records.

Can be run as:
    backend\\venv\\Scripts\\python.exe -m backend.scripts.reset_demo
  or
    backend\\venv\\Scripts\\python.exe -m scripts.reset_demo
"""

import sys
from pathlib import Path

# Add project root and backend dir to sys.path so both module formats resolve
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from backend.app.database.session import SessionLocal
from backend.app.models.entities import (
    Claim, Evidence, Policy, AuditLog, ExtractedFact,
    InvestigationFinding, Hypothesis, EvidenceRelationship,
    AgentRun, PolicyAnalysis, SettlementAssessment,
    ReviewAction, InvestigationReport
)
from backend.scripts.seed_db import main as seed_main

def reset_demo():
    print("=" * 65)
    print("  NexusClaim -- Reset Demo Data")
    print("  Cleaning up `is_demo=True` records...")
    print("=" * 65)

    db = SessionLocal()
    try:
        # Find demo claims first
        demo_claim_ids = [c[0] for c in db.query(Claim.id).filter(Claim.is_demo == True).all()]

        if demo_claim_ids:
            # Delete any dependent records for demo claims (if any were run)
            db.query(ExtractedFact).filter(ExtractedFact.claim_id.in_(demo_claim_ids)).delete(synchronize_session=False)
            db.query(InvestigationFinding).filter(InvestigationFinding.claim_id.in_(demo_claim_ids)).delete(synchronize_session=False)
            db.query(Hypothesis).filter(Hypothesis.claim_id.in_(demo_claim_ids)).delete(synchronize_session=False)
            db.query(EvidenceRelationship).filter(EvidenceRelationship.claim_id.in_(demo_claim_ids)).delete(synchronize_session=False)
            db.query(AgentRun).filter(AgentRun.claim_id.in_(demo_claim_ids)).delete(synchronize_session=False)
            db.query(PolicyAnalysis).filter(PolicyAnalysis.claim_id.in_(demo_claim_ids)).delete(synchronize_session=False)
            db.query(SettlementAssessment).filter(SettlementAssessment.claim_id.in_(demo_claim_ids)).delete(synchronize_session=False)
            db.query(ReviewAction).filter(ReviewAction.claim_id.in_(demo_claim_ids)).delete(synchronize_session=False)
            db.query(InvestigationReport).filter(InvestigationReport.claim_id.in_(demo_claim_ids)).delete(synchronize_session=False)

        # 1. Delete demo evidence
        demo_ev_count = db.query(Evidence).filter(Evidence.is_demo == True).delete(synchronize_session=False)
        print(f"  Deleted {demo_ev_count} demo evidence records.")
        db.flush()

        # 2. Delete demo claims
        demo_cl_count = db.query(Claim).filter(Claim.is_demo == True).delete(synchronize_session=False)
        print(f"  Deleted {demo_cl_count} demo claims.")
        db.flush()

        # 3. Delete demo policies
        demo_pol_count = db.query(Policy).filter(Policy.is_demo == True).delete(synchronize_session=False)
        print(f"  Deleted {demo_pol_count} demo policies.")
        db.flush()

        # 4. Clean seed audit logs
        db.query(AuditLog).filter(AuditLog.action == "seed_completed").delete(synchronize_session=False)

        db.commit()
        print("  Demo cleanup committed successfully.")

    except Exception as e:
        db.rollback()
        print(f"  [ERROR] Cleanup failed: {e}", file=sys.stderr)
        raise e
    finally:
        db.close()

    print("\n  Re-running idempotent database seed...")
    seed_main()
    print("\n  Demo data reset and re-seed finished successfully. OK\n")

if __name__ == "__main__":
    reset_demo()
