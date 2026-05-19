import enum
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class SpaceType(str, enum.Enum):
    hot_desk = "hot_desk"
    meeting_room = "meeting_room"


class BookingStatus(str, enum.Enum):
    confirmed = "confirmed"
    cancelled = "cancelled"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.user, nullable=False)
    preferred_zone: Mapped[str | None] = mapped_column(String(80))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    bookings: Mapped[list["Booking"]] = relationship(back_populates="user")


class OfficeFloor(Base):
    __tablename__ = "office_floors"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    floor_number: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    map_image_url: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    spaces: Mapped[list["Space"]] = relationship(back_populates="floor", cascade="all, delete-orphan")


class Equipment(Base):
    __tablename__ = "equipment"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    spaces: Mapped[list["Space"]] = relationship(secondary="space_equipment", back_populates="equipment")


class SpaceEquipment(Base):
    __tablename__ = "space_equipment"
    __table_args__ = (UniqueConstraint("space_id", "equipment_id", name="uq_space_equipment"),)

    space_id: Mapped[int] = mapped_column(ForeignKey("spaces.id", ondelete="CASCADE"), primary_key=True)
    equipment_id: Mapped[int] = mapped_column(ForeignKey("equipment.id", ondelete="CASCADE"), primary_key=True)


class Space(Base):
    __tablename__ = "spaces"
    __table_args__ = (UniqueConstraint("floor_id", "layout_local_id", name="uq_space_floor_layout_local_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    floor_id: Mapped[int] = mapped_column(ForeignKey("office_floors.id"), nullable=False, index=True)
    layout_local_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    type: Mapped[SpaceType] = mapped_column(Enum(SpaceType), nullable=False, index=True)
    zone: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    x_coordinate: Mapped[float] = mapped_column(Float, nullable=False)
    y_coordinate: Mapped[float] = mapped_column(Float, nullable=False)
    z_coordinate: Mapped[float | None] = mapped_column(Float)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    floor: Mapped[OfficeFloor] = relationship(back_populates="spaces")
    equipment: Mapped[list[Equipment]] = relationship(secondary="space_equipment", back_populates="spaces")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="space")


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    space_id: Mapped[int] = mapped_column(ForeignKey("spaces.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(140), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    attendee_count: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[BookingStatus] = mapped_column(Enum(BookingStatus), default=BookingStatus.confirmed, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="bookings")
    space: Mapped[Space] = relationship(back_populates="bookings")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    actor_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_id: Mapped[int | None] = mapped_column(Integer)
    detail: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
