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

variable "primary_cluster_id" {
  description = "ID of the primary database cluster"
  type        = string
}

variable "secondary_cluster_id" {
  description = "ID of the secondary database cluster"
  type        = string
}

variable "primary_asg_name" {
  description = "Name of the primary Auto Scaling Group"
  type        = string
}

variable "secondary_asg_name" {
  description = "Name of the secondary Auto Scaling Group"
  type        = string
}

variable "primary_desired_size" {
  description = "Desired capacity for primary ASG"
  type        = number
}

variable "secondary_desired_size" {
  description = "Desired capacity for secondary ASG"
  type        = number
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for the domain"
  type        = string
}

variable "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  type        = string
}

variable "primary_vpc_id" {
  description = "ID of the primary VPC"
  type        = string
}

variable "primary_public_subnet_ids" {
  description = "IDs of the public subnets in primary region"
  type        = list(string)
}
