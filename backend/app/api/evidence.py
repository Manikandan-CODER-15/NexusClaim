import os
import hashlib
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.entities import Evidence, Claim, User
from backend.app.api.deps import get_current_user, log_audit_event
from pathlib import Path
from datetime import datetime

router = APIRouter(prefix="/api/evidence", tags=["Evidence"])

# Root storage directory resolved relative to project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
STORAGE_ROOT = PROJECT_ROOT / "storage" / "uploads"
STORAGE_ROOT.mkdir(parents=True, exist_ok=True)

def compute_sha256(file_path: Path) -> str:
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    claim_id: str = Form(...),
    category: str = Form(...),
    source_label: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify claim exists and user has permission to add evidence
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Permission rules:
    # - end_user can add to their own claim
    # - investigator can add to assigned claims (or demo claims)
    # - manager, admin, fraud_risk can add to any claim
    if current_user.role == "end_user" and claim.claimant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: cannot add evidence to another user's claim")
    if current_user.role == "investigator":
        if claim.assigned_investigator_id and claim.assigned_investigator_id != current_user.id:
            raise HTTPException(status_code=403, detail="Forbidden: not assigned to this claim")

    # Store file in storage/uploads/
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    safe_filename = f"{timestamp}_{file.filename}".replace(" ", "_")
    dest_path = STORAGE_ROOT / safe_filename

    content = await file.read()
    with open(dest_path, "wb") as out_file:
        out_file.write(content)

    file_hash = compute_sha256(dest_path)

    # Relative path from project root for portability
    rel_path = f"storage/uploads/{safe_filename}"

    # Create DB record
    evidence = Evidence(
        claim_id=claim.id,
        uploader_id=current_user.id,
        file_name=file.filename or safe_filename,
        file_path=rel_path,
        file_hash=file_hash,
        file_size=len(content),
        mime_type=file.content_type or "application/octet-stream",
        category=category,
        source_label=source_label or "User Upload",
        is_demo=claim.is_demo,
        created_at=datetime.utcnow(),
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    # Audit log
    log_audit_event(
        db=db,
        action="EVIDENCE_UPLOADED",
        user_id=current_user.id,
        entity_type="EVIDENCE",
        entity_id=evidence.id,
        details={"claim_id": claim.id, "filename": file.filename, "category": category, "hash": file_hash},
        request=None,
    )
    return {
        "id": evidence.id,
        "file_name": evidence.file_name,
        "category": evidence.category,
        "file_hash": evidence.file_hash,
        "file_size": evidence.file_size
    }


@router.get("/claims/{claim_id}")
def get_claim_evidence(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if current_user.role == "end_user" and claim.claimant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    items = db.query(Evidence).filter(Evidence.claim_id == claim_id).order_by(Evidence.created_at.desc()).all()
    return [
        {
            "id": e.id,
            "claim_id": e.claim_id,
            "file_name": e.file_name,
            "file_path": e.file_path,
            "file_hash": e.file_hash,
            "file_size": e.file_size,
            "mime_type": e.mime_type,
            "category": e.category,
            "source_label": e.source_label,
            "created_at": e.created_at.isoformat() if e.created_at else None
        }
        for e in items
    ]
