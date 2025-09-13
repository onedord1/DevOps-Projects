variable "environment" {
  description = "Environment name"
  type        = string
}

variable "global_rate_limit" {
  description = "Global rate limit (requests per 5 minutes per IP)"
  type        = number
  default     = 1000
}

variable "api_rate_limit" {
  description = "API-specific rate limit (requests per 5 minutes per IP)"
  type        = number
  default     = 500
}

variable "auth_rate_limit" {
  description = "Authentication endpoints rate limit (requests per 5 minutes per IP)"
  type        = number
  default     = 100
}

variable "alarm_threshold" {
  description = "Threshold for CloudWatch alarm (number of blocked requests)"
  type        = number
  default     = 10
}

variable "alarm_actions" {
  description = "List of ARNs for alarm actions (e.g., SNS topics)"
  type        = list(string)
  default     = []
}

variable "create_sns_topic" {
  description = "Whether to create an SNS topic for WAF alerts"
  type        = bool
  default     = true
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}