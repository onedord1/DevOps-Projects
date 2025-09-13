# VPC outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

# Security Group outputs
output "eks_security_group_id" {
  description = "The ID of the EKS security group"
  value       = module.security_group.eks_security_group_id
}

output "rds_security_group_id" {
  description = "The ID of the RDS security group"
  value       = module.security_group.rds_security_group_id
}

# IAM outputs
output "eks_cluster_role_arn" {
  description = "The ARN of the EKS cluster IAM role"
  value       = module.iam.eks_cluster_role_arn
}

output "eks_node_role_arn" {
  description = "The ARN of the EKS node IAM role"
  value       = module.iam.eks_node_role_arn
}

# EKS outputs
output "cluster_name" {
  description = "The name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "The endpoint of the EKS cluster"
  value       = module.eks.cluster_endpoint
}

output "cluster_certificate_authority_data" {
  description = "The certificate authority data of the EKS cluster"
  value       = module.eks.cluster_certificate_authority_data
}

output "kubeconfig" {
  description = "Kubeconfig file for the EKS cluster"
  value       = module.eks.kubeconfig
}

# RDS outputs
output "rds_instance_endpoint" {
  description = "The endpoint of the RDS instance"
  value       = module.rds.rds_instance_endpoint
}

output "rds_instance_id" {
  description = "The ID of the RDS instance"
  value       = module.rds.rds_instance_id
}

# ALB outputs
output "alb_arn" {
  description = "The ARN of the Application Load Balancer"
  value       = module.alb.alb_arn
}

output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "The zone ID of the Application Load Balancer"
  value       = module.alb.alb_zone_id
}

output "target_group_arn" {
  description = "The ARN of the Target Group"
  value       = module.alb.target_group_arn
}

output "target_group_name" {
  description = "The name of the Target Group"
  value       = module.alb.target_group_name
}

output "alb_security_group_id" {
  description = "The ID of the ALB security group"
  value       = module.security_group.alb_security_group_id
}

output "alb_logs_bucket_name" {
  description = "The name of the S3 bucket for ALB logs"
  value       = module.s3.alb_logs_bucket_name
}

output "waf_acl_arn" {
  description = "The ARN of the WAF WebACL"
  value       = module.waf.waf_acl_arn
}

output "waf_acl_id" {
  description = "The ID of the WAF WebACL"
  value       = module.waf.waf_acl_id
}

output "waf_acl_name" {
  description = "The name of the WAF WebACL"
  value       = module.waf.waf_acl_name
}

output "waf_sns_topic_arn" {
  description = "The ARN of the SNS topic for WAF alerts"
  value       = module.waf.sns_topic_arn
}

output "waf_cloudwatch_alarm_arn" {
  description = "The ARN of the CloudWatch alarm for WAF rate limiting"
  value       = module.waf.cloudwatch_alarm_arn
}