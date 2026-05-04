from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.dependencies import get_admin_user
from app.models import AuditLog, Booking, Equipment, OfficeFloor, Space, User
from app.schemas import AuditLogRead, EquipmentCreate, EquipmentRead, ImagePromptRead, OfficeFloorCreate, OfficeFloorRead, SpaceCreate, SpaceRead, SpaceUpdate
from app.services.audit_service import log_audit
from app.services.booking_service import cancel_booking
from app.services.image_prompt_service import generate_image_prompt

router = APIRouter(prefix="/admin", tags=["admin"])


def load_equipment(db: Session, equipment_ids: list[int]) -> list[Equipment]:
    if not equipment_ids:
        return []
    items = db.execute(select(Equipment).where(Equipment.id.in_(equipment_ids))).scalars().all()
    if len(items) != len(set(equipment_ids)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid equipment id")
    return items


@router.post("/floors", response_model=OfficeFloorRead, status_code=status.HTTP_201_CREATED)
def create_floor(payload: OfficeFloorCreate, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    floor = OfficeFloor(**payload.model_dump())
    db.add(floor)
    log_audit(db, admin.id, "floor_created", "floor", None, payload.name)
    db.commit()
    db.refresh(floor)
    return floor


@router.post("/equipment", response_model=EquipmentRead, status_code=status.HTTP_201_CREATED)
def create_equipment(payload: EquipmentCreate, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    item = Equipment(**payload.model_dump())
    db.add(item)
    log_audit(db, admin.id, "equipment_created", "equipment", None, payload.name)
    db.commit()
    db.refresh(item)
    return item


@router.post("/spaces", response_model=SpaceRead, status_code=status.HTTP_201_CREATED)
def create_space(payload: SpaceCreate, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    if not db.get(OfficeFloor, payload.floor_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid floor id")
    space = Space(**payload.model_dump(exclude={"equipment_ids"}), equipment=load_equipment(db, payload.equipment_ids))
    db.add(space)
    log_audit(db, admin.id, "space_created", "space", None, payload.name)
    db.commit()
    db.refresh(space)
    return space


@router.patch("/spaces/{space_id}", response_model=SpaceRead)
def update_space(space_id: int, payload: SpaceUpdate, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    space = db.execute(select(Space).options(selectinload(Space.equipment)).where(Space.id == space_id)).scalar_one_or_none()
    if not space:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Space not found")
    data = payload.model_dump(exclude_unset=True, exclude={"equipment_ids"})
    for key, value in data.items():
        setattr(space, key, value)
    if payload.equipment_ids is not None:
        space.equipment = load_equipment(db, payload.equipment_ids)
    log_audit(db, admin.id, "space_updated", "space", space.id)
    db.commit()
    db.refresh(space)
    return space


@router.delete("/spaces/{space_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_space(space_id: int, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    space = db.get(Space, space_id)
    if not space:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Space not found")
    space.is_active = False
    log_audit(db, admin.id, "space_deactivated", "space", space.id)
    db.commit()
    return None


@router.get("/bookings", response_model=list[dict])
def all_bookings(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    rows = db.execute(select(Booking).options(selectinload(Booking.space), selectinload(Booking.user)).order_by(Booking.start_time.desc())).scalars().all()
    return [{"id": b.id, "title": b.title, "user_email": b.user.email, "space_name": b.space.name, "start_time": b.start_time, "end_time": b.end_time, "status": b.status} for b in rows]


@router.post("/bookings/{booking_id}/cancel", response_model=dict)
def admin_cancel_booking(booking_id: int, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    cancelled = cancel_booking(db, booking, admin.id, "admin override")
    return {"id": cancelled.id, "status": cancelled.status}


@router.get("/audit-logs", response_model=list[AuditLogRead])
def audit_logs(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    return db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(200)).scalars().all()


@router.get("/spaces/{space_id}/image-prompt", response_model=ImagePromptRead)
def image_prompt(space_id: int, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    space = db.execute(select(Space).options(selectinload(Space.equipment)).where(Space.id == space_id)).scalar_one_or_none()
    if not space:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Space not found")
    prompt = generate_image_prompt(space)
    log_audit(db, admin.id, "image_prompt_generated", "space", space.id)
    db.commit()
    return ImagePromptRead(space_id=space.id, prompt=prompt)
