import json
from typing import Generator, Optional, List, Callable
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.entities import User, AuditLog
from backend.app.utils.security import decode_access_token

security_bearer = HTTPBearer(auto_error=False)

def log_audit_event(
    db: Session,
    action: str,
    user_id: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    details: Optional[dict] = None,
    request: Optional[Request] = None
):
    ip_addr = request.client.host if (request and request.client) else None
    audit_entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        ip_address=ip_addr,
        details_json=json.dumps(details) if details else None
    )
    db.add(audit_entry)
    db.commit()

def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or disabled",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def require_role(*allowed_roles: str):
    def role_checker(
        request: Request,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        if current_user.role not in allowed_roles:
            log_audit_event(
                db=db,
                action="ACCESS_DENIED_ROLE",
                user_id=current_user.id,
                entity_type="ROUTE_ACCESS",
                entity_id=request.url.path,
                details={
                    "user_role": current_user.role,
                    "allowed_roles": list(allowed_roles),
                    "method": request.method,
                    "path": request.url.path
                },
                request=request
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: role '{current_user.role}' lacks permission for this resource. Required: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

