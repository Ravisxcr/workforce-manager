import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from jose import JWTError, jwt
from schemas.auth import (ChangePassword, ForgotPassword, ResetPassword,
                          UserLogin, UserSignUp)
from sqlalchemy.orm import Session

from db.session import get_db
from models.user import User
from services.auth import (authenticate_user, create_access_token,
                           get_current_active_user, hash_password,
                           oauth2_scheme, validate_access_token,
                           verify_password)
from utils.config import settings

router = APIRouter()


@router.post("/login")
def login(user_login: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, user_login.email, user_login.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.email, "is_admin": user.is_admin})
    return {"access_token": token, "token_type": "bearer", "is_admin": user.is_admin}


@router.post("/logout")
def logout(current_user: User = Depends(get_current_active_user)):
    # JWT is stateless; client should discard the token.
    # Server-side blacklisting would require a cache (Redis) — not in scope here.
    return {"detail": "Logged out successfully"}


@router.post("/add-user")
def add_user(new_user: UserSignUp, db: Session = Depends(get_db)):
    if settings.ENABLE_ADD_USER is False:
        raise HTTPException(status_code=403, detail="Add user endpoint is disabled")
    if db.query(User).filter(User.email == new_user.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    user = User(
        email=new_user.email,
        full_name=new_user.full_name,
        hashed_password=hash_password(new_user.password),
        is_admin=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"email": user.email, "id": str(user.id)}


@router.delete("/delete-user/{email}")
def delete_user(
    email: str,
    db: Session = Depends(get_db),
    token: Annotated[str, Depends(oauth2_scheme)] = None,
):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
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
        return {"access_token": new_token, "token_type": "bearer", "is_admin": user.is_admin}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/user-info")
def get_user_info(current_user: User = Depends(get_current_active_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_admin": current_user.is_admin,
        "is_active": current_user.is_active,
    }


@router.post("/change-password")
def change_password(
    body: ChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = hash_password(body.new_password)
    db.commit()
    return {"detail": "Password changed successfully"}


@router.post("/forgot-password")
def forgot_password(body: ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    # Always return 200 to avoid leaking whether an email exists
    if not user:
        return {"detail": "If that email is registered, a reset token has been sent"}
    token = secrets.token_urlsafe(32)
    user.password_reset_token = token
    user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()
    # In production: send token via email. Here we return it directly for dev.
    return {
        "detail": "Password reset token generated",
        "reset_token": token,
    }


@router.post("/reset-password")
def reset_password(body: ResetPassword, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(User.password_reset_token == body.token)
        .first()
    )
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if user.password_reset_expires and datetime.now(timezone.utc) > user.password_reset_expires.replace(tzinfo=timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired")
    user.hashed_password = hash_password(body.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()
    return {"detail": "Password reset successfully"}
