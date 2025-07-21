resource "aws_db_subnet_group" "default" {
  name       = "${var.db_name}-subnet"
  subnet_ids = var.private_subnets
}

resource "aws_db_instance" "postgres" {
  engine            = "postgres"
  instance_class    = var.instance_class
  db_name              = var.db_name
  username          = var.username
  password          = var.password
  skip_final_snapshot = true
  db_subnet_group_name = aws_db_subnet_group.default.id
  vpc_security_group_ids = var.db_sg_ids
  publicly_accessible = false
}