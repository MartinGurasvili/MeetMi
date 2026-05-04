from fastapi import HTTPException, status

from app.models import User, UserRole


def require_admin_user(user: User) -> None:
    if user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")


def ensure_booking_owner_or_admin(user: User, booking_user_id: int) -> None:
    if user.role == UserRole.admin or user.id == booking_user_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to access this booking")
