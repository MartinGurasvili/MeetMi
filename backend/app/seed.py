from datetime import datetime, time, timedelta, timezone
from random import Random

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.data.layout_manifest import LAYOUT_SPACES
from app.database import Base, SessionLocal, engine
from app.models import AuditLog, Booking, Equipment, OfficeFloor, Space, SpaceEquipment, SpaceType, User, UserRole
from app.security.password import hash_password

EQUIPMENT = ["monitor", "docking station", "standing desk", "whiteboard", "projector", "video conferencing", "speakers", "accessibility access"]
BOOKING_COUNT = 220

DEMO_USERS = [
    {"email": "admin@meetmi.example.com", "full_name": "MeetMi Admin", "password": "AdminPass123", "role": UserRole.admin, "preferred_zone": "Manchester West"},
    {"email": "ops@meetmi.example.com", "full_name": "Operations Admin", "password": "OpsPass123", "role": UserRole.admin, "preferred_zone": "London Central"},
    {"email": "user@meetmi.example.com", "full_name": "Demo User", "password": "UserPass123", "role": UserRole.user, "preferred_zone": "London Central"},
    {"email": "alex@meetmi.example.com", "full_name": "Alex Morgan", "password": "UserPass123", "role": UserRole.user, "preferred_zone": "Manchester East"},
    {"email": "sam@meetmi.example.com", "full_name": "Sam Taylor", "password": "UserPass123", "role": UserRole.user, "preferred_zone": "London West"},
]

FLOORS = [
    OfficeFloor(id=1, name="Manchester", floor_number=1, description="Manchester office with layout-matched desks and rooms"),
    OfficeFloor(id=3, name="London Office", floor_number=7, description="London level 7 office with layout-matched desks and rooms"),
]


def office_zone(floor_id: int, x_coordinate: float, fallback: str) -> str:
    if fallback and fallback != "Zone":
        return fallback
    city = "Manchester" if floor_id == 1 else "London"
    if x_coordinate < 380:
        return f"{city} West"
    if x_coordinate > 700:
        return f"{city} East"
    return f"{city} Central"


def reset_sequence(db: Session, table_name: str, value: int) -> None:
    if db.bind and db.bind.dialect.name == "postgresql":
        db.execute(text(f"SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), :value, true)"), {"value": value})


def seed_users(db: Session) -> list[User]:
    users: list[User] = []
    for item in DEMO_USERS:
        user = db.query(User).filter(User.email == item["email"]).one_or_none()
        if user is None:
            user = User(email=item["email"], full_name=item["full_name"], hashed_password=hash_password(item["password"]))
            db.add(user)
        user.full_name = item["full_name"]
        user.hashed_password = hash_password(item["password"])
        user.role = item["role"]
        user.preferred_zone = item["preferred_zone"]
        user.is_active = True
        users.append(user)
    db.flush()
    return users


def seed_floors_spaces(db: Session) -> list[Space]:
    db.query(Booking).delete()
    db.query(AuditLog).delete()
    db.query(SpaceEquipment).delete()
    db.query(Space).delete()
    db.query(OfficeFloor).delete()
    db.query(Equipment).delete()

    db.add_all(FLOORS)
    equipment = [Equipment(name=name) for name in EQUIPMENT]
    db.add_all(equipment)
    db.flush()

    equipment_by_index = list(equipment)
    spaces: list[Space] = []
    for index, item in enumerate(LAYOUT_SPACES):
        floor_id = int(item["floor_id"])
        space_type = SpaceType.hot_desk if item["kind"] == "hot_desk" else SpaceType.meeting_room
        space = Space(
            floor_id=floor_id,
            layout_local_id=int(item["layout_local_id"]),
            name=str(item["name"]),
            type=space_type,
            zone=office_zone(floor_id, float(item["x"]), str(item.get("zone") or "")),
            x_coordinate=float(item["x"]),
            y_coordinate=float(item["y"]),
            capacity=int(item["capacity"]),
            description="Layout-matched demo hot desk." if space_type == SpaceType.hot_desk else "Layout-matched demo meeting room.",
            equipment=[
                equipment_by_index[index % len(equipment_by_index)],
                equipment_by_index[(index + 1) % len(equipment_by_index)],
            ],
        )
        spaces.append(space)
    db.add_all(spaces)
    db.flush()
    reset_sequence(db, "office_floors", max(floor.id for floor in FLOORS))
    return spaces


def next_weekdays(days: int = 60) -> list[datetime]:
    today = datetime.now(timezone.utc).date()
    return [
        datetime.combine(today + timedelta(days=offset), time(hour=0), tzinfo=timezone.utc)
        for offset in range(1, days + 1)
        if (today + timedelta(days=offset)).weekday() < 5
    ]


def seed_bookings(db: Session, users: list[User], spaces: list[Space]) -> None:
    rng = Random(42)
    bookable_spaces = [space for space in spaces if space.is_active]
    user_cycle = [user for user in users if user.role == UserRole.user]
    if not bookable_spaces or not user_cycle:
        return

    starts = [9, 10, 11, 13, 14, 15, 16]
    existing: dict[int, list[tuple[datetime, datetime]]] = {}
    bookings: list[Booking] = []
    days = next_weekdays()

    attempts = 0
    while len(bookings) < BOOKING_COUNT and attempts < BOOKING_COUNT * 20:
        attempts += 1
        day = days[attempts % len(days)]
        space = bookable_spaces[rng.randrange(len(bookable_spaces))]
        hour = starts[rng.randrange(len(starts))]
        duration = 1 if space.type == SpaceType.hot_desk else rng.choice([1, 1, 2])
        start = day.replace(hour=hour)
        end = start + timedelta(hours=duration)
        windows = existing.setdefault(space.id, [])
        if any(start < booked_end and end > booked_start for booked_start, booked_end in windows):
            continue
        windows.append((start, end))
        user = user_cycle[len(bookings) % len(user_cycle)]
        title_prefix = "Desk booking" if space.type == SpaceType.hot_desk else "Room booking"
        bookings.append(
            Booking(
                user_id=user.id,
                space_id=space.id,
                title=f"{title_prefix}: {space.name}",
                start_time=start,
                end_time=end,
                attendee_count=1 if space.type == SpaceType.hot_desk else min(space.capacity, rng.choice([2, 3, 4, 6])),
            )
        )

    db.add_all(bookings)


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        users = seed_users(db)
        spaces = seed_floors_spaces(db)
        seed_bookings(db, users, spaces)
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
