from app.models import Equipment
from app.schemas import RecommendationRequest
from app.services.recommendation_service import recommend_spaces


def test_recommendation_prefers_smallest_matching_capacity_and_zone(db_session, future_window):
    start, end = future_window
    monitor = db_session.query(Equipment).filter_by(name="monitor").one()
    req = RecommendationRequest(start_time=start, end_time=end, space_type="meeting_room", attendee_count=4, required_equipment_ids=[monitor.id], preferred_zone="North Zone")
    results = recommend_spaces(db_session, req)
    assert results
    assert results[0].space.name == "Room 1"
    assert any("preferred zone" in reason.lower() for reason in results[0].explanation)
