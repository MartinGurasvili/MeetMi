from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import decode_token
from app.database import get_db
from app.models import User, UserRole
from app.services.audit_service import log_audit


def get_current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    user_id = decode_token(authorization.removeprefix("Bearer ").strip(), "access")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive or missing user")
    return user


def get_admin_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    if current_user.role != UserRole.admin:
        log_audit(db, current_user.id, "permission_denied", "admin_route", None, "Admin-only endpoint access denied")
        db.commit()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
    return current_user
