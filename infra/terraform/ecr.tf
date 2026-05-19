data "aws_ecr_repository" "backend" {
  count = var.use_existing_ecr_repositories ? 1 : 0
  name  = local.backend_repo_name
}

data "aws_ecr_repository" "frontend" {
  count = var.use_existing_ecr_repositories ? 1 : 0
  name  = local.frontend_repo_name
}

resource "aws_ecr_repository" "backend" {
  count = var.use_existing_ecr_repositories ? 0 : 1

  name                 = local.backend_repo_name
  image_tag_mutability = "MUTABLE"
  force_delete         = var.environment == "dev"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.common_tags
}

resource "aws_ecr_repository" "frontend" {
  count = var.use_existing_ecr_repositories ? 0 : 1

  name                 = local.frontend_repo_name
  image_tag_mutability = "MUTABLE"
  force_delete         = var.environment == "dev"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.common_tags
}

data "aws_caller_identity" "current" {}

locals {
  ecr_backend  = var.use_existing_ecr_repositories ? data.aws_ecr_repository.backend[0] : aws_ecr_repository.backend[0]
  ecr_frontend = var.use_existing_ecr_repositories ? data.aws_ecr_repository.frontend[0] : aws_ecr_repository.frontend[0]

  ecr_backend_url  = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${local.ecr_backend.name}"
  ecr_frontend_url = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${local.ecr_frontend.name}"
}
