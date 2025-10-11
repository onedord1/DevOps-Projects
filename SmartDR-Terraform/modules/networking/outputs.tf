output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary.id
}

output "primary_public_subnet_ids" {
  description = "IDs of the public subnets in primary region"
  value       = aws_subnet.primary_public[*].id
}

output "primary_private_subnet_ids" {
  description = "IDs of the private subnets in primary region"
  value       = aws_subnet.primary_private[*].id
}

output "secondary_public_subnet_ids" {
  description = "IDs of the public subnets in secondary region"
  value       = aws_subnet.secondary_public[*].id
}

output "secondary_private_subnet_ids" {
  description = "IDs of the private subnets in secondary region"
  value       = aws_subnet.secondary_private[*].id
}