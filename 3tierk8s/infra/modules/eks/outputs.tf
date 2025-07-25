output "cluster_endpoint"    { value = module.eks.cluster_endpoint }
output "cluster_security_group" { value = module.eks.cluster_security_group_id }
output "alb_arn"             { value = aws_lb.app.arn }
output "alb_dns_name"        { value = aws_lb.app.dns_name }

output "cluster_iam_role_arn" {
  value = module.eks.cluster_iam_role_arn
}

output "cluster_iam_role_name" {
  value = module.eks.cluster_iam_role_name
}
