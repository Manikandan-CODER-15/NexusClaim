from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserAdminCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str  # admin, end_user, investigator, manager, fraud_risk
    is_active: Optional[bool] = True

class UserAdminUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class CategoryCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None

class CategoryResponse(BaseModel):
    id: str
    code: str
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PolicyCreate(BaseModel):
    policy_number: str
    title: str
    category: str
    coverage_limit: float
    deductible: float
    terms_text: Optional[str] = None
    clauses_json: Optional[str] = None

class PolicyResponse(BaseModel):
    id: str
    policy_number: str
    title: str
    category: str
    coverage_limit: float
    deductible: float
    terms_text: Optional[str]
    clauses_json: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str]
    action: str
    entity_type: Optional[str]
    entity_id: Optional[str]
    ip_address: Optional[str]
    details_json: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OverviewResponse(BaseModel):
    total_claims: int
    active_investigations: int
    pending_reviews: int
    completed: int
    category_distribution: List[Dict[str, Any]] = []
    investigation_trend: List[Dict[str, Any]] = []
