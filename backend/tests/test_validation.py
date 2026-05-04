from datetime import datetime, timedelta, timezone
import pytest
from pydantic import ValidationError

from app.schemas import BookingCreate


def test_invalid_input_rejection_for_past_booking():
    with pytest.raises(ValidationError):
        BookingCreate(space_id=1, title="Past", start_time=datetime.now(timezone.utc) - timedelta(hours=1), end_time=datetime.now(timezone.utc), attendee_count=1)


def test_invalid_input_rejection_for_negative_attendees(future_window):
    start, end = future_window
    with pytest.raises(ValidationError):
        BookingCreate(space_id=1, title="Bad", start_time=start, end_time=end, attendee_count=0)
