resource "random_password" "password" {
  length  = 32
  special = true
}


resource "aws_secretsmanager_secret" "db_credentials" {
  provider = aws.primary
  name     = "${var.project_name}-${var.environment}-db-credentials"
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  provider      = aws.primary
  secret_id     = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.password.result
  })
}

resource "aws_db_subnet_group" "primary" {
  provider = aws.primary
  name     = "${var.project_name}-primary-db-subnet-group"
  subnet_ids = var.primary_private_subnet_ids

  tags = {
    Name        = "${var.project_name} Primary DB Subnet Group"
    Environment = var.environment
  }
}

resource "aws_db_subnet_group" "secondary" {
  provider = aws.secondary
  name     = "${var.project_name}-secondary-db-subnet-group"
  subnet_ids = var.secondary_private_subnet_ids

  tags = {
    Name        = "${var.project_name} Secondary DB Subnet Group"
    Environment = var.environment
  }
}


resource "aws_security_group" "database" {
  provider = aws.primary
  name     = "${var.project_name}-database-sg"
  vpc_id   = var.primary_vpc_id

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    security_groups = var.compute_security_group_ids
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name} Database SG"
    Environment = var.environment
  }
}


resource "aws_rds_global_cluster" "this" {
  provider     = aws.primary
  global_cluster_identifier = "${var.project_name}-${var.environment}-global-db"
  engine                    = "aurora-mysql"
  engine_version            = "8.0.mysql_aurora.3.08.2"
  database_name             = "shopsmart"
  storage_encrypted = true
  deletion_protection = false
}


resource "aws_rds_cluster" "primary" {
  provider = aws.primary
  
  global_cluster_identifier = aws_rds_global_cluster.this.id
  engine                    = aws_rds_global_cluster.this.engine
  engine_version            = aws_rds_global_cluster.this.engine_version
  
  database_name = aws_rds_global_cluster.this.database_name
  master_username = var.db_username
  master_password = random_password.password.result
  
  db_subnet_group_name = aws_db_subnet_group.primary.name
  vpc_security_group_ids = [aws_security_group.database.id]
  
  storage_encrypted = true
  skip_final_snapshot = true
  
  depends_on = [aws_secretsmanager_secret_version.db_credentials]
}


resource "aws_rds_cluster_instance" "primary" {
  provider = aws.primary
  cluster_identifier = aws_rds_cluster.primary.id
  
  instance_class = var.db_instance_class
  engine = aws_rds_global_cluster.this.engine
  engine_version = aws_rds_global_cluster.this.engine_version
  
  db_subnet_group_name = aws_db_subnet_group.primary.name
  
  publicly_accessible = false
}


resource "aws_rds_cluster" "secondary" {
  provider = aws.secondary
  
  global_cluster_identifier = aws_rds_global_cluster.this.id
  engine                    = aws_rds_global_cluster.this.engine
  engine_version            = aws_rds_global_cluster.this.engine_version
  master_username = var.db_username
  master_password = random_password.password.result
  db_subnet_group_name = aws_db_subnet_group.secondary.name
  storage_encrypted = true
  skip_final_snapshot = true
  
}

resource "aws_rds_cluster_instance" "secondary" {
  provider = aws.secondary
  cluster_identifier = aws_rds_cluster.secondary.id
  instance_class = var.secondary_db_instance_class
  engine = aws_rds_global_cluster.this.engine
  engine_version = aws_rds_global_cluster.this.engine_version
  db_subnet_group_name = aws_db_subnet_group.secondary.name
  publicly_accessible = false
}