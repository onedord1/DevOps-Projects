output "primary_alb_dns_name" {
  description = "DNS name of the primary ALB"
  value       = aws_lb.primary.dns_name
}

output "primary_alb_zone_id" {
  description = "Zone ID of the primary ALB"
  value       = aws_lb.primary.zone_id
}

output "primary_alb_arn_suffix" {
  description = "ARN suffix of the primary ALB"
  value       = aws_lb.primary.arn_suffix
}

output "secondary_alb_dns_name" {
  description = "DNS name of the secondary ALB"
  value       = aws_lb.secondary.dns_name
}

output "secondary_alb_zone_id" {
  description = "Zone ID of the secondary ALB"
  value       = aws_lb.secondary.zone_id
}

output "secondary_alb_arn_suffix" {
  description = "ARN suffix of the secondary ALB"
  value       = aws_lb.secondary.arn_suffix
}

output "primary_asg_name" {
  description = "Name of the primary Auto Scaling Group"
  value       = aws_autoscaling_group.primary.name
}

output "secondary_asg_name" {
  description = "Name of the secondary Auto Scaling Group"
  value       = aws_autoscaling_group.secondary.name
}

output "primary_web_security_group_id" {
  description = "Security group ID for primary web servers"
  value       = aws_security_group.web.id
}