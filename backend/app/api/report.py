import os
import uuid
import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Request
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
from backend.app.api.deps import get_current_user, require_role, log_audit_event

router = APIRouter(prefix="/api/claims/{claim_id}", tags=["Investigation Reports"])

STORAGE_ROOT = Path(os.getenv("STORAGE_DIR", "../storage")) / "reports"
STORAGE_ROOT.mkdir(parents=True, exist_ok=True)

allowed_analysts = require_role("investigator", "manager", "fraud_risk")

@router.post("/report")
def generate_claim_report(
    claim_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(allowed_analysts)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

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
        ["Estimated Amount", f"${claim.estimated_amount:,.2f}", "Incident Date", str(claim.incident_date)[:10]],
        ["Payable Settlement", f"${(settlement.payable_amount if settlement else 0):,.2f}", "Deductible", "$500.00"]
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
        ev_data.append([ev.file_name, ev.category, ev.source_label or "N/A", ev.file_hash[:16] + "..."])
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

    # Save record
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
        "created_at": report_record.created_at
    }

@router.get("/report")
def get_claim_report_info(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(allowed_analysts)
):
    rep = db.query(InvestigationReport).filter(InvestigationReport.claim_id == claim_id).order_by(InvestigationReport.created_at.desc()).first()
    if not rep:
        return {"report_available": False}
    return {
        "report_available": True,
        "id": rep.id,
        "title": rep.report_title,
        "created_at": rep.created_at,
        "download_url": f"/api/claims/{claim_id}/report/download"
    }

@router.get("/report/download")
def download_claim_report(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(allowed_analysts)
):
    rep = db.query(InvestigationReport).filter(InvestigationReport.claim_id == claim_id).order_by(InvestigationReport.created_at.desc()).first()
    if not rep or not os.path.exists(rep.file_path):
        raise HTTPException(status_code=404, detail="Report PDF not found. Generate one first.")
    return FileResponse(rep.file_path, media_type="application/pdf", filename=os.path.basename(rep.file_path))

