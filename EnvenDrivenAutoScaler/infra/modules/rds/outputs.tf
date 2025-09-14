output "db_instance_endpoint" {
  value = module.db.db_instance_endpoint
}

output "db_instance_port" {
  value = module.db.db_instance_port
}

output "db_instance_name" {
  value = module.db.db_instance_name
}

output "db_instance_username" {
  value = module.db.db_instance_username
}

output "db_instance_arn" {
  value = module.db.db_instance_arn
}

output "db_security_group_id" {
  value = aws_security_group.rds.id
}