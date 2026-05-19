#!/usr/bin/env bash
set -euo pipefail

CLUSTER="${AWS_ECS_CLUSTER:?AWS_ECS_CLUSTER is required}"
BACKEND_SERVICE="${AWS_ECS_SERVICE_BACKEND:?AWS_ECS_SERVICE_BACKEND is required}"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-eu-west-2}}"
PROJECT_NAME="${PROJECT_NAME:-meetmi}"
ENVIRONMENT="${ENVIRONMENT:-dev}"

echo "Waiting for backend service to stabilize before seeding..."
aws ecs wait services-stable --region "$REGION" --cluster "$CLUSTER" --services "$BACKEND_SERVICE"

TASK_DEFINITION="$(aws ecs describe-services \
  --region "$REGION" \
  --cluster "$CLUSTER" \
  --services "$BACKEND_SERVICE" \
  --query 'services[0].taskDefinition' \
  --output text)"

SUBNETS="$(aws ec2 describe-subnets \
  --region "$REGION" \
  --filters "Name=tag:Project,Values=${PROJECT_NAME}" "Name=tag:Environment,Values=${ENVIRONMENT}" "Name=tag:Tier,Values=public" \
  --query 'Subnets[].SubnetId' \
  --output text | tr '\t' ',')"

SECURITY_GROUP="$(aws ec2 describe-security-groups \
  --region "$REGION" \
  --filters "Name=group-name,Values=${PROJECT_NAME}-${ENVIRONMENT}-ecs" \
  --query 'SecurityGroups[0].GroupId' \
  --output text)"

if [ -z "$SUBNETS" ] || [ "$SUBNETS" = "None" ] || [ -z "$SECURITY_GROUP" ] || [ "$SECURITY_GROUP" = "None" ]; then
  echo "Could not resolve ECS seed network configuration" >&2
  exit 1
fi

echo "Running seed task from $TASK_DEFINITION..."
TASK_ARN="$(aws ecs run-task \
  --region "$REGION" \
  --cluster "$CLUSTER" \
  --task-definition "$TASK_DEFINITION" \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SECURITY_GROUP],assignPublicIp=ENABLED}" \
  --overrides '{"containerOverrides":[{"name":"backend","command":["sh","-c","alembic upgrade head && python -m app.seed"]}]}' \
  --query 'tasks[0].taskArn' \
  --output text)"

if [ -z "$TASK_ARN" ] || [ "$TASK_ARN" = "None" ]; then
  echo "Seed task did not start" >&2
  exit 1
fi

aws ecs wait tasks-stopped --region "$REGION" --cluster "$CLUSTER" --tasks "$TASK_ARN"

EXIT_CODE="$(aws ecs describe-tasks \
  --region "$REGION" \
  --cluster "$CLUSTER" \
  --tasks "$TASK_ARN" \
  --query 'tasks[0].containers[?name==`backend`].exitCode | [0]' \
  --output text)"

if [ "$EXIT_CODE" != "0" ]; then
  echo "Seed task failed with exit code $EXIT_CODE" >&2
  exit 1
fi

echo "Database seed completed."
