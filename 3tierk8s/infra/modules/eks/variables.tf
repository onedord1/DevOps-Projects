variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "private_subnets" {
  description = "List of private subnet IDs for EKS worker nodes"
  type        = list(string)
}

variable "public_subnets" {
  description = "List of public subnet IDs for external load balancer"
  type        = list(string)
}

variable "vpc_id" {
  description = "VPC ID where EKS cluster resides"
  type        = string
}

variable "cluster_version" {
  description = "EKS Kubernetes version"
  type        = string
  default     = "1.31"
}

# variable "eks_role_name" {
#   description = "Name of the IAM role to associate with the EKS control plane"
#   type        = string
# }

# variable "eks_role_arn" {
#   description = "ARN of the IAM role to associate with the EKS control plane"
#   type        = string
# }

variable "node_instance_types" {
  description = "List of EC2 instance types for EKS managed node group"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "env_prefix" {
  description = "Environment prefix for tagging"
  type        = string
}
