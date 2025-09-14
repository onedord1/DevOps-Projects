variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  #default     = "10.20.0.0/19"
}

variable "azs" {
  description = "Availability zones"
  type        = list(string)
  #default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "private_subnets" {
  description = "Private subnet CIDRs"
  type        = list(string)
  #default     = ["10.20.0.0/21", "10.20.8.0/21", "10.20.16.0/21"]
}

variable "public_subnets" {
  description = "Public subnet CIDRs"
  type        = list(string)
  #default     = ["10.20.24.0/23", "10.20.26.0/23", "10.20.28.0/23"]
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  #default     = "eks-auto-test"
}