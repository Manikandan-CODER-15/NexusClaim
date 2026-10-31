from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.entities import Claim, ReviewAction, User, SettlementAssessment
from backend.app.api.deps import get_current_user, log_audit_event

router = APIRouter(prefix="/api/claims/{claim_id}", tags=["Human Review & Decision"])

class ReviewActionRequest(BaseModel):
    action_type: str  # accept, override, request_evidence, escalate, comment, final_decision
    justification: str
    decision: Optional[str] = None  # approved, rejected, escalated, pending_evidence
    notes: Optional[str] = None

@router.post("/review")
def record_review_action(
    claim_id: str,
    action_req: ReviewActionRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Strict RBAC on decision recording:
    # Manager: Final decision
    # Investigator: Recommend / request evidence / escalate / comment
    # Fraud & Risk: Comment / recommend escalation ONLY (NO final decision)
    # End User / Admin: Forbidden
    if current_user.role in ["end_user", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Not authorised to perform review actions"
        )

    if action_req.action_type == "final_decision":
        if current_user.role != "manager":
            log_audit_event(
                db=db,
                action="UNAUTHORIZED_FINAL_DECISION_ATTEMPT",
                user_id=current_user.id,
                entity_type="CLAIM_REVIEW",
                entity_id=claim_id,
                details={"role": current_user.role, "action_type": action_req.action_type},
                request=request
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Only managers are authorised to record final decisions."
            )
        # Update claim status
        if action_req.decision:
            claim.status = action_req.decision

    elif action_req.action_type == "request_evidence":
        if current_user.role not in ["manager", "investigator"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Only investigators and managers can request additional evidence"
            )
        claim.status = "pending_evidence"

    elif action_req.action_type == "escalate":
        if current_user.role not in ["manager", "investigator", "fraud_risk"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Cannot escalate")
        claim.status = "escalated"

    # Persist review action in DB
    action_entry = ReviewAction(
        claim_id=claim.id,
        reviewer_id=current_user.id,
        action_type=action_req.action_type,
        justification=action_req.justification,
        notes=action_req.notes
    )
    db.add(action_entry)
    db.commit()
    db.refresh(action_entry)

    log_audit_event(
        db=db,
        action=f"REVIEW_ACTION_{action_req.action_type.upper()}",
        user_id=current_user.id,
        entity_type="CLAIM_REVIEW",
        entity_id=claim.id,
        details={
            "action_type": action_req.action_type,
            "decision": action_req.decision,
            "justification": action_req.justification
        },
        request=request
    )

    return {
        "status": "success",
        "action_id": action_entry.id,
        "action_type": action_entry.action_type,
        "claim_status": claim.status,
        "recorded_at": action_entry.created_at
    }

