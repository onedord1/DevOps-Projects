# Call VPC module
module "vpc" {
  source = "../../modules/networking/vpc"

  name               = "${var.environment}-vpc"
  cidr               = var.vpc_cidr
  availability_zones = var.availability_zones
  private_subnets    = var.private_subnets
  public_subnets     = var.public_subnets
  environment        = var.environment
}

# Call Security Group module
module "security_group" {
  source = "../../modules/networking/security_group"

  name        = "${var.environment}-sg"
  vpc_id      = module.vpc.vpc_id
  environment = var.environment
}

# Call IAM module
module "iam" {
  source = "../../modules/iam"

  environment = var.environment
  aws_region  = var.aws_region
}

# Call EKS module
module "eks" {
  source = "../../modules/eks"

  cluster_name      = "${var.environment}-eks-cluster"
  cluster_version   = var.eks_cluster_version
  subnet_ids        = module.vpc.private_subnets
  vpc_id            = module.vpc.vpc_id
  iam_role_arn      = module.iam.eks_cluster_role_arn
  iam_role_name     = module.iam.eks_cluster_role_name
  eks_node_role_arn = module.iam.eks_node_role_arn
  eks_node_role_name = module.iam.eks_node_role_name
  environment       = var.environment
  aws_region        = var.aws_region
}

# Call RDS module
module "rds" {
  source = "../../modules/rds"

  identifier          = "${var.environment}-rds"
  engine              = "mysql"
  engine_version      = "8.0"
  instance_class      = var.db_instance_class
  allocated_storage   = 20
  db_name             = var.db_name
  username            = var.db_username
  password            = var.db_password
  subnet_ids          = module.vpc.database_subnets
  subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [module.security_group.rds_security_group_id]
  environment         = var.environment
}

# Call WAF module
module "waf" {
  source = "../../modules/waf"

  environment       = var.environment
  aws_region        = var.aws_region
  global_rate_limit = 1000  # Maximum number of requests per 5-minute period per IP
  api_rate_limit    = 500   # Stricter limit for API endpoints
  auth_rate_limit  = 100   # Very strict limit for auth endpoints
  alarm_threshold  = 10    # Number of blocked requests before triggering alarm
  create_sns_topic = true  # Create SNS topic for alerts
  alarm_actions    = []    # Add SNS topic ARNs here if you want to send notifications
}

# Call S3 module for ALB logs
module "s3" {
  source = "../../modules/s3"

  environment = var.environment
  aws_region  = var.aws_region
}

# Call ALB module
module "alb" {
  source = "../../modules/alb"

  environment          = var.environment
  internal            = false
  security_group_id   = module.security_group.alb_security_group_id
  subnet_ids          = module.vpc.public_subnets
  vpc_id              = module.vpc.vpc_id
  access_logs_bucket   = module.s3.alb_logs_bucket_name
  enable_access_logs  = true
  access_logs_prefix  = "employee-management"
  target_group_port   = 80
  target_group_protocol = "HTTP"
  health_check_path   = "/"
  health_check_port   = "traffic-port"
  listener_port       = 80
  listener_protocol   = "HTTP"
}

# Update local kubeconfig file
resource "null_resource" "update_kubeconfig" {
  triggers = {
    cluster_endpoint = module.eks.cluster_endpoint
  }

  provisioner "local-exec" {
    command = <<-EOT
      aws eks update-kubeconfig --name ${module.eks.cluster_name} --region ${var.aws_region}
    EOT
  }

  depends_on = [module.eks]
}

# Data source for EKS cluster authentication
data "aws_eks_cluster_auth" "this" {
  name = module.eks.cluster_name
}