# Partial backend configuration — isolated state per environment.
#   terraform init -backend-config=backend.hcl
terraform {
  backend "s3" {}
}
