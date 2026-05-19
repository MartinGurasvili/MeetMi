output "app_url" {
  description = "Public app URL (frontend via ALB)"
  value       = "http://${aws_lb.main.dns_name}"
}

output "api_url" {
  description = "Public API base URL"
  value       = "http://${aws_lb.main.dns_name}/api"
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_backend" {
  value = aws_ecs_service.backend.name
}

output "ecs_service_frontend" {
  value = aws_ecs_service.frontend.name
}

output "ecr_backend_repository" {
  value = local.ecr_backend.repository_url
}

output "ecr_frontend_repository" {
  value = local.ecr_frontend.repository_url
}

output "rds_endpoint" {
  description = "RDS hostname (sensitive; use Secrets Manager in apps)"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "database" {
  description = "Persistent PostgreSQL for users, bookings, spaces (credentials in Secrets Manager)"
  value = {
    engine     = aws_db_instance.main.engine
    version    = aws_db_instance.main.engine_version
    identifier = aws_db_instance.main.identifier
    database   = var.db_name
    tables     = "users, bookings, spaces, office_floors, equipment, audit_logs (created on backend startup)"
    secret     = aws_secretsmanager_secret.database_url.name
    seed_once  = "aws ecs run-task ... command python -m app.seed (see infra/terraform/README.md)"
  }
}

output "github_deploy_role_arn" {
  description = "IAM role ARN for GitHub Actions OIDC (AWS_ROLE_TO_ASSUME secret)"
  value       = var.enable_github_oidc ? aws_iam_role.github_deploy[0].arn : null
}

output "github_configuration" {
  description = "Copy into GitHub repository Secrets and Variables"
  value       = <<-EOT

    === GitHub Secrets ===
    AWS_REGION          = ${var.aws_region}
    AWS_ROLE_TO_ASSUME  = ${var.enable_github_oidc ? aws_iam_role.github_deploy[0].arn : "(enable_github_oidc or set role manually)"}

    === GitHub Variables ===
    AWS_ECS_CLUSTER           = ${aws_ecs_cluster.main.name}
    AWS_ECS_SERVICE_BACKEND   = ${aws_ecs_service.backend.name}
    AWS_ECS_SERVICE_FRONTEND  = ${aws_ecs_service.frontend.name}
    VITE_API_URL              = http://${aws_lb.main.dns_name}/api
    PUBLIC_APP_URL            = http://${aws_lb.main.dns_name}

  EOT
}
