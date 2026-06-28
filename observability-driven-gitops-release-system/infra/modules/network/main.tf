# Network module — a thin, opinionated wrapper around the upstream
# terraform-aws-modules/vpc/aws module. It encodes the platform's conventions
# (subnet sizing, NAT strategy, EKS/Gateway load-balancer tags) behind a small
# interface so every environment provisions an architecturally identical VPC.

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)

  # Carve /20 subnets out of the VPC CIDR: private first, then public.
  private_subnets = [for i in range(var.az_count) : cidrsubnet(var.cidr, 4, i)]
  public_subnets  = [for i in range(var.az_count) : cidrsubnet(var.cidr, 4, i + 8)]

  # Tag subnets for Kubernetes load-balancer placement; add the cluster
  # discovery tag only when a cluster name is supplied.
  cluster_discovery_tags = var.cluster_name == "" ? {} : {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 6.6"

  name = var.name
  cidr = var.cidr
  azs  = local.azs

  private_subnets = local.private_subnets
  public_subnets  = local.public_subnets

  # Internet egress for private subnets via NAT.
  enable_nat_gateway     = true
  single_nat_gateway     = var.single_nat_gateway
  one_nat_gateway_per_az = !var.single_nat_gateway

  enable_dns_hostnames = true
  enable_dns_support   = true

  public_subnet_tags = merge(local.cluster_discovery_tags, {
    "kubernetes.io/role/elb" = "1"
  })
  private_subnet_tags = merge(local.cluster_discovery_tags, {
    "kubernetes.io/role/internal-elb" = "1"
  })

  tags = var.tags
}
