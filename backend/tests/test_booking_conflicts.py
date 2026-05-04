from datetime import timedelta
import pytest
from fastapi import HTTPException

from app.models import BookingStatus, Space
from app.schemas import BookingCreate
from app.services.booking_service import create_booking


def test_booking_conflict_detection_blocks_overlap(db_session, future_window):
    start, end = future_window
    space = db_session.query(Space).filter_by(name="Room 1").one()
    payload = BookingCreate(space_id=space.id, title="Planning", start_time=start, end_time=end, attendee_count=3)
    first = create_booking(db_session, 1, payload)
    assert first.status == BookingStatus.confirmed
    with pytest.raises(HTTPException) as exc:
        create_booking(db_session, 2, payload)
    assert exc.value.status_code == 409


def test_adjacent_bookings_are_allowed(db_session, future_window):
    start, end = future_window
    space = db_session.query(Space).filter_by(name="Room 1").one()
    create_booking(db_session, 1, BookingCreate(space_id=space.id, title="First", start_time=start, end_time=end, attendee_count=2))
    second = create_booking(db_session, 2, BookingCreate(space_id=space.id, title="Second", start_time=end, end_time=end + timedelta(hours=1), attendee_count=2))
    assert second.id is not None
