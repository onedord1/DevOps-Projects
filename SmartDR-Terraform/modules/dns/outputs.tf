output "domain_name" {
  description = "Domain name of the application"
  value       = var.domain_name
}

output "primary_health_check_id" {
  description = "ID of the primary health check"
  value       = aws_route53_health_check.primary.id
}

output "secondary_health_check_id" {
  description = "ID of the secondary health check"
  value       = aws_route53_health_check.secondary.id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for failover alerts"
  value       = aws_sns_topic.failover_alerts.arn
}