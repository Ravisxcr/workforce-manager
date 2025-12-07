# Dashboard endpoint to display all user details
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from jose import JWTError, jwt
from schemas.auth import UserLogin, UserSignUp
from sqlalchemy.orm import Session

from db.session import get_db
from models.user import User
from services.auth import (authenticate_user, create_access_token,
                           hash_password, oauth2_scheme, validate_access_token, get_current_active_user)
from utils.config import settings

router = APIRouter()


@router.post("/login")
def login(user_login: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, user_login.email, user_login.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.email, "is_admin": user.is_admin})
    return {"access_token": token, "token_type": "bearer", "is_admin": user.is_admin}


# Add new user endpoint (enabled/disabled by env var)


@router.post("/add-user")
def add_user(
    new_user: UserSignUp,
    db: Session = Depends(get_db),
):
    if settings.ENABLE_ADD_USER is False:
        raise HTTPException(status_code=403, detail="Add user endpoint is disabled")
    if db.query(User).filter(User.email == new_user.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    password = new_user.password
    hashed_password = hash_password(password)
    user = User(
        email=new_user.email,
        full_name=new_user.full_name,
        hashed_password=hashed_password,
        is_admin=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"email": user.email, "id": str(user.id)}


# Delete user endpoint (enabled/disabled by env var)
@router.delete("/delete-user/{email}")
def delete_user(
    email: str,
    db: Session = Depends(get_db),
    token: Annotated[str, Depends(oauth2_scheme)] = None,
):
    # Only allow if token is valid and user is admin
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_email: str = payload.get("sub")
        if token_email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.query(User).filter(User.email == token_email).first()
        if not user or not user.is_admin:
            raise HTTPException(status_code=403, detail="Admin privileges required")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if not getattr(settings, "ENABLE_DELETE_USER", False):
        raise HTTPException(status_code=403, detail="Delete user endpoint is disabled")
    user_to_delete = db.query(User).filter(User.email == email).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user_to_delete)
    db.commit()
    return {"detail": f"User {email} deleted"}


# Refresh token endpoint
@router.post("/refresh-token")
def refresh_token(
    token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)
):
    try:
        email = validate_access_token(token)
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        new_token = create_access_token({"sub": user.email, "is_admin": user.is_admin})
        return {
            "access_token": new_token,
            "token_type": "bearer",
            "is_admin": user.is_admin,
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/user-info")
def get_user_info(
    db: Session = Depends(get_db), current_user: Annotated[User, Depends(get_current_active_user)] = None
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_admin": current_user.is_admin,
        "is_active": current_user.is_active,
    }
