from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class ClaimCreate(BaseModel):
    category: str = "motor"
    incident_date: datetime
    description: str
    estimated_amount: float = 0.0
    policy_id: Optional[str] = None
    priority: Optional[str] = "medium"

class ClaimUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_investigator_id: Optional[str] = None
    estimated_amount: Optional[float] = None
    description: Optional[str] = None

class ClaimantInfo(BaseModel):
    id: str
    full_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)

class InvestigatorInfo(BaseModel):
    id: str
    full_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)

class ClaimResponse(BaseModel):
    id: str
    claim_number: str
    claimant_id: str
    policy_id: Optional[str]
    category: str
    incident_date: datetime
    submission_date: datetime
    description: str
    status: str
    priority: str
    estimated_amount: float
    assigned_investigator_id: Optional[str]
    metadata_json: Optional[str]
    created_at: datetime
    updated_at: datetime
    claimant: Optional[ClaimantInfo] = None
    investigator: Optional[InvestigatorInfo] = None
    evidence_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
