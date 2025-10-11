variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "primary_vpc_id" {
  description = "ID of the primary VPC"
  type        = string
}

variable "primary_public_subnet_ids" {
  description = "IDs of the public subnets in primary region"
  type        = list(string)
}

variable "primary_private_subnet_ids" {
  description = "IDs of the private subnets in primary region"
  type        = list(string)
}

variable "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  type        = string
}

variable "secondary_public_subnet_ids" {
  description = "IDs of the public subnets in secondary region"
  type        = list(string)
}

variable "secondary_private_subnet_ids" {
  description = "IDs of the private subnets in secondary region"
  type        = list(string)
}

variable "ami_id" {
  description = "AMI ID for EC2 instances in primary region"
  type        = string
  default     = "ami-0f9708d1cd2cfee41" # Amazon Linux 2 in us-east-1
}

variable "secondary_ami_id" {
  description = "AMI ID for EC2 instances in secondary region"
  type        = string
  default     = "ami-088d74defe9802f14" # Amazon Linux 2 in us-west-2
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

# variable "key_name" {
#   description = "SSH key name for EC2 instances"
#   type        = string
#   default     = ""
# }

variable "primary_desired_capacity" {
  description = "Desired capacity for primary ASG"
  type        = number
  default     = 2
}

variable "primary_max_size" {
  description = "Maximum size for primary ASG"
  type        = number
  default     = 4
}

variable "primary_min_size" {
  description = "Minimum size for primary ASG"
  type        = number
  default     = 2
}

variable "secondary_desired_capacity" {
  description = "Desired capacity for secondary ASG (warm standby)"
  type        = number
  default     = 1
}

variable "secondary_max_size" {
  description = "Maximum size for secondary ASG"
  type        = number
  default     = 2
}

variable "secondary_min_size" {
  description = "Minimum size for secondary ASG"
  type        = number
  default     = 1
}

variable "primary_bucket_name" {
  description = "Name of the primary S3 bucket for application assets"
  type        = string
}

variable "primary_s3_bucket_arn" {
  description = "ARN of the primary S3 bucket for application assets"
  type        = string
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