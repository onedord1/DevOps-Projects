variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "alb_controller_role_arn" {
  description = "IAM role ARN for the ALB Controller"
  type        = string
}

variable "velero_role_arn" {
  description = "IAM role ARN for Velero"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "velero_backup_bucket_name" {
  description = "Name of the S3 bucket for Velero backups"
  type        = string
}