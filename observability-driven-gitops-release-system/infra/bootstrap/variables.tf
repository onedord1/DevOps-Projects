variable "region" {
  description = "AWS region for the state backend resources."
  type        = string
  default     = "us-east-1"
}

variable "state_bucket_name" {
  description = "Globally-unique S3 bucket name for Terraform remote state."
  type        = string
}

variable "lock_table_name" {
  description = "DynamoDB table name for state locking."
  type        = string
  default     = "acme-platform-tflock"
}

variable "tags" {
  description = "Tags applied to backend resources."
  type        = map(string)
  default = {
    Project   = "acme-platform"
    Component = "tf-backend"
    ManagedBy = "terraform"
  }
}
