from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.entities import (
    Claim, InvestigationFinding, Hypothesis,
    EvidenceRelationship, Evidence, ExtractedFact, User
)
from backend.app.api.deps import get_current_user, require_role, log_audit_event

router = APIRouter(prefix="/api/claims/{claim_id}", tags=["Reasoning & Findings"])

# Internal findings and graphs are restricted strictly to: investigator, manager, fraud_risk
# End Users and Admin are strictly forbidden per Section 7 Permission Matrix.
allowed_analysts = require_role("investigator", "manager", "fraud_risk")

@router.get("/findings")
def get_claim_findings(
    claim_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(allowed_analysts)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    findings = db.query(InvestigationFinding).filter(
        InvestigationFinding.claim_id == claim_id,
        InvestigationFinding.is_active == True
    ).order_by(InvestigationFinding.created_at.desc()).all()

    return [
        {
            "id": f.id,
            "finding_code": f.finding_code,
            "category": f.category,
            "description": f.description,
            "classification": f.classification,
            "source_evidence_ids": f.source_evidence_ids,
            "file_reference": f.file_reference,
            "page_or_box_reference": f.page_or_box_reference,
            "supporting_observations": f.supporting_observations,
            "contradicting_observations": f.contradicting_observations,
            "alternative_explanations": f.alternative_explanations,
            "confidence_score": f.confidence_score,
            "recommended_action": f.recommended_action,
            "human_review_status": f.human_review_status,
            "version": f.version,
            "created_at": f.created_at
        }
        for f in findings
    ]

@router.get("/graph")
def get_claim_evidence_graph(
    claim_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(allowed_analysts)
):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Fetch nodes: claim, evidence, extracted_facts, findings, hypotheses
    evidence_items = db.query(Evidence).filter(Evidence.claim_id == claim_id).all()
    facts = db.query(ExtractedFact).filter(ExtractedFact.claim_id == claim_id).all()
    findings = db.query(InvestigationFinding).filter(
        InvestigationFinding.claim_id == claim_id,
        InvestigationFinding.is_active == True
    ).all()
    hypotheses = db.query(Hypothesis).filter(Hypothesis.claim_id == claim_id).all()
    relationships = db.query(EvidenceRelationship).filter(EvidenceRelationship.claim_id == claim_id).all()

    nodes = []
    # Root Claim Node
    nodes.append({
        "id": f"claim_{claim.id}",
        "type": "claim",
        "data": {
            "label": f"Claim {claim.claim_number}",
            "subtitle": f"{claim.category.upper()} - {claim.status}",
            "entity_id": claim.id,
            "priority": claim.priority,
            "estimated_amount": claim.estimated_amount
        },
        "position": {"x": 400, "y": 50}
    })

    # Evidence Nodes
    for i, ev in enumerate(evidence_items):
        nodes.append({
            "id": f"evidence_{ev.id}",
            "type": ev.category,  # photo, statement, repair_estimate, etc.
            "data": {
                "label": ev.file_name,
                "category": ev.category,
                "entity_id": ev.id,
                "source_label": ev.source_label or ev.category,
                "file_path": ev.file_path
            },
            "position": {"x": 100 + (i * 200), "y": 200}
        })

    # Finding Nodes
    for j, f in enumerate(findings):
        nodes.append({
            "id": f"finding_{f.id}",
            "type": "finding",
            "data": {
                "label": f.finding_code,
                "description": f.description,
                "classification": f.classification,
                "confidence": f.confidence_score,
                "is_contradiction": f.category == "inconsistency",
                "entity_id": f.id
            },
            "position": {"x": 150 + (j * 220), "y": 380}
        })

    # Hypothesis Nodes
    for k, h in enumerate(hypotheses):
        nodes.append({
            "id": f"hypothesis_{h.id}",
            "type": "hypothesis",
            "data": {
                "label": h.title,
                "description": h.description,
                "probability": h.probability_score,
                "status": h.status,
                "entity_id": h.id
            },
            "position": {"x": 250 + (k * 260), "y": 550}
        })

    # Edges from DB
    edges = []
    for rel in relationships:
        edges.append({
            "id": rel.id,
            "source": rel.source_id,
            "target": rel.target_id,
            "type": rel.relationship_type,
            "label": rel.relationship_type.replace("_", " "),
            "data": {
                "relationship_type": rel.relationship_type,
                "description": rel.description,
                "confidence": rel.confidence
            },
            "animated": rel.relationship_type in ["contradicts", "requires_verification"]
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "summary": {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "contradiction_count": sum(1 for f in findings if f.category == "inconsistency"),
            "active_hypotheses": len(hypotheses)
        }
    }

@router.get("/hypotheses")
def get_claim_hypotheses(
    claim_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(allowed_analysts)
):
    hypotheses = db.query(Hypothesis).filter(Hypothesis.claim_id == claim_id).all()
    return hypotheses

