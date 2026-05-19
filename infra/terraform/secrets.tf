resource "random_password" "jwt" {
  length  = 48
  special = true
}

resource "aws_secretsmanager_secret" "database_url" {
  name = "${local.secret_prefix}/database-url"
  tags = local.common_tags
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "${local.secret_prefix}/jwt-secret"
  tags = local.common_tags
}

resource "aws_secretsmanager_secret" "cors_origins" {
  name = "${local.secret_prefix}/cors-origins"
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id = aws_secretsmanager_secret.database_url.id
  secret_string = format(
    "postgresql+psycopg://%s:%s@%s:%s/%s",
    var.db_username,
    urlencode(local.db_password),
    aws_db_instance.main.address,
    aws_db_instance.main.port,
    var.db_name,
  )

  depends_on = [aws_db_instance.main]
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = random_password.jwt.result
}

# CORS origins use ALB URL; updated after ALB exists (see alb.tf / depends_on chain via ecs)
resource "aws_secretsmanager_secret_version" "cors_origins" {
  secret_id     = aws_secretsmanager_secret.cors_origins.id
  secret_string = "http://${aws_lb.main.dns_name}"

  depends_on = [aws_lb.main]
}
