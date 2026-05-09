from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from db.session import get_db
from models.user import User
from utils.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
pwd_hasher = PasswordHash.recommended()


def get_current_active_user(
    db: Session = Depends(get_db), token: Annotated[str, Depends(oauth2_scheme)] = None
):
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token") from None
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="User not found or inactive")
    return user


def admin_required(current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )
    return current_user


def hash_password(password: str):
    return pwd_hasher.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_hasher.verify(plain_password, hashed_password)


def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def create_access_token(data: dict):
    return jwt.encode(data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def validate_access_token(token: str):
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            return None
        return email
    except Exception:
        return None
