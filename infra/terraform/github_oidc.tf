data "aws_iam_openid_connect_provider" "github" {
  count = var.enable_github_oidc && !var.create_github_oidc_provider ? 1 : 0
  url   = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_openid_connect_provider" "github" {
  count = var.enable_github_oidc && var.create_github_oidc_provider ? 1 : 0

  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

locals {
  github_oidc_arn = var.enable_github_oidc ? (
    var.create_github_oidc_provider ?
    aws_iam_openid_connect_provider.github[0].arn :
    data.aws_iam_openid_connect_provider.github[0].arn
  ) : null
}

data "aws_iam_policy_document" "github_assume" {
  count = var.enable_github_oidc ? 1 : 0

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [local.github_oidc_arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:ref:${var.github_oidc_branch}"]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  count = var.enable_github_oidc ? 1 : 0

  name               = "${local.name_prefix}-github-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_assume[0].json
  tags               = local.common_tags
}

data "aws_iam_policy_document" "github_deploy" {
  count = var.enable_github_oidc ? 1 : 0

  statement {
    sid = "ECRAuth"
    actions = [
      "ecr:GetAuthorizationToken",
    ]
    resources = ["*"]
  }

  statement {
    sid = "ECRPush"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:DescribeRepositories",
      "ecr:CreateRepository",
    ]
    resources = [
      local.ecr_backend.arn,
      local.ecr_frontend.arn,
    ]
  }

  statement {
    sid = "ECSDeploy"
    actions = [
      "ecs:UpdateService",
      "ecs:DescribeServices",
    ]
    resources = [
      aws_ecs_service.backend.id,
      aws_ecs_service.frontend.id,
    ]
  }

  statement {
    sid = "ECSClusterDescribe"
    actions = [
      "ecs:DescribeClusters",
    ]
    resources = [aws_ecs_cluster.main.arn]
  }

  statement {
    sid = "ECSSeedTask"
    actions = [
      "ecs:RunTask",
    ]
    resources = [aws_ecs_task_definition.backend.arn]
  }

  statement {
    sid = "ECSSeedTaskDescribe"
    actions = [
      "ecs:DescribeTasks",
    ]
    resources = ["*"]
  }

  statement {
    sid = "SeedNetworkLookup"
    actions = [
      "ec2:DescribeSecurityGroups",
      "ec2:DescribeSubnets",
    ]
    resources = ["*"]
  }

  statement {
    sid = "PassSeedRoles"
    actions = [
      "iam:PassRole",
    ]
    resources = [
      aws_iam_role.ecs_execution.arn,
      aws_iam_role.ecs_task.arn,
    ]
  }
}

resource "aws_iam_role_policy" "github_deploy" {
  count = var.enable_github_oidc ? 1 : 0

  name   = "${local.name_prefix}-github-deploy"
  role   = aws_iam_role.github_deploy[0].id
  policy = data.aws_iam_policy_document.github_deploy[0].json
}
