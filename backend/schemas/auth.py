from pydantic import BaseModel


class UserSignUp(BaseModel):
    full_name: str = "local user"
    email: str = "user@example.com"
    password: str = "strongpassword"


class UserLogin(BaseModel):
    email: str = "user@example.com"
    password: str = "strongpassword"


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


class ForgotPassword(BaseModel):
    email: str


class ResetPassword(BaseModel):
    token: str
    new_password: str
