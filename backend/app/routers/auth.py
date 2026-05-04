from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import create_access_token, create_refresh_token, decode_token
from app.config import get_settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas import TokenPair, UserCreate, UserLogin, UserRead
from app.security.password import hash_password, verify_password
from app.services.audit_service import log_audit

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie("meetmi_refresh", token, httponly=True, secure=settings.cookie_secure, samesite="lax", max_age=settings.refresh_token_expire_days * 24 * 60 * 60, path="/api/auth/refresh")


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.execute(select(User).where(User.email == payload.email.lower())).scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(email=payload.email.lower(), full_name=payload.full_name, hashed_password=hash_password(payload.password), preferred_zone=payload.preferred_zone)
    db.add(user)
    log_audit(db, None, "user_registered", "user", None, payload.email.lower())
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenPair)
def login(payload: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == payload.email.lower())).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        log_audit(db, None, "login_failed", "user", None, payload.email.lower())
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    access_token = create_access_token(user.id)
    set_refresh_cookie(response, create_refresh_token(user.id))
    log_audit(db, user.id, "login_success", "user", user.id)
    db.commit()
    return TokenPair(access_token=access_token)


@router.post("/refresh", response_model=TokenPair)
def refresh(response: Response, meetmi_refresh: str | None = Cookie(default=None), db: Session = Depends(get_db)):
    if not meetmi_refresh:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh cookie")
    user_id = decode_token(meetmi_refresh, "refresh")
    user = db.get(User, user_id) if user_id else None
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    set_refresh_cookie(response, create_refresh_token(user.id))
    return TokenPair(access_token=create_access_token(user.id))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    response.delete_cookie("meetmi_refresh", path="/api/auth/refresh")
    return None


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user
