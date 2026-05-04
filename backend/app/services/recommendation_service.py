from sqlalchemy import and_, select
from sqlalchemy.orm import Session, selectinload

from app.models import Booking, BookingStatus, Equipment, Space
from app.schemas import RecommendationRead, RecommendationRequest


def recommend_spaces(db: Session, request: RecommendationRequest) -> list[RecommendationRead]:
    spaces = db.execute(select(Space).options(selectinload(Space.equipment)).where(Space.is_active.is_(True), Space.type == request.space_type, Space.capacity >= request.attendee_count)).scalars().all()
    equipment_ids = set(db.execute(select(Equipment.id)).scalars().all())
    required = set(request.required_equipment_ids)
    optional = set(request.optional_equipment_ids)
    if not required.issubset(equipment_ids) or not optional.issubset(equipment_ids):
        return []

    ranked: list[RecommendationRead] = []
    for space in spaces:
        conflict = db.execute(select(Booking.id).where(and_(Booking.space_id == space.id, Booking.status == BookingStatus.confirmed, Booking.start_time < request.end_time, Booking.end_time > request.start_time))).first()
        if conflict:
            continue
        space_equipment = {item.id for item in space.equipment}
        if not required.issubset(space_equipment):
            continue
        spare_capacity = space.capacity - request.attendee_count
        optional_matches = len(optional.intersection(space_equipment))
        score = 100.0 - spare_capacity * 4 + optional_matches * 8
        explanation = ["Available for the requested time", "Matches required type and capacity"]
        if required:
            explanation.append("Includes all required equipment")
        if request.preferred_zone and space.zone.lower() == request.preferred_zone.lower():
            score += 15
            explanation.append("Located in preferred zone")
        elif request.preferred_zone:
            score -= 5
            explanation.append("Outside preferred zone")
        if optional_matches:
            explanation.append(f"Matches {optional_matches} optional equipment item(s)")
        explanation.append("Exact capacity fit" if spare_capacity == 0 else "Smallest suitable capacity preferred")
        ranked.append(RecommendationRead(space=space, score=round(score, 2), explanation=explanation))
    return sorted(ranked, key=lambda item: item.score, reverse=True)
