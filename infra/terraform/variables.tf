variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "eu-west-2"
}

variable "project_name" {
  description = "Short project name used in resource names"
  type        = string
  default     = "meetmi"
}

variable "environment" {
  description = "Environment label (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "meetmi"
}

variable "db_name" {
  description = "Initial PostgreSQL database name"
  type        = string
  default     = "meetmi"
}

variable "db_password" {
  description = "RDS password (leave null to auto-generate)"
  type        = string
  sensitive   = true
  default     = null
}

variable "cost_profile" {
  description = "demo = minimum Fargate/RDS/logging; standard = previous defaults"
  type        = string
  default     = "demo"

  validation {
    condition     = contains(["demo", "standard"], var.cost_profile)
    error_message = "cost_profile must be demo or standard"
  }
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = null
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GiB"
  type        = number
  default     = null
}

variable "db_backup_retention_days" {
  description = "RDS automated backup retention (0 = off, cheapest for demos)"
  type        = number
  default     = null
}

variable "log_retention_days" {
  description = "CloudWatch log retention for ECS"
  type        = number
  default     = null
}

variable "ecs_use_fargate_spot" {
  description = "Run ECS tasks on Fargate Spot (~70% cheaper; tasks can be interrupted)"
  type        = bool
  default     = null
}

variable "db_deletion_protection" {
  description = "Enable RDS deletion protection"
  type        = bool
  default     = false
}

variable "db_skip_final_snapshot" {
  description = "Skip final snapshot when destroying RDS (dev only)"
  type        = bool
  default     = true
}

variable "use_existing_ecr_repositories" {
  description = "Reference ECR repos already created (e.g. by GitHub Actions) instead of creating them"
  type        = bool
  default     = false
}

variable "create_github_oidc_provider" {
  description = "Create the account-wide GitHub OIDC provider (false if it already exists)"
  type        = bool
  default     = false
}

variable "enable_github_oidc" {
  description = "Create GitHub OIDC IAM role for deploy workflow"
  type        = bool
  default     = true
}

variable "github_repository" {
  description = "GitHub repo in OWNER/NAME form for OIDC trust (e.g. myorg/MeetMi)"
  type        = string
}

variable "github_oidc_branch" {
  description = "Git ref allowed to assume deploy role"
  type        = string
  default     = "refs/heads/main"
}

variable "cookie_secure" {
  description = "Set COOKIE_SECURE on backend (use true only with HTTPS)"
  type        = bool
  default     = false
}

variable "ecs_enable_execute_command" {
  description = "Enable ECS Exec on services (for seeding / debugging)"
  type        = bool
  default     = true
}

variable "backend_cpu" {
  type    = number
  default = null
}

variable "backend_memory" {
  type    = number
  default = null
}

variable "frontend_cpu" {
  type    = number
  default = null
}

variable "frontend_memory" {
  type    = number
  default = null
}
