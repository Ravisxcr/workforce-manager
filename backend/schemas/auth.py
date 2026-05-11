import uuid
from enum import StrEnum

from pydantic import BaseModel


class Role(StrEnum):
    EMPLOYEE = "employee"
    MANAGER = "manager"
    HR = "hr"
    ADMIN = "admin"


class UserSignUp(BaseModel):
    full_name: str = "local user"
    email: str = "user@example.com"
    password: str = "strongpassword"
    role: Role = Role.EMPLOYEE


class UserSignUpResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: Role


class UserLoginRequest(BaseModel):
    email: str = "user@example.com"
    password: str = "strongpassword"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


class ForgotPassword(BaseModel):
    email: str


class ResetPassword(BaseModel):
    token: str
    new_password: str
