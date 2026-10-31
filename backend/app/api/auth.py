from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.entities import User
from backend.app.schemas.auth import LoginRequest, RegisterRequest, Token, UserResponse
from backend.app.utils.security import verify_password, get_password_hash, create_access_token
from backend.app.api.deps import get_current_user, log_audit_event

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(login_req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_req.email).first()
    if not user or not verify_password(login_req.password, user.hashed_password):
        log_audit_event(
            db=db,
            action="LOGIN_FAILED",
            user_id=user.id if user else None,
            entity_type="AUTH",
            details={"email": login_req.email},
            request=request
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
    
    expires = timedelta(days=7) if login_req.remember_me else timedelta(hours=24)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role},
        expires_delta=expires
    )
    
    log_audit_event(
        db=db,
        action="LOGIN_SUCCESS",
        user_id=user.id,
        entity_type="AUTH",
        details={"role": user.role},
        request=request
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email
    )

@router.post("/register", response_model=UserResponse)
def register(reg_req: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == reg_req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )
    
    # Public registration can only create 'end_user' accounts for security
    assigned_role = "end_user"
    
    user = User(
        email=reg_req.email,
        hashed_password=get_password_hash(reg_req.password),
        full_name=reg_req.full_name,
        role=assigned_role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit_event(
        db=db,
        action="USER_REGISTERED",
        user_id=user.id,
        entity_type="USER",
        entity_id=user.id,
        details={"email": user.email, "role": user.role},
        request=request
    )

    return user

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

