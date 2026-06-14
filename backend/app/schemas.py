from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.models import BookingStatus, SpaceType, UserRole


def as_aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def ensure_weekday(value: datetime) -> None:
    if value.weekday() >= 5:
        raise ValueError("Bookings are only available Monday to Friday")


class TokenPair(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    preferred_zone: str | None = Field(default=None, max_length=80)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    preferred_zone: str | None = None
    is_active: bool
    model_config = ConfigDict(from_attributes=True)


class EquipmentRead(BaseModel):
    id: int
    name: str
    description: str | None = None
    model_config = ConfigDict(from_attributes=True)


class EquipmentCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    description: str | None = Field(default=None, max_length=500)


class OfficeFloorBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    floor_number: int = Field(ge=-5, le=200)
    description: str | None = Field(default=None, max_length=1000)
    map_image_url: str | None = Field(default=None, max_length=500)
    is_active: bool = True


class OfficeFloorCreate(OfficeFloorBase):
    pass


class OfficeFloorRead(OfficeFloorBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class SpaceBase(BaseModel):
    floor_id: int
    layout_local_id: int | None = None
    name: str = Field(min_length=2, max_length=120)
    type: SpaceType
    zone: str = Field(min_length=2, max_length=80)
    x_coordinate: float = Field(ge=0, le=1000)
    y_coordinate: float = Field(ge=0, le=1000)
    z_coordinate: float | None = Field(default=None, ge=-100, le=100)
    capacity: int = Field(ge=1, le=100)
    description: str | None = Field(default=None, max_length=1000)
    image_url: str | None = Field(default=None, max_length=500)
    is_active: bool = True
    equipment_ids: list[int] = Field(default_factory=list)


class SpaceCreate(SpaceBase):
    pass


class SpaceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    type: SpaceType | None = None
    zone: str | None = Field(default=None, min_length=2, max_length=80)
    x_coordinate: float | None = Field(default=None, ge=0, le=1000)
    y_coordinate: float | None = Field(default=None, ge=0, le=1000)
    z_coordinate: float | None = Field(default=None, ge=-100, le=100)
    capacity: int | None = Field(default=None, ge=1, le=100)
    description: str | None = Field(default=None, max_length=1000)
    image_url: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None
    equipment_ids: list[int] | None = None


class SpaceRead(BaseModel):
    id: int
    floor_id: int
    layout_local_id: int | None = None
    name: str
    type: SpaceType
    zone: str
    x_coordinate: float
    y_coordinate: float
    z_coordinate: float | None = None
    capacity: int
    description: str | None = None
    image_url: str | None = None
    is_active: bool
    equipment: list[EquipmentRead] = []
    model_config = ConfigDict(from_attributes=True)


class BookingBase(BaseModel):
    space_id: int
    title: str = Field(min_length=2, max_length=140)
    start_time: datetime
    end_time: datetime
    attendee_count: int = Field(ge=1, le=100)

    @model_validator(mode="after")
    def validate_time_range(self):
        self.start_time = as_aware(self.start_time)
        self.end_time = as_aware(self.end_time)
        now = datetime.now(timezone.utc)
        if self.start_time < now:
            raise ValueError("start_time cannot be in the past")
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        ensure_weekday(self.start_time)
        return self


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=140)
    start_time: datetime | None = None
    end_time: datetime | None = None
    attendee_count: int | None = Field(default=None, ge=1, le=100)

    @model_validator(mode="after")
    def validate_optional_time_range(self):
        if self.start_time:
            self.start_time = as_aware(self.start_time)
        if self.end_time:
            self.end_time = as_aware(self.end_time)
        if self.start_time and self.start_time < datetime.now(timezone.utc):
            raise ValueError("start_time cannot be in the past")
        if self.start_time and self.end_time and self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        if self.start_time:
            ensure_weekday(self.start_time)
        return self


class BookingRead(BaseModel):
    id: int
    user_id: int
    space_id: int
    title: str
    start_time: datetime
    end_time: datetime
    attendee_count: int
    status: BookingStatus
    created_at: datetime
    updated_at: datetime
    space: SpaceRead | None = None
    model_config = ConfigDict(from_attributes=True)


class AvailabilityWindow(BaseModel):
    start_time: datetime
    end_time: datetime

    @model_validator(mode="after")
    def validate_window(self):
        self.start_time = as_aware(self.start_time)
        self.end_time = as_aware(self.end_time)
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        ensure_weekday(self.start_time)
        return self


class AvailabilitySummary(BaseModel):
    booked_space_ids: list[int]
    my_space_ids: list[int]


class RoomDayBooking(BaseModel):
    start_time: datetime
    end_time: datetime
    mine: bool = False


class RecommendationRequest(BaseModel):
    start_time: datetime
    end_time: datetime
    space_type: SpaceType
    attendee_count: int = Field(ge=1, le=100)
    required_equipment_ids: list[int] = Field(default_factory=list)
    optional_equipment_ids: list[int] = Field(default_factory=list)
    preferred_zone: str | None = Field(default=None, max_length=80)

    @model_validator(mode="after")
    def validate_request(self):
        self.start_time = as_aware(self.start_time)
        self.end_time = as_aware(self.end_time)
        if self.start_time < datetime.now(timezone.utc):
            raise ValueError("start_time cannot be in the past")
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        ensure_weekday(self.start_time)
        return self


class RecommendationRead(BaseModel):
    space: SpaceRead
    score: float
    explanation: list[str]


class AuditLogRead(BaseModel):
    id: int
    actor_user_id: int | None
    action: str
    entity_type: str
    entity_id: int | None
    detail: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ImagePromptRead(BaseModel):
    space_id: int
    prompt: str
