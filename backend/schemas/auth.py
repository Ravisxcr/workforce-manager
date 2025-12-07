from pydantic import BaseModel


class UserSignUp(BaseModel):
    full_name: str = "local user"
    email: str = "user@example.com"
    password: str = "strongpassword"


class UserLogin(BaseModel):
    email: str = "user@example.com"
    password: str = "strongpassword"
