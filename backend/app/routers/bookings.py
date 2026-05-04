from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Booking, Space, User
from app.schemas import BookingCreate, BookingRead, BookingUpdate
from app.security.permissions import ensure_booking_owner_or_admin
from app.services.audit_service import log_audit
from app.services.booking_service import cancel_booking, create_booking, update_booking

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("", response_model=list[BookingRead])
def my_bookings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.execute(select(Booking).options(selectinload(Booking.space).selectinload(Space.equipment)).where(Booking.user_id == current_user.id).order_by(Booking.start_time.desc())).scalars().all()


@router.post("", response_model=BookingRead, status_code=status.HTTP_201_CREATED)
def create(payload: BookingCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return create_booking(db, current_user.id, payload)


@router.patch("/{booking_id}", response_model=BookingRead)
def update(booking_id: int, payload: BookingUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    try:
        ensure_booking_owner_or_admin(current_user, booking.user_id)
    except HTTPException:
        log_audit(db, current_user.id, "permission_denied", "booking", booking.id, "Edit another user's booking")
        db.commit()
        raise
    return update_booking(db, booking, payload, current_user.id)


@router.delete("/{booking_id}", response_model=BookingRead)
def cancel(booking_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    try:
        ensure_booking_owner_or_admin(current_user, booking.user_id)
    except HTTPException:
        log_audit(db, current_user.id, "permission_denied", "booking", booking.id, "Cancel another user's booking")
        db.commit()
        raise
    return cancel_booking(db, booking, current_user.id)
