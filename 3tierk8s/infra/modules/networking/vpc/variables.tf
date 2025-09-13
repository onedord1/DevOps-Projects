variable "name" {
  description = "Name of the VPC"
  type        = string
}

variable "cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "private_subnets" {
  description = "List of private subnets CIDR"
  type        = list(string)
}

variable "public_subnets" {
  description = "List of public subnets CIDR"
  type        = list(string)
}

variable "environment" {
  description = "Environment name"
  type        = string
}