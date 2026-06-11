from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from app.models import Booking, Space, SpaceType, User
from app.schemas import BookingCreate
from app.services.booking_rules import desk_day_window, normalize_booking_window
from app.services.booking_service import create_booking


def test_hot_desk_booking_normalizes_to_full_day(db_session, future_window):
    start, end = future_window
    desk = db_session.query(Space).filter(Space.type == SpaceType.hot_desk).first()
    user = db_session.query(User).filter(User.email == "user@test.com").first()
    booking = create_booking(
        db_session,
        user.id,
        BookingCreate(space_id=desk.id, title="Desk day", start_time=start, end_time=end, attendee_count=1),
    )
    expected_start, expected_end = desk_day_window(start)
    assert booking.start_time.replace(tzinfo=timezone.utc) == expected_start
    assert booking.end_time.replace(tzinfo=timezone.utc) == expected_end


def test_user_can_only_book_one_desk_per_day(db_session, future_window):
    start, end = future_window
    user = db_session.query(User).filter(User.email == "user@test.com").first()
    floor_id = db_session.query(Space).filter(Space.type == SpaceType.hot_desk).first().floor_id
    second_desk = Space(
        floor_id=floor_id,
        name="Desk 2",
        type=SpaceType.hot_desk,
        zone="North Zone",
        x_coordinate=12,
        y_coordinate=22,
        capacity=1,
        equipment=[],
    )
    db_session.add(second_desk)
    db_session.commit()

    desk = db_session.query(Space).filter(Space.type == SpaceType.hot_desk, Space.name == "Desk 1").first()
    create_booking(
        db_session,
        user.id,
        BookingCreate(space_id=desk.id, title="First desk", start_time=start, end_time=end, attendee_count=1),
    )
    with pytest.raises(HTTPException) as exc:
        create_booking(
            db_session,
            user.id,
            BookingCreate(space_id=second_desk.id, title="Second desk", start_time=start, end_time=end, attendee_count=1),
        )
    assert exc.value.status_code == 409
    assert "already have a desk" in exc.value.detail.lower()


def test_meeting_room_bookings_keep_requested_window(future_window):
    start, end = future_window
    normalized_start, normalized_end = normalize_booking_window(SpaceType.meeting_room, start, end)
    assert normalized_start == start
    assert normalized_end == end
