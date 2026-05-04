from sqlalchemy.orm import Session

from app.models import AuditLog


def log_audit(db: Session, actor_user_id: int | None, action: str, entity_type: str, entity_id: int | None = None, detail: str | None = None) -> AuditLog:
    entry = AuditLog(actor_user_id=actor_user_id, action=action, entity_type=entity_type, entity_id=entity_id, detail=detail)
    db.add(entry)
    return entry
