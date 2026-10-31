import uuid
import datetime
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Float,
    Integer,
    DateTime,
    ForeignKey,
    Text,
    Index
)
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Role(Base):
    __tablename__ = "roles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(50), unique=True, nullable=False, index=True)  # admin, end_user, investigator, manager, fraud_risk
    description = Column(String(255), nullable=True)
    permissions_json = Column(Text, nullable=True)  # JSON serialized permissions
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False, default="end_user", index=True)  # admin, end_user, investigator, manager, fraud_risk
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    claims = relationship("Claim", back_populates="claimant", foreign_keys="Claim.claimant_id")
    assigned_claims = relationship("Claim", back_populates="investigator", foreign_keys="Claim.assigned_investigator_id")

class InsuranceCategory(Base):
    __tablename__ = "insurance_categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Policy(Base):
    __tablename__ = "policies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    policy_number = Column(String(100), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False, index=True)  # motor, health, property, commercial
    coverage_limit = Column(Float, nullable=False, default=0.0)
    deductible = Column(Float, nullable=False, default=0.0)
    terms_text = Column(Text, nullable=True)
    clauses_json = Column(Text, nullable=True)  # JSON list of clauses
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Claim(Base):
    __tablename__ = "claims"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    claim_number = Column(String(100), unique=True, nullable=False, index=True)
    claimant_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    policy_id = Column(String(36), ForeignKey("policies.id"), nullable=True, index=True)
    category = Column(String(50), nullable=False, default="motor", index=True)
    incident_date = Column(DateTime, nullable=False)
    submission_date = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    description = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="submitted", index=True)  # submitted, under_investigation, pending_review, escalated, approved, rejected, closed
    priority = Column(String(20), nullable=False, default="medium", index=True)  # low, medium, high, critical
    estimated_amount = Column(Float, nullable=False, default=0.0)
    assigned_investigator_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    metadata_json = Column(Text, nullable=True)  # arbitrary extra metadata
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    claimant = relationship("User", foreign_keys=[claimant_id], back_populates="claims")
    investigator = relationship("User", foreign_keys=[assigned_investigator_id], back_populates="assigned_claims")
    evidence_items = relationship("Evidence", back_populates="claim", cascade="all, delete-orphan")
    findings = relationship("InvestigationFinding", back_populates="claim", cascade="all, delete-orphan")
    agent_runs = relationship("AgentRun", back_populates="claim", cascade="all, delete-orphan")
    hypotheses = relationship("Hypothesis", back_populates="claim", cascade="all, delete-orphan")
    settlement = relationship("SettlementAssessment", back_populates="claim", uselist=False, cascade="all, delete-orphan")
    review_actions = relationship("ReviewAction", back_populates="claim", cascade="all, delete-orphan")
    reports = relationship("InvestigationReport", back_populates="claim", cascade="all, delete-orphan")

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    claim_id = Column(String(36), ForeignKey("claims.id"), nullable=False, index=True)
    uploader_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_hash = Column(String(64), nullable=False, index=True)  # SHA-256 for duplicate detection
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False, index=True)  # photo, policy_doc, statement, repair_estimate, police_report, other
    source_label = Column(String(100), nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    claim = relationship("Claim", back_populates="evidence_items")
    uploader = relationship("User")
    facts = relationship("ExtractedFact", back_populates="evidence", cascade="all, delete-orphan")

class ExtractedFact(Base):
    __tablename__ = "extracted_facts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    claim_id = Column(String(36), ForeignKey("claims.id"), nullable=False, index=True)
    evidence_id = Column(String(36), ForeignKey("evidence.id"), nullable=False, index=True)
    fact_type = Column(String(50), nullable=False, index=True)  # date, location, damage_location, repair_item, monetary_cost, speed, condition
    text_content = Column(Text, nullable=False)
    confidence = Column(Float, nullable=False, default=1.0)
    location_reference = Column(String(255), nullable=True)  # e.g., page 1, image bbox, etc.
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    evidence = relationship("Evidence", back_populates="facts")

class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    claim_id = Column(String(36), ForeignKey("claims.id"), nullable=False, index=True)
    agent_name = Column(String(100), nullable=False, index=True)  # DocumentAgent, VisionAgent, PolicyAgent, AnomalyAgent, CrossEvidenceReasoningAgent, InvestigationAgent
    status = Column(String(50), nullable=False, default="pending", index=True)  # pending, running, completed, failed, retrying
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    input_summary = Column(Text, nullable=True)
    output_summary = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    gemini_tokens = Column(Integer, nullable=True, default=0)
    run_metadata = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    claim = relationship("Claim", back_populates="agent_runs")

class InvestigationFinding(Base):
    __tablename__ = "investigation_findings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    claim_id = Column(String(36), ForeignKey("claims.id"), nullable=False, index=True)
    finding_code = Column(String(50), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)  # inconsistency, damage_assessment, coverage_gap, metadata_anomaly, risk_indicator
    description = Column(Text, nullable=False)
    classification = Column(String(50), nullable=False)  # Direct observation, Extracted statement, AI inference, Hypothesis
    source_evidence_ids = Column(Text, nullable=False)  # JSON list of evidence IDs
    file_reference = Column(String(255), nullable=True)
    page_or_box_reference = Column(String(255), nullable=True)
    supporting_observations = Column(Text, nullable=True)  # JSON or text
    contradicting_observations = Column(Text, nullable=True)  # JSON or text
    alternative_explanations = Column(Text, nullable=True)  # JSON or text
    confidence_score = Column(Float, nullable=False, default=0.8)
    recommended_action = Column(String(255), nullable=True)
    human_review_status = Column(String(50), default="pending", index=True)  # pending, accepted, overridden
    version = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    claim = relationship("Claim", back_populates="findings")

class Hypothesis(Base):
    __tablename__ = "hypotheses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    claim_id = Column(String(36), ForeignKey("claims.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    probability_score = Column(Float, nullable=False, default=0.5)
    supporting_finding_ids = Column(Text, nullable=True)  # JSON list
    contradicting_finding_ids = Column(Text, nullable=True)  # JSON list
    status = Column(String(50), default="active", index=True)  # active, weakened, strengthened, refuted
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    claim = relationship("Claim", back_populates="hypotheses")

class EvidenceRelationship(Base):
    __tablename__ = "evidence_relationships"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    claim_id = Column(String(36), ForeignKey("claims.id"), nullable=False, index=True)
    source_id = Column(String(36), nullable=False, index=True)
    target_id = Column(String(36), nullable=False, index=True)
    source_type = Column(String(50), nullable=False)  # claim, evidence, photograph, statement, policy_clause, repair_estimate, extracted_fact, finding, contradiction, hypothesis, recommendation
    target_type = Column(String(50), nullable=False)
    relationship_type = Column(String(50), nullable=False, index=True)  # supports, contradicts, derived_from, related_to, requires_verification
    description = Column(Text, nullable=True)
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class PolicyAnalysis(Base):
    __tablename__ = "policy_analysis"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    claim_id = Column(String(36), ForeignKey("claims.id"), nullable=False, index=True)
    policy_id = Column(String(36), ForeignKey("policies.id"), nullable=False, index=True)
    clause_number = Column(String(50), nullable=False, index=True)
    clause_title = Column(String(255), nullable=False)
    analysis_result = Column(Text, nullable=False)
    is_covered = Column(Boolean, default=True)
    deductible_amount = Column(Float, default=0.0)
    max_limit = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SettlementAssessment(Base):
    __tablename__ = "settlement_assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    claim_id = Column(String(36), ForeignKey("claims.id"), nullable=False, index=True)
    eligible_repair_cost = Column(Float, nullable=False, default=0.0)
    deductible = Column(Float, nullable=False, default=0.0)
    other_deductions = Column(Float, nullable=False, default=0.0)
    payable_amount = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), default="provisional", index=True)  # provisional, incomplete, verified, final_approved
    calculation_breakdown = Column(Text, nullable=True)  # JSON details
    notes = Column(Text, nullable=True)
    is_provisional = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    claim = relationship("Claim", back_populates="settlement")

class ReviewAction(Base):
    __tablename__ = "review_actions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    claim_id = Column(String(36), ForeignKey("claims.id"), nullable=False, index=True)
    reviewer_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    action_type = Column(String(50), nullable=False, index=True)  # accept, override, request_evidence, escalate, comment, final_decision
    justification = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    claim = relationship("Claim", back_populates="review_actions")
    reviewer = relationship("User")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=True, index=True)
    entity_id = Column(String(36), nullable=True, index=True)
    ip_address = Column(String(50), nullable=True)
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class InvestigationReport(Base):
    __tablename__ = "investigation_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    claim_id = Column(String(36), ForeignKey("claims.id"), nullable=False, index=True)
    generated_by_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    report_title = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    summary_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    claim = relationship("Claim", back_populates="reports")
    generator = relationship("User")

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    setting_key = Column(String(100), unique=True, nullable=False, index=True)
    setting_value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

