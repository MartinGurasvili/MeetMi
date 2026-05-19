# MeetMi AWS infrastructure (Terraform)

One-time provisioning for **VPC**, **RDS PostgreSQL**, **ALB**, **ECS Fargate**, **ECR**, **Secrets Manager**, and optional **GitHub OIDC** for [deploy-aws.yml](../../.github/workflows/deploy-aws.yml).

After `terraform apply`, day-to-day deploys are only: push to `main` → CI builds images → `ecs update-service`. **RDS is not recreated.**

## Database (users & bookings)

Terraform **always** provisions **RDS PostgreSQL** in private subnets. The demo cost profile only turns off backup snapshots — it does **not** remove the database.

| Piece | What it does |
|-------|----------------|
| `aws_db_instance.main` | Persistent Postgres (`meetmi` database) |
| Secrets Manager `database-url` | `DATABASE_URL` injected into the backend task |
| Backend startup | Creates tables (`users`, `bookings`, `spaces`, …) via SQLAlchemy |
| Deploy seed | Runs migrations, then creates demo users, desks, rooms, and bookings (`alembic upgrade head && python -m app.seed`) |

User accounts and bookings survive ECS redeploys; only container images restart. New users can also register via `/api/auth/register`. Demo credentials are documented in [docs/DEMO_CREDENTIALS.md](../../docs/DEMO_CREDENTIALS.md).

After apply: `terraform output database`

## Prerequisites

- [Terraform](https://www.terraform.io/downloads) >= 1.5
- AWS CLI configured (`aws sts get-caller-identity`)
- IAM permissions to create VPC, RDS, ECS, ALB, ECR, Secrets Manager, IAM roles

## Quick start

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars: aws_region, github_repository (OWNER/MeetMi)

terraform init
terraform plan
terraform apply
```

Copy `terraform output github_configuration` into GitHub **Secrets** and **Variables**. Keep `VITE_API_URL=http://<alb-dns>/api` and `PUBLIC_APP_URL=http://<alb-dns>` set so the frontend is built against the public API and the deploy workflow can verify it.

## First boot (images + seed)

1. **Apply** creates empty ECR repos and ECS services. Tasks may stay **unhealthy** until images exist.
2. Run **Deploy to AWS** workflow once (or push to `main`) to push `meetmi-backend:latest` and `meetmi-frontend:latest`.
3. The workflow waits for the backend, runs `scripts/ecs-seed.sh`, and verifies `PUBLIC_APP_URL/api/health` plus demo login.
4. Manual seed is still available if needed:

```bash
CLUSTER=meetmi-cluster
SUBNET=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=meetmi-dev-public-1" --query 'Subnets[0].SubnetId' --output text)
SG=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=meetmi-dev-ecs" --query 'SecurityGroups[0].GroupId' --output text)

aws ecs run-task \
  --cluster "$CLUSTER" \
  --task-definition meetmi-backend \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET],securityGroups=[$SG],assignPublicIp=ENABLED}" \
  --overrides '{"containerOverrides":[{"name":"backend","command":["sh","-c","alembic upgrade head && python -m app.seed"]}]}'
```

Or use **ECS Exec** if `ecs_enable_execute_command = true`:

```bash
TASK_ARN=$(aws ecs list-tasks --cluster meetmi-cluster --service-name meetmi-backend --query 'taskArns[0]' --output text)
aws ecs execute-command --cluster meetmi-cluster --task "$TASK_ARN" --container backend --interactive --command "sh -c 'alembic upgrade head && python -m app.seed'"
```

5. Open `terraform output app_url`.

## Cost (demo)

Default `cost_profile = "demo"` keeps spend low:

| Setting | Demo | Notes |
|---------|------|--------|
| Fargate | 0.25 vCPU / 512 MB each | Minimum per task |
| Fargate Spot | On | ~70% less compute; rare interruptions |
| RDS PostgreSQL | `db.t4g.micro`, backups off | **Always on** — users & bookings persist across deploys |
| Logs | 1 day retention | |

**Fixed cost:** the Application Load Balancer is ~\$16–20/month even when idle — unavoidable for this HTTP URL setup.

To stop charges when not demoing: `terraform destroy` (or scale ECS desired count to 0 in the console; ALB + RDS still bill).

Set `cost_profile = "standard"` or override `backend_memory = 1024` if the backend OOMs.

## Networking

- **Public subnets:** ALB + ECS tasks (`assign_public_ip = true`) — no NAT gateway.
- **Private subnets:** RDS only.

## State

Local state file `terraform.tfstate` is gitignored. For teams, configure an S3 + DynamoDB backend in `versions.tf` later.

## Partial apply / existing AWS resources

If CI already created ECR repos or your account already has GitHub OIDC, set in `terraform.tfvars`:

```hcl
use_existing_ecr_repositories = true
create_github_oidc_provider   = false
```

If `meetmi-cluster` already exists (from a prior attempt), import it once:

```bash
terraform import aws_ecs_cluster.main meetmi-cluster
```

Then re-run `terraform apply`. RDS passwords are auto-generated without `/`, `@`, `"`, or spaces (AWS requirement).

## GitHub OIDC already exists?

Keep `create_github_oidc_provider = false` (default). Terraform looks up the existing provider by URL. Only set `create_github_oidc_provider = true` on a brand-new AWS account.

## HTTPS / custom domain

Not included in v1. Add ACM certificate and an HTTPS listener on the ALB when you have a domain.

## Destroy

Dev: set `db_skip_final_snapshot = true` before destroy. Production: enable `db_deletion_protection` and `db_prevent_destroy` in `terraform.tfvars`.

## Manual alternative

Console walkthrough: [docs/aws-ecs-console-setup.md](../../docs/aws-ecs-console-setup.md). JSON task defs in [../ecs/](../ecs/) are reference only; Terraform is the source of truth.
