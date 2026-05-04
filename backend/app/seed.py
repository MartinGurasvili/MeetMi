from app.database import Base, SessionLocal, engine
from app.models import Equipment, OfficeFloor, Space, SpaceType, User, UserRole
from app.security.password import hash_password

EQUIPMENT = ["monitor", "docking station", "standing desk", "whiteboard", "projector", "video conferencing", "speakers", "accessibility access"]


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count():
            return
        db.add_all([
            User(email="admin@meetmi.local", full_name="MeetMi Admin", hashed_password=hash_password("AdminPass123"), role=UserRole.admin, preferred_zone="North Zone"),
            User(email="user@meetmi.local", full_name="Demo User", hashed_password=hash_password("UserPass123"), role=UserRole.user, preferred_zone="East Zone"),
        ])
        equipment = [Equipment(name=name) for name in EQUIPMENT]
        db.add_all(equipment)
        floors = [OfficeFloor(name="Atlas Floor", floor_number=1, description="Primary collaboration floor"), OfficeFloor(name="Orion Floor", floor_number=2, description="Quiet focus and meeting floor")]
        db.add_all(floors)
        db.flush()
        zones = ["North Zone", "East Zone", "South Zone", "West Zone"]
        for i in range(20):
            db.add(Space(floor_id=floors[0 if i < 12 else 1].id, name=f"Desk A{i+1:02d}", type=SpaceType.hot_desk, zone=zones[i % 4], x_coordinate=80 + (i % 5) * 130, y_coordinate=90 + (i // 5) * 95, capacity=1, description="Ergonomic hot desk with premium lighting", equipment=[equipment[i % len(equipment)], equipment[(i + 1) % len(equipment)]]))
        for i in range(5):
            db.add(Space(floor_id=floors[i % 2].id, name=f"Room {chr(65+i)}", type=SpaceType.meeting_room, zone=zones[(i + 1) % 4], x_coordinate=150 + i * 120, y_coordinate=420 + (i % 2) * 120, capacity=[4, 6, 8, 10, 12][i], description="Premium meeting room", equipment=[equipment[3], equipment[4], equipment[5], equipment[6]][: 2 + i % 3]))
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
