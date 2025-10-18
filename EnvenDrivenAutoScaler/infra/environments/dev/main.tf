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

module "alb" {
  source = "../../modules/alb"
  cluster_name = var.cluster_name
}
# Create OIDC-based IAM roles
module "oidc_iam_roles" {
  source = "../../modules/oidc-iam-roles"
  depends_on = [aws_iam_openid_connect_provider.eks]
  
  cluster_name               = var.cluster_name
  cluster_oidc_issuer_url    = module.eks.cluster_oidc_issuer_url
  cluster_oidc_provider_arn  = aws_iam_openid_connect_provider.eks.arn
  alb_controller_policy_arn  = module.iam.alb_controller_policy_arn
  velero_policy_arn          = module.iam.velero_policy_arn
  github_actions_policy_arn  = module.iam.github_actions_policy_arn
  github_actions_repo       = "" # Add your repo here when ready, e.g., "your-username/your-repo"
}

module "s3" {
  source     = "../../modules/s3"
  depends_on = [module.eks]
  cluster_name = var.cluster_name
}

module "rds" {
  source     = "../../modules/rds"
  depends_on = [module.vpc]
  
  cluster_name              = var.cluster_name
  vpc_id                    = module.vpc.vpc_id
  private_subnets           = module.vpc.private_subnets
  private_subnets_cidr_blocks = module.vpc.private_subnets_cidr_blocks
  db_name                   = var.db_name
  db_username               = var.db_username
  db_password               = var.db_password
}


# Configure Kubernetes provider
data "aws_eks_cluster" "cluster" {
  name = module.eks.cluster_name
}

data "aws_eks_cluster_auth" "cluster" {
  name = module.eks.cluster_name
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

provider "helm" {}

# Now pass the configured providers to the modules
module "kubernetes_components" {
  source = "../../modules/kubernetes-components"
  depends_on = [module.oidc_iam_roles]
  
  cluster_name               = var.cluster_name
  alb_controller_role_arn    = module.oidc_iam_roles.alb_controller_role_arn
  velero_role_arn            = module.oidc_iam_roles.velero_role_arn
  region                     = var.aws_region
  velero_backup_bucket_name  = module.s3.velero_backup_bucket_name
  
  providers = {
    kubernetes = kubernetes
    helm       = helm
  }
}

module "rabbitmq" {
  source = "../../modules/rabbitmq"
  depends_on = [module.kubernetes_components]
  
  cluster_name = var.cluster_name
  
  providers = {
    kubernetes = kubernetes
    helm       = helm
  }
}

module "redis" {
  source = "../../modules/redis"
  depends_on = [module.rabbitmq]
  
  cluster_name = var.cluster_name
  
  providers = {
    kubernetes = kubernetes
    helm       = helm
  }
}

# module "elasticsearch" {
#   source = "../../modules/elasticsearch"
#   depends_on = [module.redis]
  
#   cluster_name = var.cluster_name
  
#   providers = {
#     kubernetes = kubernetes
#     helm       = helm
#   }
# }

module "kubernetes_apps" {
  source = "../../modules/kubernetes-apps"
  # depends_on = [module.elasticsearch]
  
  cluster_name          = var.cluster_name
  backend_image_name  = var.backend_image_name
  backend_image_tag   = var.backend_image_tag
  frontend_image_name = var.frontend_image_name
  frontend_image_tag  = var.frontend_image_tag
  rds_endpoint          = module.rds.db_instance_endpoint
  rds_port              = module.rds.db_instance_port
  rds_username          = module.rds.db_instance_username
  rds_password          = var.db_password
  rds_database          = var.db_name
  alb_logs_bucket_name  = module.s3.alb_logs_bucket_name
  providers = {
    kubernetes = kubernetes
  }
}

module "keda_autoscaling" {
  source = "../../modules/keda-autoscaling"
  depends_on = [module.kubernetes_apps]
  
  cluster_name = var.cluster_name
  
  providers = {
    kubernetes = kubernetes
  }
}