import json
from datetime import datetime, timedelta
from backend.app.database.session import engine, SessionLocal, Base
from backend.app.models.entities import (
    User, Role, InsuranceCategory, Policy, Claim,
    SettlementAssessment, AuditLog, SystemSetting
)
from backend.app.utils.security import get_password_hash

def seed_database():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Roles
        role_definitions = [
            ("admin", "System Administrator with full management & audit access", ["manage_users", "manage_policies", "view_audit", "system_settings"]),
            ("end_user", "Policyholder who can submit claims and track own progress", ["submit_claim", "upload_own_evidence", "view_own_claims"]),
            ("investigator", "Claims investigator handling multimodal evidence & AI analysis", ["view_assigned_claims", "run_ai", "view_graph", "recommend_action", "generate_report"]),
            ("manager", "Executive supervisor reviewing escalations & making final decisions", ["view_all_claims", "assign_investigators", "record_final_decision", "view_analytics"]),
            ("fraud_risk", "Risk specialist inspecting anomaly indicators & relationship graphs", ["view_flagged_claims", "view_graph", "view_anomalies", "recommend_escalation"])
        ]

        for r_name, r_desc, r_perms in role_definitions:
            existing_role = db.query(Role).filter(Role.name == r_name).first()
            if not existing_role:
                db.add(Role(
                    name=r_name,
                    description=r_desc,
                    permissions_json=json.dumps(r_perms)
                ))
        db.commit()

        # 2. Seed Users (5 Demo users + 2 Extra End Users + 1 Extra Investigator)
        users_to_seed = [
            # 5 Demo Accounts from Section 4.3
            ("admin@nexusclaim.demo", "Admin@123", "Eleanor Vance (Admin)", "admin"),
            ("enduser@nexusclaim.demo", "User@123", "Rahul Sharma (Claimant)", "end_user"),
            ("investigator@nexusclaim.demo", "Invest@123", "Sarah Jenkins (Senior Investigator)", "investigator"),
            ("manager@nexusclaim.demo", "Manager@123", "Marcus Aurelius (Claims Director)", "manager"),
            ("risk@nexusclaim.demo", "Risk@123", "David Chen (Fraud & Risk Analyst)", "fraud_risk"),
            # 2 Extra End Users for ownership isolation tests
            ("user2@nexusclaim.demo", "User2@123", "Ananya Iyer (Claimant 2)", "end_user"),
            ("user3@nexusclaim.demo", "User3@123", "Vikram Malhotra (Claimant 3)", "end_user"),
            # 1 Extra Investigator for assignment isolation
            ("investigator2@nexusclaim.demo", "Invest2@123", "Elena Rostova (Investigator 2)", "investigator"),
        ]

        user_cache = {}
        for email, pwd, name, role in users_to_seed:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    hashed_password=get_password_hash(pwd),
                    full_name=name,
                    role=role,
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            user_cache[email] = user

        # 3. Seed Insurance Categories
        categories = [
            ("motor", "Motor Vehicle Insurance", "Covers private automobiles, commercial fleets, collision and comprehensive perils."),
            ("property", "Property & Casualty Insurance", "Covers residential structures, commercial real estate, fire and water damage."),
            ("health", "Health & Critical Care", "Medical claims, hospitalization, accidental bodily injury."),
            ("commercial", "Commercial General Liability", "Business interruption, public liability, equipment failure.")
        ]
        for code, name, desc in categories:
            if not db.query(InsuranceCategory).filter(InsuranceCategory.code == code).first():
                db.add(InsuranceCategory(code=code, name=name, description=desc))
        db.commit()

        # 4. Seed Standard Policy
        policy = db.query(Policy).filter(Policy.policy_number == "POL-2026-MTR-8821").first()
        if not policy:
            policy = Policy(
                policy_number="POL-2026-MTR-8821",
                title="Nexus Premier Private Motor Comprehensive Policy",
                category="motor",
                coverage_limit=50000.0,
                deductible=500.0,
                terms_text="Comprehensive auto insurance covering collision, theft, weather perils, and third party liability.",
                clauses_json=json.dumps([
                    {
                        "clause_id": "SEC-01",
                        "title": "Accidental Collision Damage",
                        "summary": "Covers direct accidental physical damage to insured vehicle body, mechanics, and glass.",
                        "deductible": 500.0,
                        "limit": 50000.0
                    },
                    {
                        "clause_id": "SEC-04-EXCL",
                        "title": "Pre-Existing & Unrelated Damage Exclusion",
                        "summary": "Excludes pre-existing wear, tear, rust, or damage not caused by the declared incident.",
                        "deductible": 0.0,
                        "limit": 0.0
                    },
                    {
                        "clause_id": "SEC-09-EXCL",
                        "title": "Intentional or Staged Loss Exclusion",
                        "summary": "Claims arising from deliberate self-inflicted collision or misrepresentation are void.",
                        "deductible": 0.0,
                        "limit": 0.0
                    }
                ])
            )
            db.add(policy)
            db.commit()
            db.refresh(policy)

        # 5. Seed Initial Claim 1 (Owned by Rahul Sharma - enduser@nexusclaim.demo, Assigned to Sarah Jenkins)
        claim1 = db.query(Claim).filter(Claim.claim_number == "CLM-2026-00814").first()
        if not claim1:
            claim1 = Claim(
                claim_number="CLM-2026-00814",
                claimant_id=user_cache["enduser@nexusclaim.demo"].id,
                policy_id=policy.id,
                category="motor",
                incident_date=datetime.utcnow() - timedelta(days=2),
                submission_date=datetime.utcnow() - timedelta(days=1),
                description="Reported low-speed rear-end collision at traffic signal on Main St & 4th Ave.",
                status="under_investigation",
                priority="high",
                estimated_amount=4850.0,
                assigned_investigator_id=user_cache["investigator@nexusclaim.demo"].id
            )
            db.add(claim1)
            db.commit()

        # 6. Seed Initial Claim 2 (Owned by Ananya Iyer - user2@nexusclaim.demo, Assigned to Elena Rostova)
        claim2 = db.query(Claim).filter(Claim.claim_number == "CLM-2026-00992").first()
        if not claim2:
            claim2 = Claim(
                claim_number="CLM-2026-00992",
                claimant_id=user_cache["user2@nexusclaim.demo"].id,
                policy_id=policy.id,
                category="motor",
                incident_date=datetime.utcnow() - timedelta(days=4),
                submission_date=datetime.utcnow() - timedelta(days=3),
                description="Side swipe incident in underground parking lot.",
                status="submitted",
                priority="medium",
                estimated_amount=2100.0,
                assigned_investigator_id=user_cache["investigator2@nexusclaim.demo"].id
            )
            db.add(claim2)
            db.commit()

        # 7. Seed System Settings
        settings_to_seed = [
            ("gemini_model", "gemini-2.5-flash", "Default multimodal Gemini model"),
            ("anomaly_threshold", "-0.15", "IsolationForest decision score threshold"),
            ("max_upload_size_mb", "25", "Maximum single evidence upload size in MB"),
            ("enforce_hash_uniqueness", "true", "Prevent duplicate evidence file upload by SHA-256")
        ]
        for k, v, d in settings_to_seed:
            if not db.query(SystemSetting).filter(SystemSetting.setting_key == k).first():
                db.add(SystemSetting(setting_key=k, setting_value=v, description=d))
        db.commit()

        print("[NexusClaim] Database seeded successfully with demo users, policies, and test claims.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

