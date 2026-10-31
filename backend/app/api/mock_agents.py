from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.entities import Claim, User
from backend.app.api.deps import get_current_user, require_role

router = APIRouter(
    prefix="/api/claims/{claim_id}",
    tags=["Mock Agents (Demo)"],
)

# Analysts may view agents (same rule as real endpoint)
allowed = require_role("investigator", "manager", "fraud_risk")

@router.get("/agents", response_model=list[dict])
def get_mock_agents(
    claim_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(allowed),
):
    # Verify claim exists
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Return static list of six agents – all marked completed
    agents = [
        {
            "id": f"{claim_id}-doc-{i}",
            "agent_name": name,
            "status": "completed",
            "started_at": None,
            "completed_at": None,
            "duration_ms": 250,
            "error_message": None,
        }
        for i, name in enumerate(
            [
                "DocumentAgent",
                "VisionAgent",
                "PolicyAgent",
                "AnomalyAgent",
                "CrossEvidenceReasoningAgent",
                "InvestigationAgent",
            ],
            start=1,
        )
    ]
    return agents

