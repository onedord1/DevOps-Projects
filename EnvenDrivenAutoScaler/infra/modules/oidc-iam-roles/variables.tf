variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "cluster_oidc_issuer_url" {
  description = "The OIDC issuer URL for the EKS cluster"
  type        = string
}

variable "cluster_oidc_provider_arn" {
  description = "The OIDC provider ARN for the EKS cluster"
  type        = string
}

variable "alb_controller_policy_arn" {
  description = "IAM policy ARN for the ALB Controller"
  type        = string
}

variable "velero_policy_arn" {
  description = "IAM policy ARN for Velero"
  type        = string
}

variable "github_actions_policy_arn" {
  description = "IAM policy ARN for GitHub Actions"
  type        = string
}

variable "github_actions_repo" {
  description = "GitHub repository in format 'owner/repo'"
  type        = string
  default     = ""
}