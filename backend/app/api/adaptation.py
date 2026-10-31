import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.entities import (
    Claim, Evidence, InvestigationFinding, Hypothesis, AgentRun, User
)
from backend.app.api.deps import get_current_user, require_role, log_audit_event

router = APIRouter(prefix="/api/claims/{claim_id}", tags=["Adaptive Re-evaluation Simulator"])

allowed_investigators = require_role("investigator", "manager")

class InjectEvidenceRequest(BaseModel):
    category: str
    description: str
    source_label: str = "Secondary Inspector / Claimant Supplementary"

@router.post("/inject-evidence")
def inject_evidence_and_reevaluate(
    claim_id: str,
    payload: InjectEvidenceRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(allowed_investigators)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # 1. Create simulated evidence record
    new_ev = Evidence(
        claim_id=claim_id,
        uploader_id=current_user.id,
        file_name=f"injected_{payload.category}_{uuid.uuid4().hex[:6]}.png",
        file_path="/storage/evidence/simulated_injection.png",
        file_hash=uuid.uuid4().hex,
        file_size=204800,
        mime_type="image/png",
        category=payload.category,
        source_label=payload.source_label,
        metadata_json=f'{{"simulation": true, "note": "{payload.description}"}}'
    )
    db.add(new_ev)

    # 2. Add new Hypothesis: "Multiple Impact Locations"
    new_hyp = Hypothesis(
        claim_id=claim_id,
        title="Multiple Impact Locations Confirmed",
        description="Newly injected secondary photograph confirms both front crush and rear bumper impact. Supports multi-vehicle chain collision hypothesis.",
        probability_score=0.92,
        status="strengthened"
    )
    db.add(new_hyp)

    # 3. Add new Finding reflecting re-evaluation
    new_finding = InvestigationFinding(
        claim_id=claim_id,
        finding_code=f"FIND-ADAPT-{uuid.uuid4().hex[:4].upper()}",
        category="damage_assessment",
        description=f"Adaptive Re-evaluation: Verified secondary damage across rear quarter panel and bumper. {payload.description}",
        classification="AI inference",
        source_evidence_ids=f'["{new_ev.id}"]',
        confidence_score=0.95,
        recommended_action="Reconcile multi-vehicle chain collision liability with third-party insurer.",
        supporting_observations="Secondary photos confirm matching contact marks and transfer paint.",
        contradicting_observations="None.",
        alternative_explanations="Chain reaction impact from preceding emergency braking.",
        human_review_status="pending",
        is_active=True,
        version=2
    )
    db.add(new_finding)

    # 4. Update existing inconsistency finding to reflect that it is resolved
    inconsistency_finding = db.query(InvestigationFinding).filter(
        InvestigationFinding.claim_id == claim_id,
        InvestigationFinding.category == "inconsistency"
    ).first()
    if inconsistency_finding:
        inconsistency_finding.alternative_explanations = (
            "RESOLVED: Supplementary rear damage photo corroborates initial statement regarding chain collision."
        )
        inconsistency_finding.human_review_status = "accepted"

    # 5. Record adaptation audit log
    log_audit_event(
        db=db,
        action="EVIDENCE_INJECTED_ADAPTIVE_REEVALUATION",
        user_id=current_user.id,
        entity_type="CLAIM",
        entity_id=claim_id,
        details={"injected_category": payload.category, "new_hypothesis": new_hyp.title},
        request=request
    )

    db.commit()

    return {
        "status": "adaptive_reevaluation_complete",
        "claim_id": claim_id,
        "new_evidence_id": new_ev.id,
        "new_hypothesis": new_hyp.title,
        "probability_score": new_hyp.probability_score,
        "message": "Affected findings re-evaluated. Evidence graph updated."
    }

