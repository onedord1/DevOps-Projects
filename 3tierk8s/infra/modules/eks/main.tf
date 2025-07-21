module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = ">= 19.0"

  cluster_name    = var.cluster_name
  subnet_ids      = var.private_subnets
  vpc_id          = var.vpc_id
  cluster_version = var.cluster_version

  iam_role_name = var.eks_role_name
  iam_role_arn  = var.eks_role_arn

  cluster_endpoint_public_access = false

  eks_managed_node_groups = {
    default = {
      desired_capacity = 2
      max_capacity     = 3
      min_capacity     = 2
      instance_types   = var.node_instance_types
    }
  }

  tags = { Environment = var.env_prefix }

  authentication_mode = true
}

resource "aws_lb" "app" {
  name               = "${var.cluster_name}-alb"
  internal           = false
  load_balancer_type = "application"
  subnets            = var.public_subnets
}