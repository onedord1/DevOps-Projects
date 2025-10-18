data "aws_caller_identity" "current" {}

# ALB Controller IAM role
resource "aws_iam_role" "alb_controller" {
  name = "${var.cluster_name}-alb-controller-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = var.cluster_oidc_provider_arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${replace(var.cluster_oidc_issuer_url, "https://", "")}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
          }
        }
      }
    ]
  })

  tags = {
    Name = "${var.cluster_name}-alb-controller-role"
  }
}

resource "aws_iam_role_policy_attachment" "alb_controller" {
  policy_arn = var.alb_controller_policy_arn
  role       = aws_iam_role.alb_controller.name
}

# Velero IAM role
resource "aws_iam_role" "velero" {
  name = "${var.cluster_name}-velero-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = var.cluster_oidc_provider_arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${replace(var.cluster_oidc_issuer_url, "https://", "")}:sub" = "system:serviceaccount:velero:velero"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "velero" {
  policy_arn = var.velero_policy_arn
  role       = aws_iam_role.velero.name
}

# GitHub Actions IAM role (if repo is specified)
resource "aws_iam_role" "github_actions" {
  count = var.github_actions_repo != "" ? 1 : 0
  
  name = "${var.cluster_name}-github-actions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_actions_repo}:*"
          }
        }
      }
    ]
  })

  tags = {
    Name = "${var.cluster_name}-github-actions-role"
  }
}

resource "aws_iam_role_policy_attachment" "github_actions" {
  count       = var.github_actions_repo != "" ? 1 : 0
  policy_arn  = var.github_actions_policy_arn
  role        = aws_iam_role.github_actions[0].name
}