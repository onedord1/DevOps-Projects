output "alb_logs_bucket_name" {
  description = "The name of the S3 bucket for ALB logs"
  value       = aws_s3_bucket.alb_logs.id
}

output "alb_logs_bucket_arn" {
  description = "The ARN of the S3 bucket for ALB logs"
  value       = aws_s3_bucket.alb_logs.arn
}