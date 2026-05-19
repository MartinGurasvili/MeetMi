resource "random_password" "db" {
  count   = var.db_password == null ? 1 : 0
  length  = 24
  special = true
  # RDS rejects / @ " and space in master passwords
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

locals {
  db_password = coalesce(var.db_password, try(random_password.db[0].result, ""))
}

resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-db"

  engine         = "postgres"
  engine_version = "16"
  instance_class = local.db_instance_class

  allocated_storage = local.db_allocated_storage
  storage_type      = "gp3"

  performance_insights_enabled = false
  monitoring_interval          = 0

  db_name  = var.db_name
  username = var.db_username
  password = local.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  multi_az               = false

  backup_retention_period = local.db_backup_retention
  skip_final_snapshot     = var.db_skip_final_snapshot
  final_snapshot_identifier = var.db_skip_final_snapshot ? null : "${local.name_prefix}-db-final"
  deletion_protection     = var.db_deletion_protection

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db"
  })
}
