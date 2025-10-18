output "alb_controller_role_arn" {
  value = aws_iam_role.alb_controller.arn
}

output "velero_role_arn" {
  value = aws_iam_role.velero.arn
}

output "github_actions_role_arn" {
  value = var.github_actions_repo != "" ? aws_iam_role.github_actions[0].arn : ""
}