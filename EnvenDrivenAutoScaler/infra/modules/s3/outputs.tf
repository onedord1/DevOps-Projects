output "velero_backup_bucket_name" {
  value = module.velero_backup_bucket.s3_bucket_id
}

output "velero_backup_bucket_arn" {
  value = module.velero_backup_bucket.s3_bucket_arn
}

output "alb_logs_bucket_name" {
  value = module.alb_logs_bucket.s3_bucket_id
}

output "alb_logs_bucket_arn" {
  value = module.alb_logs_bucket.s3_bucket_arn
}