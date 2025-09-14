provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source = "../../modules/networks/vpc"
  vpc_cidr        = var.vpc_cidr_block
  azs             = var.azs
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets
  cluster_name    = var.cluster_name 
}

module "iam" {
  source = "../../modules/iam"
  cluster_name = var.cluster_name
}

module "eks" {
  source = "../../modules/eks"
  depends_on = [module.vpc]
  
  cluster_name    = var.cluster_name
  cluster_version = var.cluster_version
  private_subnets = module.vpc.private_subnets
  cluster_role_arn = module.iam.cluster_role_arn
  node_role_arn    = module.iam.node_role_arn
}

# Create OIDC provider for the EKS cluster
resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = module.eks.cluster_oidc_issuer_url

  tags = {
    Name = "${var.cluster_name}-oidc-provider"
  }
}

data "tls_certificate" "eks" {
  url = module.eks.cluster_oidc_issuer_url
}

# Create ALB Controller IAM role after the OIDC provider is created
module "alb" {
  source = "../../modules/alb"
  depends_on = [aws_iam_openid_connect_provider.eks]
  
  cluster_name            = var.cluster_name
  cluster_oidc_issuer_url = module.eks.cluster_oidc_issuer_url
  cluster_oidc_provider_arn = aws_iam_openid_connect_provider.eks.arn
}

module "s3" {
  source     = "../../modules/s3"
  depends_on = [module.eks]
  cluster_name = var.cluster_name
}

module "rds" {
  source     = "../../modules/rds"
  depends_on = [module.vpc]
  
  cluster_name                = var.cluster_name
  vpc_id                      = module.vpc.vpc_id
  private_subnets             = module.vpc.private_subnets
  private_subnets_cidr_blocks = module.vpc.private_subnets_cidr_blocks
  db_name                     = var.db_name
  db_username                 = var.db_username
  db_password                 = var.db_password
}