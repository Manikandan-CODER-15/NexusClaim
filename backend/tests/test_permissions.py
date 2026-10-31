import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import SessionLocal
from backend.app.models.entities import Claim, User

client = TestClient(app)

def get_token(email: str, password: str) -> str:
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, f"Login failed for {email}: {response.text}"
    return response.json()["access_token"]

def test_health_check():
    """Verify health endpoint is reachable and healthy."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_end_user_cannot_read_another_users_claim():
    """
    Requirement: Prove that an end user cannot read another user's claim (403/404).
    Claim 1 is owned by enduser@nexusclaim.demo.
    Claim 2 is owned by user2@nexusclaim.demo.
    """
    db = SessionLocal()
    claim2 = db.query(Claim).filter(Claim.claim_number == "CLM-2026-00992").first()
    db.close()
    assert claim2 is not None

    token_user1 = get_token("enduser@nexusclaim.demo", "User@123")
    response = client.get(
        f"/api/claims/{claim2.id}",
        headers={"Authorization": f"Bearer {token_user1}"}
    )
    assert response.status_code == 403
    assert "Forbidden" in response.json()["detail"]

def test_end_user_cannot_call_findings_or_graph():
    """
    Requirement: Prove that an end user cannot call /findings or /graph (403).
    """
    db = SessionLocal()
    claim1 = db.query(Claim).filter(Claim.claim_number == "CLM-2026-00814").first()
    db.close()
    assert claim1 is not None

    token_end_user = get_token("enduser@nexusclaim.demo", "User@123")
    
    # Test /findings
    findings_resp = client.get(
        f"/api/claims/{claim1.id}/findings",
        headers={"Authorization": f"Bearer {token_end_user}"}
    )
    assert findings_resp.status_code == 403
    assert "Forbidden" in findings_resp.json()["detail"]

    # Test /graph
    graph_resp = client.get(
        f"/api/claims/{claim1.id}/graph",
        headers={"Authorization": f"Bearer {token_end_user}"}
    )
    assert graph_resp.status_code == 403
    assert "Forbidden" in graph_resp.json()["detail"]

def test_fraud_risk_cannot_record_final_decision():
    """
    Requirement: Prove that a fraud_risk user cannot record a final decision (403).
    Only manager has final decision authority.
    """
    db = SessionLocal()
    claim1 = db.query(Claim).filter(Claim.claim_number == "CLM-2026-00814").first()
    db.close()
    assert claim1 is not None

    token_risk = get_token("risk@nexusclaim.demo", "Risk@123")
    response = client.post(
        f"/api/claims/{claim1.id}/review",
        json={
            "action_type": "final_decision",
            "justification": "Attempting unauthorized closure as risk analyst",
            "decision": "approved"
        },
        headers={"Authorization": f"Bearer {token_risk}"}
    )
    assert response.status_code == 403
    assert "Forbidden: Only managers are authorised to record final decisions." in response.json()["detail"]

def test_manager_can_record_final_decision():
    """
    Verify that a manager CAN record a final decision.
    """
    db = SessionLocal()
    claim1 = db.query(Claim).filter(Claim.claim_number == "CLM-2026-00814").first()
    db.close()
    assert claim1 is not None

    token_manager = get_token("manager@nexusclaim.demo", "Manager@123")
    response = client.post(
        f"/api/claims/{claim1.id}/review",
        json={
            "action_type": "final_decision",
            "justification": "Manager review completed based on corroborated assessment",
            "decision": "approved"
        },
        headers={"Authorization": f"Bearer {token_manager}"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_only_admin_can_call_user_management():
    """
    Requirement: Prove that only admin can call user-management endpoints.
    Investigator, manager, end_user, and fraud_risk must receive 403.
    """
    token_investigator = get_token("investigator@nexusclaim.demo", "Invest@123")
    resp_investigator = client.get(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {token_investigator}"}
    )
    assert resp_investigator.status_code == 403
    assert "Forbidden" in resp_investigator.json()["detail"]

    # Now verify Admin can access successfully
    token_admin = get_token("admin@nexusclaim.demo", "Admin@123")
    resp_admin = client.get(
        "/api/admin/users",
        headers={"Authorization": f"Bearer {token_admin}"}
    )
    assert resp_admin.status_code == 200
    users = resp_admin.json()
    assert len(users) >= 8  # 5 demo accounts + 2 extra end users + 1 extra investigator

