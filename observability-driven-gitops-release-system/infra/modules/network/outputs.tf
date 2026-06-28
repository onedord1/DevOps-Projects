output "vpc_id" {
  description = "The ID of the VPC."
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "The CIDR block of the VPC."
  value       = module.vpc.vpc_cidr_block
}

output "private_subnet_ids" {
  description = "IDs of the private subnets (used for EKS nodes and internal load balancers)."
  value       = module.vpc.private_subnets
}

output "public_subnet_ids" {
  description = "IDs of the public subnets (used for internet-facing load balancers)."
  value       = module.vpc.public_subnets
}

output "azs" {
  description = "Availability Zones the VPC spans."
  value       = local.azs
}

output "nat_public_ips" {
  description = "Public IPs of the NAT gateway(s)."
  value       = module.vpc.nat_public_ips
}
