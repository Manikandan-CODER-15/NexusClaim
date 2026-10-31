import os
import hashlib
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.entities import Evidence, Claim, User
from backend.app.api.deps import get_current_user, log_audit_event
from pathlib import Path
from datetime import datetime

router = APIRouter(prefix="/api/evidence", tags=["Evidence"])

# Directory where evidence files are stored – uses env var or defaults to ../storage/evidence
STORAGE_ROOT = Path(os.getenv("STORAGE_DIR", "../storage")) / "evidence"
STORAGE_ROOT.mkdir(parents=True, exist_ok=True)

def compute_sha256(file_path: Path) -> str:
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    claim_id: str,
    category: str,
    source_label: str | None = None,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify claim exists and user has permission to add evidence
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    # Permission rules – end_user can add to own claim, investigator/manager can add to assigned claims
    if current_user.role == "end_user" and claim.claimant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: cannot add evidence to another user's claim")
    if current_user.role in ("investigator", "manager"):
        # allow if claim assigned to them or manager (all)
        if current_user.role == "investigator" and claim.assigned_investigator_id != current_user.id:
            raise HTTPException(status_code=403, detail="Forbidden: not assigned to this claim")
    # Store file
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{file.filename}".replace(" ", "_")
    dest_path = STORAGE_ROOT / filename
    with open(dest_path, "wb") as out_file:
        content = await file.read()
        out_file.write(content)
    file_hash = compute_sha256(dest_path)
    # Create DB record
    evidence = Evidence(
        claim_id=claim.id,
        uploader_id=current_user.id,
        file_name=file.filename,
        file_path=str(dest_path),
        file_hash=file_hash,
        file_size=len(content),
        mime_type=file.content_type or "application/octet-stream",
        category=category,
        source_label=source_label,
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
        details={"claim_id": claim.id, "filename": file.filename, "category": category},
        request=None,
    )
    return {"id": evidence.id, "file_name": evidence.file_name, "category": evidence.category}

