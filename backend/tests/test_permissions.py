import pytest
from fastapi import HTTPException

from app.models import User
from app.security.permissions import ensure_booking_owner_or_admin, require_admin_user


def test_user_cannot_edit_another_users_booking(db_session):
    user = db_session.query(User).filter_by(email="user@test.com").one()
    other = db_session.query(User).filter_by(email="other@test.com").one()
    with pytest.raises(HTTPException) as exc:
        ensure_booking_owner_or_admin(user, other.id)
    assert exc.value.status_code == 403


def test_admin_only_endpoints_require_admin(db_session):
    user = db_session.query(User).filter_by(email="user@test.com").one()
    with pytest.raises(HTTPException) as exc:
        require_admin_user(user)
    assert exc.value.status_code == 403


def test_admin_can_override_owner_check(db_session):
    admin = db_session.query(User).filter_by(email="admin@test.com").one()
    ensure_booking_owner_or_admin(admin, 999)
