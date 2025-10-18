# output "aws_iam_role" {
#   value = aws_iam_role.cluster.arn
# }

output "cluster_role_arn" {
  value = aws_iam_role.cluster.arn
}

output "node_role_arn" {
  value = aws_iam_role.node.arn
}

output "alb_controller_policy_arn" {
  value = aws_iam_policy.alb_controller.arn
}

output "velero_policy_arn" {
  value = aws_iam_policy.velero.arn
}

output "github_actions_policy_arn" {
  value = aws_iam_policy.github_actions.arn
}

output "account_id" {
  value = data.aws_caller_identity.current.account_id
}