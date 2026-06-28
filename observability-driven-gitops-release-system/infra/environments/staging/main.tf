# staging environment — identical composition to dev/prod; only tfvars differ.
# Isolated state via backend.tf.

locals {
  name = "${var.project}-${var.environment}"

  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

module "network" {
  source = "../../modules/network"

  name               = local.name
  cidr               = var.vpc_cidr
  az_count           = var.az_count
  single_nat_gateway = var.single_nat_gateway
  cluster_name       = local.name
  tags               = local.tags
}

module "eks" {
  source = "../../modules/eks"

  name                   = local.name
  kubernetes_version     = var.kubernetes_version
  vpc_id                 = module.network.vpc_id
  subnet_ids             = module.network.private_subnet_ids
  endpoint_public_access = var.endpoint_public_access
  tags                   = local.tags
}

module "ecr" {
  source = "../../modules/ecr"

  repositories = [for s in var.services : "${var.project}/${s}"]
  tags         = local.tags
}
