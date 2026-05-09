from pydantic import BaseModel


class UserSignUp(BaseModel):
    full_name: str = "local user"
    email: str = "user@example.com"
    password: str = "strongpassword"


class UserLoginRequest(BaseModel):
    email: str = "user@example.com"
    password: str = "strongpassword"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


class ForgotPassword(BaseModel):
    email: str


class ResetPassword(BaseModel):
    token: str
    new_password: str
