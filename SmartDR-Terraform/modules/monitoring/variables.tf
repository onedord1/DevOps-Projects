variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
}

variable "secondary_region" {
  description = "Secondary AWS region for DR"
  type        = string
}

variable "primary_alb_arn_suffix" {
  description = "ARN suffix of the primary ALB"
  type        = string
}

variable "secondary_alb_arn_suffix" {
  description = "ARN suffix of the secondary ALB"
  type        = string
}

variable "primary_db_cluster_id" {
  description = "ID of the primary database cluster"
  type        = string
}

variable "secondary_db_cluster_id" {
  description = "ID of the secondary database cluster"
  type        = string
}

variable "failover_alerts_sns_topic_arn" {
  description = "The ARN of the SNS topic for failover alerts"
  type        = string
}