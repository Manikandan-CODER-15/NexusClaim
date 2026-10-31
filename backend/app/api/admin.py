from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.entities import User, InsuranceCategory, Policy, AuditLog
from backend.app.schemas.auth import UserResponse
from backend.app.schemas.admin import (
    UserAdminCreate, UserAdminUpdate,
    CategoryCreate, CategoryResponse,
    PolicyCreate, PolicyResponse,
    AuditLogResponse
)
from backend.app.utils.security import get_password_hash
from backend.app.api.deps import require_role, log_audit_event

router = APIRouter(prefix="/api/admin", tags=["Admin Console"])

# Strictly admin-only dependency
admin_only = require_role("admin")

@router.get("/users", response_model=List[UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only)
):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.post("/users", response_model=UserResponse)
def create_user(
    user_in: UserAdminCreate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only)
):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    if user_in.role not in ["admin", "end_user", "investigator", "manager", "fraud_risk"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role specified"
        )
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=user_in.is_active if user_in.is_active is not None else True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit_event(
        db=db,
        action="ADMIN_CREATE_USER",
        user_id=admin.id,
        entity_type="USER",
        entity_id=user.id,
        details={"created_email": user.email, "role": user.role},
        request=request
    )
    return user

@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    user_in: UserAdminUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.role is not None:
        if user_in.role not in ["admin", "end_user", "investigator", "manager", "fraud_risk"]:
            raise HTTPException(status_code=400, detail="Invalid role specified")
        user.role = user_in.role
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.password:
        user.hashed_password = get_password_hash(user_in.password)
    
    db.commit()
    db.refresh(user)

    log_audit_event(
        db=db,
        action="ADMIN_UPDATE_USER",
        user_id=admin.id,
        entity_type="USER",
        entity_id=user.id,
        details={"updated_fields": user_in.model_dump(exclude_unset=True, exclude={"password"})},
        request=request
    )
    return user

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only)
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only)
):
    return db.query(InsuranceCategory).all()

@router.post("/categories", response_model=CategoryResponse)
def create_category(
    cat_in: CategoryCreate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only)
):
    existing = db.query(InsuranceCategory).filter(InsuranceCategory.code == cat_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category code already exists")
    
    cat = InsuranceCategory(
        code=cat_in.code,
        name=cat_in.name,
        description=cat_in.description
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)

    log_audit_event(
        db=db,
        action="ADMIN_CREATE_CATEGORY",
        user_id=admin.id,
        entity_type="CATEGORY",
        entity_id=cat.id,
        details={"code": cat.code, "name": cat.name},
        request=request
    )
    return cat

@router.get("/policies", response_model=List[PolicyResponse])
def get_policies(
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only)
):
    return db.query(Policy).all()

@router.post("/policies", response_model=PolicyResponse)
def create_policy(
    pol_in: PolicyCreate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_only)
):
    existing = db.query(Policy).filter(Policy.policy_number == pol_in.policy_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Policy number already exists")
    
    policy = Policy(
        policy_number=pol_in.policy_number,
        title=pol_in.title,
        category=pol_in.category,
        coverage_limit=pol_in.coverage_limit,
        deductible=pol_in.deductible,
        terms_text=pol_in.terms_text,
        clauses_json=pol_in.clauses_json
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)

    log_audit_event(
        db=db,
        action="ADMIN_CREATE_POLICY",
        user_id=admin.id,
        entity_type="POLICY",
        entity_id=policy.id,
        details={"policy_number": policy.policy_number},
        request=request
    )
    return policy

