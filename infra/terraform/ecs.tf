resource "aws_ecs_cluster" "main" {
  name = local.cluster_name
  tags = local.common_tags
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  dynamic "default_capacity_provider_strategy" {
    for_each = local.ecs_use_fargate_spot ? [1] : []
    content {
      capacity_provider = "FARGATE_SPOT"
      weight            = 100
      base              = 0
    }
  }
}

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${local.backend_service_name}"
  retention_in_days = local.log_retention_days
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${local.frontend_service_name}"
  retention_in_days = local.log_retention_days
  tags              = local.common_tags
}

resource "aws_ecs_task_definition" "backend" {
  family                   = local.backend_service_name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = local.backend_cpu
  memory                   = local.backend_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${local.ecr_backend_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 8000
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "COOKIE_SECURE", value = tostring(var.cookie_secure) }
      ]
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_secretsmanager_secret.database_url.arn
        },
        {
          name      = "JWT_SECRET_KEY"
          valueFrom = aws_secretsmanager_secret.jwt_secret.arn
        },
        {
          name      = "CORS_ORIGINS"
          valueFrom = aws_secretsmanager_secret.cors_origins.arn
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8000/api/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = local.common_tags
}

resource "aws_ecs_task_definition" "frontend" {
  family                   = local.frontend_service_name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = local.frontend_cpu
  memory                   = local.frontend_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([
    {
      name      = "frontend"
      image     = "${local.ecr_frontend_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 80
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.frontend.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])

  tags = local.common_tags
}

resource "aws_ecs_service" "backend" {
  name            = local.backend_service_name
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = local.ecs_use_fargate_spot ? null : "FARGATE"

  dynamic "capacity_provider_strategy" {
    for_each = local.ecs_use_fargate_spot ? [1] : []
    content {
      capacity_provider = "FARGATE_SPOT"
      weight            = 100
      base              = 0
    }
  }

  enable_execute_command = var.ecs_enable_execute_command

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 8000
  }

  depends_on = [aws_lb_listener_rule.api]

  tags = local.common_tags
}

resource "aws_ecs_service" "frontend" {
  name            = local.frontend_service_name
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 1
  launch_type     = local.ecs_use_fargate_spot ? null : "FARGATE"

  dynamic "capacity_provider_strategy" {
    for_each = local.ecs_use_fargate_spot ? [1] : []
    content {
      capacity_provider = "FARGATE_SPOT"
      weight            = 100
      base              = 0
    }
  }

  # Exec only needed on backend (e.g. python -m app.seed); requires task_role_arn on task def
  enable_execute_command = false

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "frontend"
    container_port   = 80
  }

  depends_on = [aws_lb_listener.http]

  tags = local.common_tags
}
