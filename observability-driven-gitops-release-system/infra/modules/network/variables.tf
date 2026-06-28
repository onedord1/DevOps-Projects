variable "name" {
  description = "Name prefix for all network resources (typically <project>-<env>)."
  type        = string
}

variable "cidr" {
  description = "IPv4 CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.cidr, 0))
    error_message = "cidr must be a valid IPv4 CIDR block."
  }
}

variable "az_count" {
  description = "Number of Availability Zones to span (2 for dev, 3 for prod)."
  type        = number
  default     = 3

  validation {
    condition     = var.az_count >= 2 && var.az_count <= 4
    error_message = "az_count must be between 2 and 4."
  }
}

variable "single_nat_gateway" {
  description = "Use a single shared NAT gateway (cheaper, non-HA) instead of one per AZ."
  type        = bool
  default     = false
}

variable "cluster_name" {
  description = "EKS cluster name used to tag subnets for cluster auto-discovery. Empty disables the tag."
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default     = {}
}
