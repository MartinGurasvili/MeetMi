from app.database import Base, SessionLocal, engine
from app.models import Booking, Equipment, OfficeFloor, Space, SpaceEquipment, SpaceType, User, UserRole
from app.security.password import hash_password

EQUIPMENT = ["monitor", "docking station", "standing desk", "whiteboard", "projector", "video conferencing", "speakers", "accessibility access"]


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not db.query(User).count():
            db.add_all([
                User(email="admin@meetmi.local", full_name="MeetMi Admin", hashed_password=hash_password("AdminPass123"), role=UserRole.admin, preferred_zone="Manchester West"),
                User(email="user@meetmi.local", full_name="Demo User", hashed_password=hash_password("UserPass123"), role=UserRole.user, preferred_zone="London Central"),
            ])
        db.query(Booking).delete()
        db.query(SpaceEquipment).delete()
        db.query(Space).delete()
        db.query(OfficeFloor).delete()
        db.query(Equipment).delete()
        equipment = [Equipment(name=name) for name in EQUIPMENT]
        db.add_all(equipment)
        floors = [OfficeFloor(name="Manchester Office", floor_number=1, description="Manchester office with west/east wings and central bridge"), OfficeFloor(name="London Office", floor_number=7, description="London level 7 office with long angled suite")]
        db.add_all(floors)
        db.flush()
        desk_coordinates = [
            (0, 150, 165, "Manchester West"), (0, 275, 165, "Manchester West"), (0, 155, 275, "Manchester West"), (0, 305, 280, "Manchester West"),
            (0, 165, 405, "Manchester West"), (0, 285, 535, "Manchester West"), (0, 600, 410, "Manchester Central"), (0, 730, 535, "Manchester East"),
            (0, 780, 140, "Manchester East"), (0, 870, 200, "Manchester East"), (0, 790, 315, "Manchester East"), (0, 835, 655, "Manchester East"),
            (1, 220, 645, "London West"), (1, 290, 585, "London West"), (1, 320, 535, "London West"), (1, 405, 615, "London Central"),
            (1, 520, 610, "London Central"), (1, 610, 565, "London Central"), (1, 750, 250, "London East"), (1, 855, 330, "London East"),
        ]
        for i, (floor_index, x, y, zone) in enumerate(desk_coordinates):
            prefix = "M" if floor_index == 0 else "L"
            db.add(Space(floor_id=floors[floor_index].id, name=f"Desk {prefix}{i+1:02d}", type=SpaceType.hot_desk, zone=zone, x_coordinate=x, y_coordinate=y, capacity=1, description="Ergonomic hot desk with premium lighting", equipment=[equipment[i % len(equipment)], equipment[(i + 1) % len(equipment)]]))
        room_coordinates = [
            (0, "Manchester Boardroom", 110, 105, "Manchester West", 12),
            (0, "Manchester Focus Room", 270, 710, "Manchester West", 4),
            (0, "Manchester Bridge Room", 610, 405, "Manchester Central", 6),
            (0, "Manchester East Suite", 825, 410, "Manchester East", 10),
            (1, "London Client Room", 135, 690, "London West", 8),
            (1, "London Studio", 455, 630, "London Central", 6),
            (1, "London Roundtable", 850, 475, "London East", 10),
            (1, "London Quiet Room", 835, 95, "London East", 4),
        ]
        for i, (floor_index, name, x, y, zone, capacity) in enumerate(room_coordinates):
            db.add(Space(floor_id=floors[floor_index].id, name=name, type=SpaceType.meeting_room, zone=zone, x_coordinate=x, y_coordinate=y, capacity=capacity, description="Premium meeting room with collaboration-ready AV", equipment=[equipment[3], equipment[4], equipment[5], equipment[6]][: 2 + i % 3]))
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
