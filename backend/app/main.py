from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine
from app.routers import admin, auth, bookings, recommendations, spaces

settings = get_settings()
app = FastAPI(title=settings.project_name, version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router, prefix="/api")
app.include_router(spaces.router, prefix="/api")
app.include_router(bookings.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.on_event("startup")
def startup() -> None:
    # Alembic should run production migrations; auto-create keeps local demos easy.
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.project_name}
