output "primary_cluster_endpoint" {
  description = "Primary cluster endpoint"
  value       = aws_rds_cluster.primary.endpoint
}

output "primary_cluster_reader_endpoint" {
  description = "Primary cluster reader endpoint"
  value       = aws_rds_cluster.primary.reader_endpoint
}

output "primary_cluster_id" {
  description = "ID of the primary RDS cluster"
  value       = aws_rds_cluster.primary.id
}

output "secondary_cluster_endpoint" {
  description = "Secondary cluster endpoint (read-only until failover)"
  value       = aws_rds_cluster.secondary.endpoint
}

output "secondary_cluster_id" {
  description = "ID of the secondary RDS cluster"
  value       = aws_rds_cluster.secondary.id
}

output "db_credentials_secret_arn" {
  description = "ARN of the secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}
output "db_username" {
  description = "The master username for the RDS cluster."
  value       = aws_rds_cluster.primary.master_username
}

output "db_password" {
  description = "The master password for the RDS cluster."
  value       = random_password.password.result
  sensitive   = true
}