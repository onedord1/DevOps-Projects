output "alb_controller_helm_release" {
  value = helm_release.alb_controller.name
}

output "keda_helm_release" {
  value = helm_release.keda.name
}

output "velero_helm_release" {
  value = helm_release.velero.name
}

output "velero_iam_role_arn" {
  value = aws_iam_role.velero.arn
}