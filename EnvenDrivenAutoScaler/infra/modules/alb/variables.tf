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