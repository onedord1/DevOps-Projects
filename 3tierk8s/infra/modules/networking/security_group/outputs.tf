output "eks_security_group_id" {
  description = "The ID of the EKS security group"
  value       = aws_security_group.eks.id
}

output "rds_security_group_id" {
  description = "The ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "alb_security_group_id" {
  description = "The ID of the ALB security group"
  value       = aws_security_group.alb.id
}