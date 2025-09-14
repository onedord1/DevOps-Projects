data "aws_availability_zones" "available" {
  state = "available"
}

module "db" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "${var.cluster_name}-postgres"

  engine               = "postgres"
  engine_version       = "16.3"
  family               = "postgres16"
  major_engine_version = "16"
  instance_class      = "db.t3.medium"

  allocated_storage     = 20
  max_allocated_storage = 100

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 5432

  iam_database_authentication_enabled = true

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.rds.name

  maintenance_window = "Mon:00:00-Mon:03:00"
  backup_window      = "03:00-06:00"

  backup_retention_period = 7
  skip_final_snapshot     = true
  deletion_protection     = false

  performance_insights_enabled = true
  performance_insights_retention_period = 7

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name        = "${var.cluster_name}-postgres"
    Environment = "dev"
  }

  depends_on = [aws_security_group.rds, aws_db_subnet_group.rds]
}

resource "aws_security_group" "rds" {
  name        = "${var.cluster_name}-rds-sg"
  description = "Allow EKS nodes to access RDS"
  vpc_id      = var.vpc_id

  # Allow access from private subnets using CIDR blocks
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.private_subnets_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.cluster_name}-rds-sg"
    Environment = "dev"
  }
}

resource "aws_db_subnet_group" "rds" {
  name        = "${var.cluster_name}-rds-subnet-group"
  description = "RDS subnet group"
  subnet_ids  = var.private_subnets  # Use subnet IDs here, not CIDR blocks

  tags = {
    Name        = "${var.cluster_name}-rds-subnet-group"
    Environment = "dev"
  }
}