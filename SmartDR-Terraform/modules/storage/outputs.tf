output "primary_bucket_name" {
  description = "Name of the primary S3 bucket"
  value       = aws_s3_bucket.primary.id
}

output "primary_bucket_arn" {
  description = "ARN of the primary S3 bucket"
  value       = aws_s3_bucket.primary.arn
}

output "secondary_bucket_name" {
  description = "Name of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.id
}

output "secondary_bucket_arn" {
  description = "ARN of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.arn
}