variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "primary_vpc_id" {
  description = "ID of the primary VPC"
  type        = string
}

variable "primary_private_subnet_ids" {
  description = "IDs of the private subnets in primary region"
  type        = list(string)
}

variable "secondary_private_subnet_ids" {
  description = "IDs of the private subnets in secondary region"
  type        = list(string)
}

variable "compute_security_group_ids" {
  description = "Security group IDs of the compute layer"
  type        = list(string)
}

variable "db_username" {
  description = "Username for the database"
  type        = string
  default     = "shopsmartadmin"
}

variable "db_instance_class" {
  description = "Instance class for the database"
  type        = string
  default     = "db.t3.medium"
}

variable "secondary_db_instance_class" {
  description = "Instance class for the secondary database"
  type        = string
  default     = "db.t3.medium"
}