variable "env_prefix" {
  description = "Prefix to use in naming (e.g., environment or cluster prefix)"
  type        = string
}

variable "eks_role_arn" {
  description = "ARN of the IAM role to attach EKS control plane policy"
  type        = string
}

variable "aws_region" {
  description = "AWS region (for consistency if needed in module)"
  type        = string
  default     = null
}

variable "eks_role_name" {
  type = string
  description = "Name of the EKS cluster control-plane IAM role"
}