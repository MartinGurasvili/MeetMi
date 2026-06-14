from datetime import datetime, time, timedelta, timezone

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models import Booking, BookingStatus, Space, SpaceType

WORKDAY_START = time(9, 0)
WORKDAY_END = time(17, 0)


def as_utc_day_start(value: datetime) -> datetime:
    aware = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    day = aware.astimezone(timezone.utc).date()
    return datetime.combine(day, time.min, tzinfo=timezone.utc)


def desk_day_window(start_time: datetime) -> tuple[datetime, datetime]:
    day = as_utc_day_start(start_time).date()
    return (
        datetime.combine(day, WORKDAY_START, tzinfo=timezone.utc),
        datetime.combine(day, WORKDAY_END, tzinfo=timezone.utc),
    )


def day_end(start_time: datetime) -> datetime:
    return as_utc_day_start(start_time) + timedelta(days=1)


def normalize_booking_window(space_type: SpaceType, start_time: datetime, end_time: datetime) -> tuple[datetime, datetime]:
    if space_type == SpaceType.hot_desk:
        return desk_day_window(start_time)
    return start_time, end_time


def ensure_aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def times_overlap(start_a: datetime, end_a: datetime, start_b: datetime, end_b: datetime) -> bool:
    start_a = ensure_aware(start_a)
    end_a = ensure_aware(end_a)
    start_b = ensure_aware(start_b)
    end_b = ensure_aware(end_b)
    return start_a < end_b and end_a > start_b


def booking_blocks_space(
    space_type: SpaceType,
    booking_start: datetime,
    booking_end: datetime,
    query_start: datetime,
    query_end: datetime,
) -> bool:
    if space_type == SpaceType.hot_desk:
        return booking_start.astimezone(timezone.utc).date() == query_start.astimezone(timezone.utc).date()
    return times_overlap(booking_start, booking_end, query_start, query_end)


def user_has_desk_on_day(db: Session, user_id: int, day: datetime, exclude_booking_id: int | None = None) -> bool:
    day_start = as_utc_day_start(day)
    day_finish = day_start + timedelta(days=1)
    conditions = [
        Booking.user_id == user_id,
        Booking.status == BookingStatus.confirmed,
        Space.type == SpaceType.hot_desk,
        Booking.start_time < day_finish,
        Booking.end_time > day_start,
    ]
    if exclude_booking_id is not None:
        conditions.append(Booking.id != exclude_booking_id)
    stmt = select(Booking.id).join(Space, Space.id == Booking.space_id).where(and_(*conditions))
    return db.execute(stmt).first() is not None
