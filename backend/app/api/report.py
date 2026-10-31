import os
import uuid
import datetime
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from backend.app.database.session import get_db
from backend.app.models.entities import (
    Claim, Evidence, InvestigationFinding, Hypothesis, SettlementAssessment,
    InvestigationReport, User, ReviewAction
)
from backend.app.api.deps import get_current_user, log_audit_event
from backend.app.utils.security import decode_access_token

router = APIRouter(prefix="/api/claims/{claim_id}", tags=["Investigation Reports"])

# Root storage directory resolved relative to project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
STORAGE_ROOT = PROJECT_ROOT / "storage" / "reports"
STORAGE_ROOT.mkdir(parents=True, exist_ok=True)


def get_current_user_from_header_or_query(
    request: Request,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
) -> User:
    """Authenticates the user via either the standard Authorization header or a ?token= query parameter."""
    auth_header = request.headers.get("Authorization")
    raw_token = None

    if auth_header and auth_header.startswith("Bearer "):
        raw_token = auth_header.split(" ", 1)[1].strip()
    elif token:
        raw_token = token.strip()

    if not raw_token:
        raise HTTPException(status_code=401, detail="Authentication credentials not provided")

    payload = decode_access_token(raw_token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")

    user_id = payload["sub"]
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found or disabled")

    return user


@router.post("/report")
def generate_claim_report(
    claim_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify claim exists
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Permission check: admin, manager, investigator, fraud_risk can compile
    if current_user.role not in ("admin", "manager", "investigator", "fraud_risk"):
        raise HTTPException(status_code=403, detail="Forbidden: insufficient permissions to compile reports")

    evidence_items = db.query(Evidence).filter(Evidence.claim_id == claim_id).all()
    findings = db.query(InvestigationFinding).filter(
        InvestigationFinding.claim_id == claim_id,
        InvestigationFinding.is_active == True
    ).all()
    hypotheses = db.query(Hypothesis).filter(Hypothesis.claim_id == claim_id).all()
    settlement = db.query(SettlementAssessment).filter(SettlementAssessment.claim_id == claim_id).first()
    reviews = db.query(ReviewAction).filter(ReviewAction.claim_id == claim_id).all()

    filename = f"NexusClaim_Report_{claim.claim_number}_{uuid.uuid4().hex[:6]}.pdf"
    pdf_path = STORAGE_ROOT / filename

    # Build PDF with ReportLab
    doc = SimpleDocTemplate(str(pdf_path), pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1E3A8A'),
        spaceAfter=12
    )

    h2_style = ParagraphStyle(
        'H2Style',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    story = []

    # Title Banner
    story.append(Paragraph("NexusClaim Autonomous Investigation Report", title_style))
    story.append(Paragraph(f"Generated on {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} | Role: {current_user.role.upper()} | Dossier Reference: {claim.claim_number}", body_style))
    story.append(Spacer(1, 12))

    # Executive Summary Table
    story.append(Paragraph("1. Executive Claim Dossier", h2_style))
    summary_data = [
        ["Claim Number", claim.claim_number, "Category", claim.category.upper()],
        ["Status", claim.status.upper(), "Priority", claim.priority.upper()],
        ["Estimated Amount", f"Rs {claim.estimated_amount:,.2f}", "Incident Date", str(claim.incident_date)[:10]],
        ["Payable Settlement", f"Rs {(settlement.payable_amount if settlement else 0):,.2f}", "Deductible", "Rs 5,000.00"]
    ]
    t = Table(summary_data, colWidths=[120, 150, 120, 150])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#0F172A')),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    # Evidence Inventory
    story.append(Paragraph(f"2. Multimodal Evidence Inventory ({len(evidence_items)} items)", h2_style))
    ev_data = [["Filename", "Category", "Source Label", "SHA-256 Hash"]]
    for ev in evidence_items:
        ev_data.append([ev.file_name, ev.category, ev.source_label or "N/A", (ev.file_hash[:16] + "...") if ev.file_hash else "N/A"])
    if len(ev_data) == 1:
        ev_data.append(["No evidence uploaded yet", "-", "-", "-"])
    t_ev = Table(ev_data, colWidths=[150, 100, 130, 160])
    t_ev.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E2E8F0')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_ev)
    story.append(Spacer(1, 10))

    # Findings
    story.append(Paragraph(f"3. Autonomous AI Findings & Observations ({len(findings)} records)", h2_style))
    if not findings:
        story.append(Paragraph("No automated findings generated yet for this claim. Run the 6-agent investigation pipeline first.", body_style))
    for f in findings:
        conf_pct = int(f.confidence_score * 100)
        story.append(Paragraph(f"<b>[{f.finding_code}] {f.category.upper()}</b> — Confidence: {conf_pct}% ({f.classification})", body_style))
        story.append(Paragraph(f"{f.description}", body_style))
        if f.recommended_action:
            story.append(Paragraph(f"<i>Recommended Action:</i> {f.recommended_action}", body_style))
        story.append(Spacer(1, 4))
    story.append(Spacer(1, 6))

    # Hypotheses
    story.append(Paragraph("4. Synthesized Hypotheses & Explanations", h2_style))
    if not hypotheses:
        story.append(Paragraph("No hypotheses formed yet. Run the 6-agent investigation pipeline to formulate hypotheses.", body_style))
    for h in hypotheses:
        prob = int(h.probability_score * 100)
        story.append(Paragraph(f"• <b>{h.title}</b> (Probability: {prob}%, Status: {h.status.upper()}): {h.description}", body_style))
    story.append(Spacer(1, 10))

    # Human Review Actions
    story.append(Paragraph("5. Human-in-the-Loop Review & Audit Trail", h2_style))
    if reviews:
        for r in reviews:
            story.append(Paragraph(f"• <b>{r.action_type.upper()}</b> recorded on {str(r.created_at)[:19]}: {r.justification}", body_style))
    else:
        story.append(Paragraph("Pending final manager determination.", body_style))

    doc.build(story)

    # Save record in DB
    report_record = InvestigationReport(
        claim_id=claim_id,
        generated_by_id=current_user.id,
        report_title=f"Investigation Dossier {claim.claim_number}",
        file_path=str(pdf_path),
        summary_json=f'{{"total_findings": {len(findings)}, "status": "{claim.status}"}}'
    )
    db.add(report_record)
    db.commit()
    db.refresh(report_record)

    log_audit_event(
        db=db,
        action="REPORT_GENERATED_PDF",
        user_id=current_user.id,
        entity_type="REPORT",
        entity_id=report_record.id,
        details={"filename": filename},
        request=request
    )

    return {
        "id": report_record.id,
        "title": report_record.report_title,
        "filename": filename,
        "download_url": f"/api/claims/{claim_id}/report/download",
        "created_at": report_record.created_at.isoformat() if report_record.created_at else None
    }


@router.get("/report")
def get_claim_report_info(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_header_or_query)
):
    rep = db.query(InvestigationReport).filter(InvestigationReport.claim_id == claim_id).order_by(InvestigationReport.created_at.desc()).first()
    if not rep or not os.path.exists(rep.file_path):
        return {"report_available": False}
    return {
        "report_available": True,
        "id": rep.id,
        "title": rep.report_title,
        "created_at": rep.created_at.isoformat() if rep.created_at else None,
        "download_url": f"/api/claims/{claim_id}/report/download"
    }


@router.get("/report/download")
def download_claim_report(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_header_or_query)
):
    rep = db.query(InvestigationReport).filter(InvestigationReport.claim_id == claim_id).order_by(InvestigationReport.created_at.desc()).first()
    if not rep or not os.path.exists(rep.file_path):
        raise HTTPException(status_code=404, detail="Report PDF not found. Click 'Compile PDF Dossier' first.")

    filename = os.path.basename(rep.file_path)
    return FileResponse(
        rep.file_path,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
