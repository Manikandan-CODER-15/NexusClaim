import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.entities import Claim, User, Evidence
from backend.app.schemas.claim import ClaimCreate, ClaimUpdate, ClaimResponse
from backend.app.api.deps import get_current_user, log_audit_event

router = APIRouter(prefix="/api/claims", tags=["Claims Management"])

@router.get("", response_model=List[ClaimResponse])
def get_claims(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Claim)

    # Role-based visibility enforcement
    if current_user.role == "end_user":
        # End User sees ONLY own claims
        query = query.filter(Claim.claimant_id == current_user.id)
    elif current_user.role == "investigator":
        # Investigator sees assigned claims or unassigned claims to assign
        query = query.filter((Claim.assigned_investigator_id == current_user.id) | (Claim.assigned_investigator_id == None))
    elif current_user.role in ("manager", "fraud_risk", "admin"):
        # Manager, Risk Analyst, and Admin see claims across portfolio
        pass
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if status_filter:
        query = query.filter(Claim.status == status_filter)
    if priority_filter:
        query = query.filter(Claim.priority == priority_filter)

    claims = query.order_by(Claim.created_at.desc()).offset(skip).limit(limit).all()
    
    # Enrich with evidence count
    res = []
    for c in claims:
        cr = ClaimResponse.model_validate(c)
        cr.evidence_count = db.query(Evidence).filter(Evidence.claim_id == c.id).count()
        res.append(cr)
    return res

@router.post("", response_model=ClaimResponse)
def submit_claim(
    claim_in: ClaimCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only end_user can submit claim per permission matrix
    if current_user.role != "end_user":
        log_audit_event(
            db=db,
            action="ACCESS_DENIED_CLAIM_SUBMIT",
            user_id=current_user.id,
            entity_type="CLAIM",
            details={"attempted_role": current_user.role},
            request=request
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only end users are authorised to submit new claims."
        )

    # Generate human-friendly claim number e.g. CLM-2026-90412
    short_uuid = uuid.uuid4().hex[:6].upper()
    claim_number = f"CLM-2026-{short_uuid}"

    claim = Claim(
        claim_number=claim_number,
        claimant_id=current_user.id,
        policy_id=claim_in.policy_id,
        category=claim_in.category,
        incident_date=claim_in.incident_date,
        submission_date=datetime.utcnow(),
        description=claim_in.description,
        status="submitted",
        priority=claim_in.priority or "medium",
        estimated_amount=claim_in.estimated_amount or 0.0,
        is_demo=False
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)

    log_audit_event(
        db=db,
        action="CLAIM_SUBMITTED",
        user_id=current_user.id,
        entity_type="CLAIM",
        entity_id=claim.id,
        details={"claim_number": claim.claim_number, "category": claim.category},
        request=request
    )

    cr = ClaimResponse.model_validate(claim)
    cr.evidence_count = 0
    return cr

@router.get("/{claim_id}", response_model=ClaimResponse)
def get_claim_by_id(
    claim_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Strict ownership and authorization check
    if current_user.role == "end_user":
        if claim.claimant_id != current_user.id:
            log_audit_event(
                db=db,
                action="UNAUTHORIZED_CLAIM_READ_ATTEMPT",
                user_id=current_user.id,
                entity_type="CLAIM",
                entity_id=claim_id,
                details={"owner_id": claim.claimant_id},
                request=request
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You cannot view claims belonging to other claimants"
            )
    elif current_user.role == "investigator":
        if claim.assigned_investigator_id and claim.assigned_investigator_id != current_user.id:
            log_audit_event(
                db=db,
                action="UNAUTHORIZED_INVESTIGATOR_ACCESS",
                user_id=current_user.id,
                entity_type="CLAIM",
                entity_id=claim_id,
                details={"assigned_to": claim.assigned_investigator_id},
                request=request
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: This claim is not assigned to you"
            )

    cr = ClaimResponse.model_validate(claim)
    cr.evidence_count = db.query(Evidence).filter(Evidence.claim_id == claim.id).count()
    return cr

@router.patch("/{claim_id}", response_model=ClaimResponse)
def update_claim(
    claim_id: str,
    claim_in: ClaimUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Permission check: manager can assign investigator & change status; investigator can update status
    if current_user.role == "end_user":
        raise HTTPException(status_code=403, detail="Forbidden: End users cannot modify claim management properties")
    
    if claim_in.assigned_investigator_id is not None:
        if current_user.role not in ("manager", "admin"):
            raise HTTPException(status_code=403, detail="Forbidden: Only managers or admins can assign investigators")
        claim.assigned_investigator_id = claim_in.assigned_investigator_id

    if claim_in.status is not None:
        claim.status = claim_in.status
    if claim_in.priority is not None:
        claim.priority = claim_in.priority
    if claim_in.estimated_amount is not None:
        claim.estimated_amount = claim_in.estimated_amount
    if claim_in.description is not None:
        claim.description = claim_in.description

    db.commit()
    db.refresh(claim)

    log_audit_event(
        db=db,
        action="CLAIM_UPDATED",
        user_id=current_user.id,
        entity_type="CLAIM",
        entity_id=claim.id,
        details=claim_in.model_dump(exclude_unset=True),
        request=request
    )

    cr = ClaimResponse.model_validate(claim)
    cr.evidence_count = db.query(Evidence).filter(Evidence.claim_id == claim.id).count()
    return cr
