variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for DR"
  type        = string
  default     = "ap-southeast-1"
}

variable "primary_vpc_cidr" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "secondary_vpc_cidr" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "primary_public_subnet_cidrs" {
  description = "CIDR blocks for public subnets in primary region"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "primary_private_subnet_cidrs" {
  description = "CIDR blocks for private subnets in primary region"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "secondary_public_subnet_cidrs" {
  description = "CIDR blocks for public subnets in secondary region"
  type        = list(string)
  default     = ["10.1.1.0/24", "10.1.2.0/24"]
}

variable "secondary_private_subnet_cidrs" {
  description = "CIDR blocks for private subnets in secondary region"
  type        = list(string)
  default     = ["10.1.11.0/24", "10.1.12.0/24"]
}

variable "primary_azs" {
  description = "Availability zones in primary region"
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
}

variable "secondary_azs" {
  description = "Availability zones in secondary region"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
}