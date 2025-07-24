module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"

  name               = var.vpc_name
  cidr               = var.vpc_cidr
  azs                = var.azs
  public_subnets     = var.public_subnets
  private_subnets    = var.private_subnets
  enable_nat_gateway = true
  single_nat_gateway = true

  tags = { Terraform = "true" }
}

resource "aws_security_group" "eks" {
  name        = "${var.vpc_name}-eks-sg"
  vpc_id      = module.vpc.vpc_id
  description = "Allow control plane & node group"
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}