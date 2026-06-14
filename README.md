
<h1 align="center">MeetMi</h1>

<div align="center">

<img width="200" height="200" alt="cas" src="docs/assets/meetmi-icon.png">
</div>


**Book the right desk or meeting room in seconds.**

MeetMi is an office space booking platform with interactive floor plans, smart recommendations, and admin tooling. Explore Manchester and London offices on a pan/zoom map, filter by time and equipment, and book with conflict-safe scheduling.

| | |
|---|---|
| **Live demo** | http://meetmi-dev-alb-1718430491.eu-west-2.elb.amazonaws.com |
| **User login** | `user@meetmi.example.com` / `UserPass123` |
| **Admin login** | `admin@meetmi.example.com` / `AdminPass123` |

Full credential list: [docs/DEMO_CREDENTIALS.md](docs/DEMO_CREDENTIALS.md)

## Features

- **Interactive floor plan** — Apple Maps–style dark UI with pan/zoom, colour-coded availability, and inline space details.
- **Hot desk booking** — All-day desk reservations with one booking per person per day.
- **Meeting room slots** — Vertical 30-minute timeline in the side panel; pick a free window and book.
- **ICS invite recommender** — Drag an `.ics` calendar file into the Recommendations panel to auto-fill time, attendees, and surface matching rooms.
- **Smart recommendations** — Ranks spaces by capacity fit, zone preference, equipment, and availability.
- **Admin console** — Manage all bookings, register floors, and place desks/rooms on floor-plan images.
- **Secure by design** — JWT + HttpOnly refresh cookies, RBAC, overlap detection, audit logging.



## Architecture

```text
┌─────────────────┐     HTTP /api       ┌──────────────────┐
│  React (Vite)   │ ◄────────────────► │  FastAPI         │
│  Floor plan UI  │   JWT + cookies    │  SQLAlchemy 2.0  │
└────────┬────────┘                    └────────┬─────────┘
         │                                    │
         │  floorLayouts/*.json               │  PostgreSQL / SQLite
         ▼                                    ▼
   Space markers                      Bookings, users, audit
```

| Layer | Location | Notes |
|--------|-----------|--------|
| API | `backend/app/routers/` | Auth, spaces, bookings, recommendations, admin |
| Domain | `backend/app/services/` | Booking conflicts, recommendations, audit |
| UI | `frontend/src/components/` | FloorPlan, markers, filters, timeline, ICS parser |
| Layout data | `frontend/src/data/floorLayouts/` | Versioned JSON wired via `floorMeta` |
| Infra | `infra/terraform/` | VPC, RDS, ECS Fargate, ALB, ECR |

## Tech stack

| Area | Technologies |
|------|-------------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic, Alembic, Pytest |
| Frontend | React, TypeScript, Vite, Tailwind CSS, Vitest, Playwright |
| Data | SQLite (local), PostgreSQL (Docker / AWS RDS) |
| Ops | Docker Compose, GitHub Actions, Terraform, AWS ECS Fargate |

## Getting started

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
PYTHONPATH=. python -m app.seed
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

### Docker (full stack)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000/api |
| PostgreSQL | localhost:5432 |

## Testing

```bash
cd backend && PYTHONPATH=. pytest
cd frontend && npm test
cd frontend && npm run test:e2e
```

CI (`.github/workflows/ci.yml`) runs backend unit tests, frontend Vitest, and Playwright E2E on every push to `main`.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy-aws.yml`:

1. Build and push `meetmi-backend` / `meetmi-frontend` images to Amazon ECR (linux/amd64).
2. Force-new-deploy both ECS Fargate services on cluster `meetmi-cluster`.
3. Seed the RDS database (`python -m app.seed`) with demo users, layout-matched spaces, desk bookings, and meeting-room time slots.
4. Verify `/api/health` and demo login.

First-time AWS setup: [infra/terraform/README.md](infra/terraform/README.md)

## Security

- Parameterized ORM queries, Pydantic validation, role-based admin routes, booking ownership checks.
- Access tokens in memory; refresh tokens in HttpOnly cookies.
- Transactional overlap detection on every booking write.
- Audit log for sensitive actions and auth failures.

See [docs/Task2-Secure-Application.md](docs/Task2-Secure-Application.md) for the full secure-development write-up.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/DEMO_CREDENTIALS.md](docs/DEMO_CREDENTIALS.md) | Demo user accounts |
| [docs/Task2-Secure-Application.md](docs/Task2-Secure-Application.md) | Secure application development |
| [docs/Task3-Supporting-Artefacts.md](docs/Task3-Supporting-Artefacts.md) | DevOps artefacts and CI/CD pipeline |
| [infra/terraform/README.md](infra/terraform/README.md) | AWS infrastructure setup |
