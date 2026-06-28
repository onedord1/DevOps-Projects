variable "project" {
  description = "Project identifier used in names and tags."
  type        = string
  default     = "acme-platform"
}

variable "environment" {
  description = "Environment name (dev/staging/prod)."
  type        = string
}

variable "region" {
  description = "AWS region."
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR for this environment (must not overlap other environments)."
  type        = string
}

variable "az_count" {
  description = "Number of Availability Zones."
  type        = number
  default     = 3
}

variable "single_nat_gateway" {
  description = "Single shared NAT gateway (cheaper) vs one per AZ (HA)."
  type        = bool
  default     = false
}

variable "kubernetes_version" {
  description = "EKS Kubernetes version."
  type        = string
  default     = "1.33"
}

variable "endpoint_public_access" {
  description = "Expose the EKS API endpoint publicly."
  type        = bool
  default     = true
}

variable "services" {
  description = "Acme services that get an ECR repository."
  type        = list(string)
  default     = ["frontend", "payment", "order", "inventory", "notification"]
}
