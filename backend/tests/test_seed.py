from collections import defaultdict

from app.models import Booking, OfficeFloor, Space, SpaceType, User, UserRole
from app.seed import BOOKING_COUNT, seed_bookings, seed_floors_spaces, seed_meeting_room_slots, seed_users


def test_seed_creates_demo_users_layout_spaces_and_bookings(db_session):
    users = seed_users(db_session)
    spaces = seed_floors_spaces(db_session)
    seed_bookings(db_session, users, spaces)
    db_session.commit()

    emails = {user.email: user for user in db_session.query(User).all()}
    assert {"admin@meetmi.example.com", "ops@meetmi.example.com", "user@meetmi.example.com", "alex@meetmi.example.com", "sam@meetmi.example.com"} <= set(emails)
    assert emails["admin@meetmi.example.com"].role == UserRole.admin
    assert emails["ops@meetmi.example.com"].role == UserRole.admin

    floors = {floor.id: floor.name for floor in db_session.query(OfficeFloor).all()}
    assert floors[1] == "Manchester"
    assert floors[3] == "London Office"

    seeded_spaces = db_session.query(Space).all()
    assert len(seeded_spaces) > 100
    assert all(space.layout_local_id is not None for space in seeded_spaces)

    bookings = db_session.query(Booking).all()
    assert len(bookings) == BOOKING_COUNT

    windows_by_space: dict[int, list[Booking]] = defaultdict(list)
    for booking in bookings:
        windows_by_space[booking.space_id].append(booking)

    for windows in windows_by_space.values():
        ordered = sorted(windows, key=lambda booking: booking.start_time)
        for previous, current in zip(ordered, ordered[1:]):
            assert previous.end_time <= current.start_time


def test_seed_meeting_room_slots_creates_two_hourly_bookings_per_day(db_session):
    users = seed_users(db_session)
    spaces = seed_floors_spaces(db_session)
    seed_meeting_room_slots(db_session, users, spaces)
    db_session.commit()

    rooms = db_session.query(Space).filter(Space.type == SpaceType.meeting_room).all()
    sample_ids = {space.id for space in sorted(rooms, key=lambda space: space.id)[: max(4, len(rooms) // 3)]}
    slot_bookings = db_session.query(Booking).filter(Booking.title.like("Slot booking:%")).all()
    assert slot_bookings

    by_room_day: dict[tuple[int, str], list[Booking]] = defaultdict(list)
    for booking in slot_bookings:
        if booking.space_id not in sample_ids:
            continue
        day_key = booking.start_time.date().isoformat()
        by_room_day[(booking.space_id, day_key)].append(booking)

    assert by_room_day
    for bookings in by_room_day.values():
        assert len(bookings) == 2
        ordered = sorted(bookings, key=lambda booking: booking.start_time)
        for booking in ordered:
            duration = booking.end_time - booking.start_time
            assert duration.total_seconds() == 3600
        assert ordered[0].end_time <= ordered[1].start_time
