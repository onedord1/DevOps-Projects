# Partial backend configuration. Each environment keeps an ISOLATED state file
# (a distinct `key`) so blast radius is limited to one environment.
#
# Initialize with the matching backend.hcl:
#   terraform init -backend-config=backend.hcl
terraform {
  backend "s3" {}
}
