terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}
provider "aws" {
  region = var.region
}

locals {
  azs = data.aws_availability_zones.available.names
}

data "aws_availability_zones" "available" {}

module "networking" {
  source          = "../../modules/networking"
  vpc_name        = var.env_prefix
  vpc_cidr        = var.vpc_cidr
  azs             = local.azs
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets
}

module "eks" {
  source           = "../../modules/eks"
  cluster_name     = var.cluster_name
  cluster_version  = var.cluster_version
  vpc_id           = module.networking.vpc_id
  private_subnets  = module.networking.private_subnets
  public_subnets   = module.networking.public_subnets
  node_instance_types = var.node_instance_types
  env_prefix       = var.env_prefix
}

module "iam" {
  source        = "../../modules/iam"
  env_prefix    = var.env_prefix
  eks_role_arn  = module.eks.cluster_iam_role_arn
  eks_role_name = module.eks.cluster_iam_role_name
}



module "rds" {
  source           = "../../modules/rds"
  instance_class   = var.db_instance_class
  db_name          = var.db_name
  username         = var.db_username
  password         = var.db_password
  private_subnets  = module.networking.private_subnets
  db_sg_ids        = [module.networking.eks_sg_id]
}