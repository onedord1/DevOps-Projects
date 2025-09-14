variable "aws_region" {
  description = "The AWS region to deploy resources"
  type        = string
  #default     = "us-east-1"  # Change as needed
}
variable "vpc_cidr_block" {
  description = "CIDR block for the VPC"
  type        = string
  #default     = "10.0.0.0/16"
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
#   default     = "eks-auto-test"
}

variable "cluster_version" {
  description = "EKS cluster kubernetes version"
  type        = string
#   default     = "1.32"
}
variable "db_name" {
  description = "Database name"
  type        = string
  default     = "appdb"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "appuser"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}