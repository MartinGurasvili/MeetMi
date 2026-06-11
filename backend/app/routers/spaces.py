from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.dependencies import get_optional_user
from app.models import Booking, BookingStatus, Equipment, OfficeFloor, Space, User
from app.schemas import AvailabilitySummary, AvailabilityWindow, EquipmentRead, OfficeFloorRead, SpaceRead
from app.services.booking_rules import booking_blocks_space, day_end, as_utc_day_start

router = APIRouter(tags=["spaces"])


@router.get("/floors", response_model=list[OfficeFloorRead])
def floors(db: Session = Depends(get_db)):
    return db.execute(select(OfficeFloor).where(OfficeFloor.is_active.is_(True)).order_by(OfficeFloor.floor_number)).scalars().all()


@router.get("/equipment", response_model=list[EquipmentRead])
def equipment(db: Session = Depends(get_db)):
    return db.execute(select(Equipment).order_by(Equipment.name)).scalars().all()


@router.get("/spaces", response_model=list[SpaceRead])
def spaces(floor_id: int | None = None, db: Session = Depends(get_db)):
    stmt = select(Space).options(selectinload(Space.equipment)).where(Space.is_active.is_(True))
    if floor_id:
        stmt = stmt.where(Space.floor_id == floor_id)
    return db.execute(stmt.order_by(Space.floor_id, Space.name)).scalars().all()


@router.get("/spaces/{space_id}", response_model=SpaceRead)
def space_detail(space_id: int, db: Session = Depends(get_db)):
    space = db.execute(select(Space).options(selectinload(Space.equipment)).where(Space.id == space_id, Space.is_active.is_(True))).scalar_one_or_none()
    if not space:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Space not found")
    return space


def _availability_rows(db: Session, payload: AvailabilityWindow):
    day_start = as_utc_day_start(payload.start_time)
    day_finish = day_end(payload.start_time)
    return db.execute(
        select(Booking.space_id, Booking.user_id, Booking.start_time, Booking.end_time, Space.type)
        .join(Space, Space.id == Booking.space_id)
        .where(
            Booking.status == BookingStatus.confirmed,
            Booking.start_time < day_finish,
            Booking.end_time > day_start,
        )
    ).all()


def _summarize_availability(rows, payload: AvailabilityWindow, user: User | None) -> AvailabilitySummary:
    booked_ids: set[int] = set()
    my_ids: set[int] = set()
    for space_id, user_id, booking_start, booking_end, space_type in rows:
        if not booking_blocks_space(space_type, booking_start, booking_end, payload.start_time, payload.end_time):
            continue
        booked_ids.add(space_id)
        if user and user_id == user.id:
            my_ids.add(space_id)
    return AvailabilitySummary(booked_space_ids=sorted(booked_ids), my_space_ids=sorted(my_ids))


@router.post("/spaces/booked-ids", response_model=list[int])
def booked_space_ids(payload: AvailabilityWindow, db: Session = Depends(get_db)):
    return _summarize_availability(_availability_rows(db, payload), payload, None).booked_space_ids


@router.post("/spaces/availability", response_model=AvailabilitySummary)
def space_availability_window(
    payload: AvailabilityWindow,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    return _summarize_availability(_availability_rows(db, payload), payload, user)


@router.get("/spaces/{space_id}/availability")
def space_availability(space_id: int, start_time: datetime, end_time: datetime, db: Session = Depends(get_db)):
    space = db.get(Space, space_id)
    if not space:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Space not found")
    rows = db.execute(
        select(Booking.start_time, Booking.end_time)
        .where(and_(Booking.space_id == space_id, Booking.status == BookingStatus.confirmed))
    ).all()
    conflict = any(booking_blocks_space(space.type, row[0], row[1], start_time, end_time) for row in rows)
    return {"space_id": space_id, "available": not conflict}
