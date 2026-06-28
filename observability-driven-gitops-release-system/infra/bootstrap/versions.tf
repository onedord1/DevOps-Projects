terraform {
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.28"
    }
  }

  # Bootstrap uses LOCAL state by design: it creates the very backend that the
  # environments use. Commit the resulting bootstrap state, or re-import.
}
