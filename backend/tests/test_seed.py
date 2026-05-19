from collections import defaultdict

from app.models import Booking, OfficeFloor, Space, User, UserRole
from app.seed import BOOKING_COUNT, seed_bookings, seed_floors_spaces, seed_users


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
