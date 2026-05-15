# MeetMi

![MeetMi app icon](docs/assets/meetmi-icon.png)

MeetMi is an office space booking platform for **hot desks** and **meeting rooms**. Employees explore an interactive floor plan, filter by time and requirements, and book spaces with conflict-safe scheduling. An admin surface manages floors, equipment, and bookings; a recommendation engine suggests suitable spaces from availability and preferences.

## What it does

- **Dashboard** — Apple Maps–style dark UI with pan/zoom floor plans, office picker, filters, and inline space details.
- **Floor plans** — Built-in SVG layouts for demo offices, or **imported layouts** from JSON (uploaded image + normalized desk/room positions). A dev-only editor at `/dev/floor-editor` exports layout files consumed by the app.
- **Booking** — JWT auth with short-lived access tokens and HttpOnly refresh cookies; overlap checks prevent double bookings.
- **Recommendations** — Ranks spaces by capacity, zone, equipment, and availability for the selected slot.
- **Admin** — Floors, spaces, equipment, bookings, audit logs, and image-prompt helpers (GenAI hooks without paid API calls in the default path).

## Architecture

```text
┌─────────────────┐     HTTPS /api      ┌──────────────────┐
│  React (Vite)   │ ◄────────────────► │  FastAPI         │
│  Floor plan UI  │   JWT + cookies    │  SQLAlchemy 2.0  │
└────────┬────────┘                    └────────┬─────────┘
         │                                    │
         │  floorLayouts/*.json               │  PostgreSQL / SQLite
         │  (geometry + background)           │
         ▼                                    ▼
   Space markers                      Bookings, users, audit
   matched by layoutLocalId
```

| Layer | Location | Notes |
|--------|-----------|--------|
| API | `backend/app/routers/` | Auth, spaces, bookings, recommendations, admin |
| Domain | `backend/app/services/` | Booking conflicts, recommendations, audit |
| UI | `frontend/src/components/` | `FloorPlan`, markers, filters, booking modal |
| Layout data | `frontend/src/data/floorLayouts/` | Versioned JSON; `floorMeta` wires floors into demo/registry |
| Layout tool | `frontend/src/pages/FloorPlanEditorPage.tsx` | Dev only (`import.meta.env.DEV`) |

## Tech stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic, Alembic, Pytest  
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Vitest  
- **Data:** SQLite (local), PostgreSQL (Docker / production)  
- **Ops:** Docker Compose, GitHub Actions (CI + ECR image publish)

## Repository layout

```text
backend/
  app/routers/     HTTP routes
  app/services/    Business logic
  app/models.py    Entities
  alembic/         Migrations
frontend/
  src/components/  Floor plan, booking UI
  src/pages/       Dashboard, login, bookings, admin
  src/data/        Demo seed data + floor layout JSON
  public/floorplans/  Static floor images (optional)
.github/workflows/ ci.yml, deploy-aws.yml
```

## Getting started

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m app.seed
uvicorn app.main:app --reload
```

OpenAPI docs: `http://localhost:8000/docs`

**Demo accounts:** `admin@meetmi.local` / `AdminPass123` · `user@meetmi.local` / `UserPass123`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App: `http://localhost:5173` · Dev floor editor: `http://localhost:5173/dev/floor-editor`

### Docker (full stack)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 |
| PostgreSQL | localhost:5432 |

## Configuration

**Backend** (`backend/.env`): `DATABASE_URL`, `JWT_SECRET_KEY`, `CORS_ORIGINS`, `COOKIE_SECURE`, token expiry settings — see `backend/.env.example`.

**Frontend** (`frontend/.env`): `VITE_API_URL` — API base URL (e.g. `http://localhost:8000/api`).

**Floor layouts:** Drop a `meetmi-floor-layout-v1` JSON under `frontend/src/data/floorLayouts/` with `floorMeta` and `placements`; spaces are generated in demo data when `floorMeta.id` matches. Placement `localId` maps to `Space.layoutLocalId` for drawing on the image.

**Production DB:** Tables are created on startup for local demos; use Alembic for controlled schema changes:

```bash
cd backend && alembic upgrade head
```

## Security model

- Parameterized ORM access, Pydantic validation at API boundaries, role-based admin routes, booking ownership checks.
- Access tokens in memory; refresh tokens in HttpOnly cookies.
- Booking writes use transactional overlap detection (`start < other.end AND end > other.start`).
- Sensitive actions and auth failures are written to `AuditLog`.

## Testing

```bash
cd backend && pytest
cd frontend && npm test
```

CI (`.github/workflows/ci.yml`) runs both suites on pull requests and `main`.

## Deployment

Container images are built from `backend/Dockerfile` and `frontend/Dockerfile`. Pushes to `main` trigger `.github/workflows/deploy-aws.yml`, which publishes `meetmi-backend` and `meetmi-frontend` to Amazon ECR (repositories are created automatically when the IAM role allows it).

Typical AWS layout: ECR images → App Runner or ECS Fargate, RDS PostgreSQL, Secrets Manager for `JWT_SECRET_KEY` and database credentials, optional S3/CloudFront for static assets. Configure runtime env on the backend service (`DATABASE_URL`, `CORS_ORIGINS`, `COOKIE_SECURE=true`).

**CI variables (optional):** If you do not have a public API URL yet, leave `VITE_API_URL` unset — the deploy workflow builds the frontend with `/api` (for same-origin reverse proxy). Set `VITE_API_URL` to your App Runner or API URL (e.g. `https://abc123.eu-west-2.awsapprunner.com/api`) when ready and redeploy. Set `SKIP_FRONTEND_DEPLOY=true` to push only the backend image. See `deploy-aws.yml` for secrets (`AWS_REGION`, `AWS_ROLE_TO_ASSUME`).
