variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
}

variable "instance_class" {
  description = "RDS instance class (e.g., db.t3.micro)"
  type        = string
}

variable "username" {
  description = "Master username for the database"
  type        = string
}

variable "password" {
  description = "Master password for the database"
  type        = string
  sensitive   = true
}

variable "private_subnets" {
  description = "List of private subnet IDs for RDS"
  type        = list(string)
}

variable "db_sg_ids" {
  description = "List of security group IDs to attach to RDS"
  type        = list(string)
}
