from fastapi import HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models import Booking, BookingStatus, Space
from app.schemas import BookingCreate, BookingUpdate
from app.services.audit_service import log_audit


def overlapping_booking_query(space_id: int, start_time, end_time, exclude_booking_id: int | None = None):
    conditions = [Booking.space_id == space_id, Booking.status == BookingStatus.confirmed, Booking.start_time < end_time, Booking.end_time > start_time]
    if exclude_booking_id is not None:
        conditions.append(Booking.id != exclude_booking_id)
    return select(Booking).where(and_(*conditions))


def create_booking(db: Session, user_id: int, payload: BookingCreate) -> Booking:
    space = db.get(Space, payload.space_id)
    if not space or not space.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active space not found")
    if payload.attendee_count > space.capacity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Attendee count exceeds space capacity")

    # Conflict check and insert run in one transaction. PostgreSQL honors FOR UPDATE row locks,
    # preventing two concurrent requests from both passing the overlap test before insert.
    # SQLite ignores row-level locks, so production should use PostgreSQL/RDS for strongest safety.
    conflict_stmt = overlapping_booking_query(payload.space_id, payload.start_time, payload.end_time).with_for_update()
    if db.execute(conflict_stmt).scalars().first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Space is already booked for this time")

    booking = Booking(user_id=user_id, **payload.model_dump())
    db.add(booking)
    log_audit(db, user_id, "booking_created", "booking", None, f"Space {payload.space_id}")
    db.commit()
    db.refresh(booking)
    return booking


def update_booking(db: Session, booking: Booking, payload: BookingUpdate, actor_user_id: int) -> Booking:
    data = payload.model_dump(exclude_unset=True)
    start_time = data.get("start_time", booking.start_time)
    end_time = data.get("end_time", booking.end_time)
    attendee_count = data.get("attendee_count", booking.attendee_count)
    space = db.get(Space, booking.space_id)
    if not space or attendee_count > space.capacity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid attendee count for space")
    conflict_stmt = overlapping_booking_query(booking.space_id, start_time, end_time, booking.id).with_for_update()
    if db.execute(conflict_stmt).scalars().first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Space is already booked for this time")
    for key, value in data.items():
        setattr(booking, key, value)
    log_audit(db, actor_user_id, "booking_updated", "booking", booking.id)
    db.commit()
    db.refresh(booking)
    return booking


def cancel_booking(db: Session, booking: Booking, actor_user_id: int, reason: str = "cancelled") -> Booking:
    booking.status = BookingStatus.cancelled
    log_audit(db, actor_user_id, "booking_cancelled", "booking", booking.id, reason)
    db.commit()
    db.refresh(booking)
    return booking
