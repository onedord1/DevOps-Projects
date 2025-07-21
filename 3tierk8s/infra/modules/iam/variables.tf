variable "env_prefix" {
  description = "Prefix for resource names (e.g., environment or project ID)"
  type        = string
}

variable "aws_region" {
  description = "AWS region to deploy resources into"
  type        = string
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}