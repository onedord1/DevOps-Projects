variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "rds_endpoint" {
  description = "RDS instance endpoint"
  type        = string
}

variable "rds_port" {
  description = "RDS instance port"
  type        = string
  default     = "5432"
}

variable "rds_username" {
  description = "RDS username"
  type        = string
}

variable "rds_password" {
  description = "RDS password"
  type        = string
  sensitive   = true
}

variable "rds_database" {
  description = "RDS database name"
  type        = string
}

variable "alb_logs_bucket_name" {
  description = "Name of the S3 bucket for ALB logs"
  type        = string
}

variable "backend_image_name" {
  description = "The Docker image name for the backend application."
  type        = string
}

variable "backend_image_tag" {
  description = "The Docker image tag for the backend application."
  type        = string
}

variable "frontend_image_name" {
  description = "The Docker image name for the frontend application."
  type        = string
}

variable "frontend_image_tag" {
  description = "The Docker image tag for the frontend application."
  type        = string
}