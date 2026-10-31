from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: Optional[bool] = False

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "end_user"

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    full_name: str
    email: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
