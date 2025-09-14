module "velero_backup_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 5.0"

  bucket = "${var.cluster_name}-velero-backups"
  acl    = "private"

  # Allow deletion of non-empty bucket for development
  force_destroy = true

  control_object_ownership = true
  object_ownership        = "ObjectWriter"

  versioning = {
    enabled = true
  }

  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "AES256"
      }
    }
  }

  tags = {
    Name        = "${var.cluster_name}-velero-backups"
    Environment = "dev"
    Purpose     = "Velero-backups"
  }
}

module "alb_logs_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 5.0"

  bucket = "${var.cluster_name}-alb-logs"
  acl    = "log-delivery-write"

  # Allow deletion of non-empty bucket for development
  force_destroy = true

  control_object_ownership = true
  object_ownership        = "ObjectWriter"

  # Attach policy for ALB/NLB log delivery
  attach_elb_log_delivery_policy = true
  attach_lb_log_delivery_policy  = true

  lifecycle_rule = [
    {
      id      = "alb_logs_retention"
      enabled = true

      expiration = {
        days = 30
      }

      noncurrent_version_expiration = {
        days = 30
      }
    }
  ]

  tags = {
    Name        = "${var.cluster_name}-alb-logs"
    Environment = "dev"
    Purpose     = "ALB-logs"
  }
}