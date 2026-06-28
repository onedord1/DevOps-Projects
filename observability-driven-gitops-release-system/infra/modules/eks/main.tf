# EKS module — wraps the upstream terraform-aws-modules/eks/aws module and
# standardizes on EKS Auto Mode, so AWS manages node provisioning/scaling and
# the platform team owns only the cluster contract. This keeps the production
# topology lean while remaining a drop-in target for the Argo CD / Argo Rollouts
# layers (Phases 6–7).

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 21.0"

  name               = var.name
  kubernetes_version = var.kubernetes_version

  endpoint_public_access                   = var.endpoint_public_access
  enable_cluster_creator_admin_permissions = var.enable_cluster_creator_admin_permissions

  # EKS Auto Mode: AWS manages compute (nodes) for the selected pools.
  compute_config = {
    enabled    = true
    node_pools = var.node_pools
  }

  vpc_id     = var.vpc_id
  subnet_ids = var.subnet_ids

  tags = var.tags
}
