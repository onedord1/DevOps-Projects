output "private_subnets" {
  value = module.vpc_eks.private_subnets
}
output "vpc_id" {
  value = module.vpc_eks.vpc_id
}

output "public_subnets" {
  value = module.vpc_eks.public_subnets
}
output "private_subnets_cidr_blocks" {
  value = module.vpc_eks.private_subnets_cidr_blocks
}