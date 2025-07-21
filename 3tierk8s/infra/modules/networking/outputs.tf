output "vpc_id"             { value = module.vpc.vpc_id }
output "public_subnets"    { value = module.vpc.public_subnets }
output "private_subnets"   { value = module.vpc.private_subnets }
output "eks_sg_id"         { value = aws_security_group.eks.id }