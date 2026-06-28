variable "name" {
  description = "EKS cluster name (typically <project>-<env>)."
  type        = string
}

variable "kubernetes_version" {
  description = "Kubernetes control-plane version."
  type        = string
  default     = "1.33"
}

variable "vpc_id" {
  description = "VPC the cluster is deployed into."
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for the cluster ENIs and nodes (private subnets)."
  type        = list(string)
}

variable "endpoint_public_access" {
  description = "Expose the Kubernetes API endpoint publicly. Prefer false in production."
  type        = bool
  default     = false
}

variable "enable_cluster_creator_admin_permissions" {
  description = "Grant the identity running Terraform cluster-admin via an access entry."
  type        = bool
  default     = true
}

variable "node_pools" {
  description = "EKS Auto Mode node pools to enable (e.g. general-purpose, system)."
  type        = list(string)
  default     = ["general-purpose", "system"]
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default     = {}
}
