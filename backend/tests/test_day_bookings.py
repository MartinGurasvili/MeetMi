from datetime import datetime, timedelta, timezone

from app.models import Space, User
from app.routers.spaces import space_day_bookings
from app.schemas import BookingCreate
from app.services.booking_service import create_booking


def test_day_bookings_returns_busy_windows_and_mine_flag(db_session):
    room = db_session.query(Space).filter_by(name="Room 1").one()
    user = db_session.query(User).filter_by(email="user@test.com").one()
    start = datetime.now(timezone.utc) + timedelta(days=2)
    while start.weekday() >= 5:
        start += timedelta(days=1)
    day = start.replace(hour=10, minute=0, second=0, microsecond=0)
    end = day + timedelta(hours=1)

    create_booking(
        db_session,
        user.id,
        BookingCreate(space_id=room.id, title="Stand-up", start_time=day, end_time=end, attendee_count=3),
    )

    date_str = day.date().isoformat()
    anonymous = space_day_bookings(room.id, booking_date=date_str, db=db_session, user=None)
    assert len(anonymous) == 1
    assert anonymous[0].mine is False

    mine = space_day_bookings(room.id, booking_date=date_str, db=db_session, user=user)
    assert len(mine) == 1
    assert mine[0].mine is True


def test_day_bookings_rejects_hot_desk(db_session):
    from fastapi import HTTPException
    import pytest

    desk = db_session.query(Space).filter_by(name="Desk 1").one()
    day = (datetime.now(timezone.utc) + timedelta(days=2)).date().isoformat()
    with pytest.raises(HTTPException) as exc:
        space_day_bookings(desk.id, booking_date=day, db=db_session, user=None)
    assert exc.value.status_code == 400
