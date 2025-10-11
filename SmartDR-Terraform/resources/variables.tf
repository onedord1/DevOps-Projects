variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for DR"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "shopsmart"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "instance_type" {
  description = "Instance Type for Launch Template"
  type = string
}

variable "react_app_source_path" {
  description = "The local path to the React application's source directory."
  type        = string
}

# variable "key_name" {
#   description = "Key Name"
#   type = string
# }

variable "primary_max_size" {
  description = "Primary max for asg"
  type = number
}

variable "primary_min_size" {
  description = "Primary Min for ASG"
  type = number
}

variable "secondary_max_size" {
  description = "Secondary max for ASG"
  type = number
}

variable "secondary_min_size" {
  description = "Secondary Max for ASG"
  type = number
}

variable "primary_vpc_cidr" {
  description = "Primary VPC CIDR"
  type = string
}

variable "secondary_vpc_cidr" {
  description = "Secondary VPC CIDR"
  type = string
}

variable "ami_id" {
  description = "Primary AMI ID"
  type = string
}

variable "secondary_ami_id" {
  description = "Secondary AMI ID"
  type = string
}

variable "db_username" {
  description = "Database user name"
  type = string
}

variable "db_instance_class" {
  description = "Database Instance Class"
  type = string
}

variable "secondary_db_instance_class" {
  description = "Instance class for the secondary database"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for the domain"
  type        = string
}

variable "alert_email" {
  description = "Email address for failover alerts"
  type        = string
}

variable "primary_desired_capacity" {
  description = "Desired capacity for primary ASG"
  type        = number
  default     = 2
}

variable "secondary_desired_capacity" {
  description = "Desired capacity for secondary ASG (warm standby)"
  type        = number
  default     = 1
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