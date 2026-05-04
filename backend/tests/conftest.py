from datetime import datetime, timedelta, timezone
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import Equipment, OfficeFloor, Space, SpaceType, User, UserRole
from app.security.password import hash_password


@pytest.fixture()
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    floor = OfficeFloor(name="Test Floor", floor_number=1)
    monitor = Equipment(name="monitor")
    whiteboard = Equipment(name="whiteboard")
    db.add_all([floor, monitor, whiteboard])
    db.flush()
    user = User(email="user@test.com", full_name="User", hashed_password=hash_password("Password123"), role=UserRole.user)
    other = User(email="other@test.com", full_name="Other", hashed_password=hash_password("Password123"), role=UserRole.user)
    admin = User(email="admin@test.com", full_name="Admin", hashed_password=hash_password("Password123"), role=UserRole.admin)
    desk = Space(floor_id=floor.id, name="Desk 1", type=SpaceType.hot_desk, zone="North Zone", x_coordinate=10, y_coordinate=20, capacity=1, equipment=[monitor])
    room = Space(floor_id=floor.id, name="Room 1", type=SpaceType.meeting_room, zone="North Zone", x_coordinate=20, y_coordinate=30, capacity=4, equipment=[monitor, whiteboard])
    room_big = Space(floor_id=floor.id, name="Room 2", type=SpaceType.meeting_room, zone="South Zone", x_coordinate=40, y_coordinate=50, capacity=10, equipment=[monitor])
    db.add_all([user, other, admin, desk, room, room_big])
    db.commit()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def future_window():
    start = datetime.now(timezone.utc) + timedelta(days=1)
    return start, start + timedelta(hours=1)
