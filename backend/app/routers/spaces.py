from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Booking, BookingStatus, Equipment, OfficeFloor, Space
from app.schemas import EquipmentRead, OfficeFloorRead, SpaceRead

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


@router.get("/spaces/{space_id}/availability")
def space_availability(space_id: int, start_time: datetime, end_time: datetime, db: Session = Depends(get_db)):
    conflict = db.execute(select(Booking.id).where(and_(Booking.space_id == space_id, Booking.status == BookingStatus.confirmed, Booking.start_time < end_time, Booking.end_time > start_time))).first()
    return {"space_id": space_id, "available": conflict is None}
