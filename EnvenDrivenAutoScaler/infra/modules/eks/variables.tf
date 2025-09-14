variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  #default     = "sandbox-vpc-eks-test"
}

variable "cluster_version" {
  description = "EKS cluster kubernetes version"
  type        = string
  #default     = "1.32"
}

variable "eks_auto_node_pool" {
  description = "EKS Auto Mode Cluster Node Pool list"
  type        = list(string)
  default     = ["general-purpose", "system"]
}

variable "private_subnets" {
  description = "Private subnet CIDRs"
  type        = list(string)
  #default     = ["10.20.0.0/21", "10.20.8.0/21", "10.20.16.0/21"]
}

variable "cluster_role_arn" {
  description = "IAM Role ARN for the EKS Cluster"
  type        = string
}

variable "node_role_arn" {
  description = "IAM Role ARN for the EKS Node"
  type        = string
}