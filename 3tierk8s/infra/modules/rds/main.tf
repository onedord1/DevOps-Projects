terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Create RDS Subnet Group if not provided
resource "aws_db_subnet_group" "this" {
  count = var.subnet_group_name == "" ? 1 : 0
  name  = "${var.identifier}-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.identifier}-subnet-group"
    Environment = var.environment
  }
}

# Create RDS Instance
resource "aws_db_instance" "this" {
  identifier             = var.identifier
  engine                 = var.engine
  engine_version         = var.engine_version
  instance_class         = var.instance_class
  allocated_storage      = var.allocated_storage
  db_name                = var.db_name
  username               = var.username
  password               = var.password
  db_subnet_group_name   = var.subnet_group_name != "" ? var.subnet_group_name : aws_db_subnet_group.this[0].name
  vpc_security_group_ids = var.vpc_security_group_ids
  skip_final_snapshot    = true
  publicly_accessible    = false

  tags = {
    Name        = var.identifier
    Environment = var.environment
  }
}