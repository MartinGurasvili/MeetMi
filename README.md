# MeetMi

![MeetMi app icon](docs/assets/meetmi-icon.png)

MeetMi is a secure AI-assisted office space booking platform for hot desks and meeting rooms. It combines a FastAPI backend, SQLAlchemy 2.0 data model, React/TypeScript frontend, interactive dark-mode floor plan, recommendation engine, audit logging, tests, Docker, and AWS-ready deployment guidance.

## Features

- Register, login, refresh, and logout with JWT access tokens and HttpOnly refresh cookies.
- Browse floors, spaces, and equipment from an Apple Maps-inspired dark UI.
- Filter by date, time, type, capacity, zone, and required equipment.
- Book hot desks or meeting rooms with overlap conflict prevention.
- View, edit, and cancel own bookings through protected APIs.
- Admin APIs for floors, equipment, spaces, all bookings, audit logs, and generated image prompts.
- Recommendation service ranks active, available spaces by capacity fit, zone preference, and optional equipment.
- GenAI prompt service generates image prompts without calling paid APIs; AWS Bedrock/S3 integration is documented as a future hook.

## Tech Stack

- Backend: Python, FastAPI, SQLAlchemy 2.0, Pydantic, Alembic, Pytest.
- Frontend: React, TypeScript, Vite, Tailwind CSS, Vitest, React Testing Library.
- Data: SQLite for local quick start, PostgreSQL for production and Docker compose.
- Deployment: Docker, GitHub Actions, AWS App Runner/ECS Fargate-ready.

## Project Structure

```text
backend/app
  routers/        Auth, spaces, bookings, recommendations, admin APIs
  services/       Booking, recommendation, audit, image prompt logic
  security/       Password hashing and permission helpers
  models.py       SQLAlchemy entities
  schemas.py      Pydantic request/response validation
frontend/src
  components/     Floor plan, markers, filters, panels, booking modal
  pages/          Login, dashboard, bookings, admin preview
  api/            Credential-aware API client
```

## Local Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m app.seed
uvicorn app.main:app --reload
```

API docs are available at `http://localhost:8000/docs`.

Seeded users:

- Admin: `admin@meetmi.local` / `AdminPass123`
- User: `user@meetmi.local` / `UserPass123`

## Local Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend runs at `http://localhost:5173`.

## Docker Setup

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

## Environment Variables

Backend:

- `DATABASE_URL`: SQLite or PostgreSQL URL.
- `JWT_SECRET_KEY`: long random secret for signing tokens.
- `JWT_ALGORITHM`: defaults to `HS256`.
- `ACCESS_TOKEN_EXPIRE_MINUTES`: short token lifetime.
- `REFRESH_TOKEN_EXPIRE_DAYS`: refresh cookie lifetime.
- `CORS_ORIGINS`: comma-separated allowed origins.
- `COOKIE_SECURE`: `true` in production HTTPS.

Frontend:

- `VITE_API_URL`: backend API base URL.

## Database Migration

Alembic is configured in `backend/alembic`. For local demo simplicity, the FastAPI app creates tables on startup. For production, run migrations explicitly:

