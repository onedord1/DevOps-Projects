output "primary_alb_dns_name" {
  description = "DNS name of the primary ALB"
  value       = module.compute.primary_alb_dns_name
}

output "secondary_alb_dns_name" {
  description = "DNS name of the secondary ALB"
  value       = module.compute.secondary_alb_dns_name
}

output "primary_bucket_name" {
  description = "Name of the primary S3 bucket"
  value       = module.storage.primary_bucket_name
}

output "secondary_bucket_name" {
  description = "Name of the secondary S3 bucket"
  value       = module.storage.secondary_bucket_name
}

output "primary_cluster_endpoint" {
  description = "Primary cluster endpoint"
  value       = module.database.primary_cluster_endpoint
}

output "db_credentials_secret_arn" {
  description = "ARN of the secret containing database credentials"
  value       = module.database.db_credentials_secret_arn
}

output "domain_name" {
  description = "Domain name of the application"
  value       = module.dns.domain_name
}

output "dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = module.monitoring.dashboard_url
}

output "failover_api_url" {
  description = "URL of the failover API"
  value       = module.automation.failover_api_url
}

output "failback_api_url" {
  description = "URL of the failback API"
  value       = module.automation.failback_api_url
}

output "failover_control_url" {
  description = "URL of the failover control endpoint"
  value       = module.automation.failover_control_url
}