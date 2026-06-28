output "state_bucket" {
  description = "Name of the S3 bucket holding remote state."
  value       = aws_s3_bucket.state.id
}

output "lock_table" {
  description = "Name of the DynamoDB lock table."
  value       = aws_dynamodb_table.lock.name
}

output "backend_config_hint" {
  description = "Values to plug into each environment's backend.hcl."
  value = {
    bucket         = aws_s3_bucket.state.id
    dynamodb_table = aws_dynamodb_table.lock.name
    region         = var.region
    encrypt        = true
  }
}
