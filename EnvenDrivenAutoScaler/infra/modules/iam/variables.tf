variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  #default     = "sandbox-vpc-eks-test"
}

variable "cluster_oidc_issuer_url" {
  description = "The OIDC issuer URL for the EKS cluster"
  type        = string
  default     = ""
}