```bash
cd backend
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Security Protections

- SQL injection: all database access uses SQLAlchemy ORM/parameterized expressions.
- XSS: React escapes text by default; the app avoids `dangerouslySetInnerHTML`.
- Auth security: access tokens are short-lived and kept in memory; refresh tokens are HttpOnly, SameSite cookies.
- Broken access control and IDOR: user booking routes enforce owner-or-admin checks; admin APIs require the admin role.
- Input validation: Pydantic validates emails, string sizes, times, attendee counts, coordinates, equipment IDs, and booking ranges.
- Double booking: booking creation checks `existing.start_time < requested_end_time AND existing.end_time > requested_start_time` inside the write transaction and uses `FOR UPDATE` where supported.
- Audit logging: booking creation/cancellation, admin changes, login failures, and failed permission attempts are recorded.

## OWASP Risks Mitigated

- A01 Broken Access Control: role dependencies and object ownership checks.
- A03 Injection: ORM-only query patterns.
- A05 Security Misconfiguration: env-driven secrets, Docker isolation, CI tests.
- A07 Identification and Authentication Failures: hashed passwords, JWT expiry, HttpOnly refresh cookies.
- A09 Security Logging and Monitoring Failures: `AuditLog` model and audit service.

## Testing

Backend:

```bash
cd backend
pytest
```

Frontend:

```bash
cd frontend
npm test
```

Coverage focuses on booking conflicts, race-condition-safe overlap logic, recommendations, permissions, invalid input rejection, floor plan rendering, booking modal interaction, and recommendation display.

## AWS Deployment Path

Recommended production path:

1. Build backend and frontend Docker images in CI.
2. Push images to Amazon ECR.
3. Run backend on AWS App Runner or ECS Fargate.
4. Serve frontend through S3 + CloudFront or an Nginx container on App Runner.
5. Use Amazon RDS PostgreSQL for `DATABASE_URL`.
6. Store `JWT_SECRET_KEY`, database password, and other secrets in AWS Secrets Manager.
7. Store generated or manually uploaded space preview images in S3; save their HTTPS URL in `Space.image_url`.
8. Add AWS Bedrock image generation in `image_prompt_service.py` when paid generation is approved.

### GitHub Actions → Amazon ECR

The workflow [.github/workflows/deploy-aws.yml](.github/workflows/deploy-aws.yml) runs on every push to `main` (and can be run manually via **Actions → Deploy to AWS (ECR) → Run workflow**).

**One-time AWS setup**

1. Create two ECR repositories: `meetmi-backend` and `meetmi-frontend` (same region you will use in GitHub).
2. Enable **OIDC** for GitHub: add an IAM identity provider for `token.actions.githubusercontent.com` (audience `sts.amazonaws.com`) if you do not already have it.
3. Create an IAM role (e.g. `github-meetmi-deploy`) with:
   - Trust policy allowing `sts:AssumeRoleWithWebIdentity` for your repo, e.g. `repo:YOUR_ORG/MeetMi:ref:refs/heads/main` (use your org/user and repo name).
   - Permissions to `ecr:GetAuthorizationToken`, and on both repositories `ecr:BatchCheckLayerAvailability`, `ecr:CompleteLayerUpload`, `ecr:InitiateLayerUpload`, `ecr:PutImage`, `ecr:UploadLayerPart`, plus `ecs:UpdateService` / `ecs:DescribeServices` if you use the optional ECS step.
4. Optional: ECS cluster and services for backend/frontend; set repository **Variables** `AWS_ECS_CLUSTER`, `AWS_ECS_SERVICE_BACKEND`, `AWS_ECS_SERVICE_FRONTEND` so the workflow can call `update-service --force-new-deployment` after each push.

**One-time GitHub setup**

| Type | Name | Example / notes |
|------|------|------------------|
| Secret | `AWS_REGION` | `eu-west-1` |
| Secret | `AWS_ROLE_TO_ASSUME` | IAM role ARN from step 3 |
| Variable | `VITE_API_URL` | `https://api.yourdomain.com/api` (must match your deployed API URL; baked into the frontend at build time) |
| Variable (optional) | `AWS_ECS_CLUSTER` | ECS cluster name |
| Variable (optional) | `AWS_ECS_SERVICE_BACKEND` | Backend ECS service name |
| Variable (optional) | `AWS_ECS_SERVICE_FRONTEND` | Frontend ECS service name |

If you cannot use OIDC, replace the “Configure AWS credentials” step in the workflow with access-key based authentication (not recommended for long-lived keys); see [aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials).

**After images are in ECR**, point App Runner, ECS task definitions, or Kubernetes manifests at `.../meetmi-backend:latest` and `.../meetmi-frontend:latest` (or the short SHA tag printed in the job). Configure the backend service with `DATABASE_URL`, `JWT_SECRET_KEY`, `CORS_ORIGINS` (your CloudFront or site URL), and `COOKIE_SECURE=true`.

## DevOps Pipeline

GitHub Actions [.github/workflows/ci.yml](.github/workflows/ci.yml) runs on pull requests and pushes to `main`: backend `pytest`, then frontend `npm install`, `npm run build`, and Vitest.

Deploy: [.github/workflows/deploy-aws.yml](.github/workflows/deploy-aws.yml) pushes Docker images to ECR on each push to `main` once the secrets and variables above are configured.
