locals {
  cost_demo = {
    backend_cpu            = 256
    backend_memory         = 512
    frontend_cpu           = 256
    frontend_memory        = 512
    db_instance_class      = "db.t4g.micro"
    db_allocated_storage   = 20
    db_backup_retention    = 0
    log_retention_days     = 1
    ecs_use_fargate_spot   = true
  }

  cost_standard = {
    backend_cpu            = 512
    backend_memory         = 1024
    frontend_cpu           = 256
    frontend_memory        = 512
    db_instance_class      = "db.t4g.micro"
    db_allocated_storage   = 20
    db_backup_retention    = 7
    log_retention_days     = 14
    ecs_use_fargate_spot   = false
  }

  cost = var.cost_profile == "demo" ? local.cost_demo : local.cost_standard

  backend_cpu            = coalesce(var.backend_cpu, local.cost.backend_cpu)
  backend_memory         = coalesce(var.backend_memory, local.cost.backend_memory)
  frontend_cpu           = coalesce(var.frontend_cpu, local.cost.frontend_cpu)
  frontend_memory        = coalesce(var.frontend_memory, local.cost.frontend_memory)
  db_instance_class      = coalesce(var.db_instance_class, local.cost.db_instance_class)
  db_allocated_storage   = coalesce(var.db_allocated_storage, local.cost.db_allocated_storage)
  db_backup_retention    = coalesce(var.db_backup_retention_days, local.cost.db_backup_retention)
  log_retention_days     = coalesce(var.log_retention_days, local.cost.log_retention_days)
  ecs_use_fargate_spot   = coalesce(var.ecs_use_fargate_spot, local.cost.ecs_use_fargate_spot)

  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  cluster_name         = "${var.project_name}-cluster"
  backend_service_name = "${var.project_name}-backend"
  frontend_service_name = "${var.project_name}-frontend"
  backend_repo_name    = "${var.project_name}-backend"
  frontend_repo_name   = "${var.project_name}-frontend"

  secret_prefix = "${var.project_name}/${var.environment}"
}
