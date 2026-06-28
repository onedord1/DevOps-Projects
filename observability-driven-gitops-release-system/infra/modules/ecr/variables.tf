variable "repositories" {
  description = "ECR repository names to create (one per service)."
  type        = list(string)

  validation {
    condition     = length(var.repositories) > 0
    error_message = "Provide at least one repository name."
  }
}

variable "image_tag_mutability" {
  description = "IMMUTABLE (recommended for supply-chain integrity) or MUTABLE."
  type        = string
  default     = "IMMUTABLE"

  validation {
    condition     = contains(["IMMUTABLE", "MUTABLE"], var.image_tag_mutability)
    error_message = "image_tag_mutability must be IMMUTABLE or MUTABLE."
  }
}

variable "scan_on_push" {
  description = "Enable image vulnerability scanning on push (complements CI Trivy scans)."
  type        = bool
  default     = true
}

variable "max_image_count" {
  description = "Number of most-recent images to retain per repository."
  type        = number
  default     = 30
}

variable "force_delete" {
  description = "Allow deleting repositories that still contain images."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags applied to all repositories."
  type        = map(string)
  default     = {}
}
