
module "networking" {
  source = "../modules/networking"
  primary_vpc_cidr = var.primary_vpc_cidr
  secondary_vpc_cidr = var.secondary_vpc_cidr
  project_name = var.project_name
  environment  = var.environment
  
  primary_azs = var.primary_azs
  secondary_azs = var.secondary_azs
  primary_region   = var.primary_region
  secondary_region = var.secondary_region

  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }
}


module "storage" {
  source = "../modules/storage"
  
  project_name = var.project_name
  environment  = var.environment

  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }
}


module "compute" {
  source = "../modules/compute"
  
  project_name = var.project_name
  environment  = var.environment
  region       = var.primary_region
  instance_type = var.instance_type
  # key_name = var.key_name
  primary_max_size = var.primary_max_size
  primary_min_size = var.primary_min_size
  secondary_max_size = var.secondary_max_size
  secondary_min_size = var.secondary_min_size
  primary_vpc_id = module.networking.primary_vpc_id
  primary_public_subnet_ids = module.networking.primary_public_subnet_ids
  primary_private_subnet_ids = module.networking.primary_private_subnet_ids
  primary_bucket_name   = module.storage.primary_bucket_name
  primary_s3_bucket_arn = module.storage.primary_bucket_arn
  ami_id = var.ami_id
  secondary_ami_id = var.secondary_ami_id
  secondary_vpc_id = module.networking.secondary_vpc_id
  secondary_public_subnet_ids = module.networking.secondary_public_subnet_ids
  secondary_private_subnet_ids = module.networking.secondary_private_subnet_ids

  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }
}


module "database" {
  source = "../modules/database"
  
  project_name = var.project_name
  environment  = var.environment
  db_username = var.db_username
  db_instance_class = var.db_instance_class
  secondary_db_instance_class= var.secondary_db_instance_class
  primary_vpc_id = module.networking.primary_vpc_id
  primary_private_subnet_ids = module.networking.primary_private_subnet_ids
  secondary_private_subnet_ids = module.networking.secondary_private_subnet_ids
  compute_security_group_ids = [module.compute.primary_web_security_group_id]
  
  depends_on = [module.compute]


  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }
}


module "dns" {
  source = "../modules/dns"
  
  project_name = var.project_name
  environment  = var.environment
  domain_name  = var.domain_name
  hosted_zone_id = var.hosted_zone_id
  
  primary_region   = var.primary_region
  secondary_region = var.secondary_region
  
  primary_alb_dns_name = module.compute.primary_alb_dns_name
  primary_alb_zone_id  = module.compute.primary_alb_zone_id
  
  secondary_alb_dns_name = module.compute.secondary_alb_dns_name
  secondary_alb_zone_id  = module.compute.secondary_alb_zone_id
  
  alert_email = var.alert_email

  # REMOVE THESE TWO LINES
  # failover_control_lb_dns_name = module.automation.failover_control_lb_dns_name
  # failover_control_lb_zone_id  = module.automation.failover_control_lb_zone_id

  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }
}


module "monitoring" {
  source = "../modules/monitoring"
  
  project_name = var.project_name
  environment  = var.environment
  
  primary_region   = var.primary_region
  secondary_region = var.secondary_region
  
  primary_alb_arn_suffix   = module.compute.primary_alb_arn_suffix
  secondary_alb_arn_suffix = module.compute.secondary_alb_arn_suffix
  
  primary_db_cluster_id   = module.database.primary_cluster_id
  secondary_db_cluster_id = module.database.secondary_cluster_id

  failover_alerts_sns_topic_arn = module.dns.sns_topic_arn

  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }
}


module "automation" {
  source = "../modules/automation"
  
  project_name = var.project_name
  environment  = var.environment
  
  primary_region   = var.primary_region
  secondary_region = var.secondary_region
  
  primary_cluster_id   = module.database.primary_cluster_id
  secondary_cluster_id = module.database.secondary_cluster_id
  
  primary_asg_name   = module.compute.primary_asg_name
  secondary_asg_name = module.compute.secondary_asg_name
  
  primary_desired_size   = var.primary_desired_capacity
  secondary_desired_size = var.secondary_desired_capacity
  
  domain_name     = var.domain_name
  hosted_zone_id  = var.hosted_zone_id
  sns_topic_arn   = module.dns.sns_topic_arn
  
  primary_vpc_id = module.networking.primary_vpc_id
  primary_public_subnet_ids = module.networking.primary_public_subnet_ids
  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }
}
data "archive_file" "react_app" {
  type        = "zip"
  source_dir  = var.react_app_source_path
  output_path = "${path.module}/../react-app.zip"
}

resource "null_resource" "upload_react_app" {
  depends_on = [
    module.storage
  ]
  triggers = {
    file_hash = data.archive_file.react_app.output_base64sha256
  }
  provisioner "local-exec" {
    command = "aws s3 cp ${data.archive_file.react_app.output_path} s3://${module.storage.primary_bucket_name}/react-app.zip"
  }
}