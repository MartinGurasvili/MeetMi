from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas import RecommendationRead, RecommendationRequest
from app.services.recommendation_service import recommend_spaces

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.post("", response_model=list[RecommendationRead])
def recommendations(payload: RecommendationRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not payload.preferred_zone:
        payload.preferred_zone = current_user.preferred_zone
    return recommend_spaces(db, payload)
