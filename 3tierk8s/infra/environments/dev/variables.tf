variable "region" { type = string; default = "us-east-1" }
variable "env_prefix" { type = string; default = "dev" }
variable "vpc_cidr"     { type = string; default = "10.0.0.0/16" }
variable "public_subnets"  { type = list(string); default = ["10.0.101.0/24","10.0.102.0/24","10.0.103.0/24"] }
variable "private_subnets" { type = list(string); default = ["10.0.1.0/24","10.0.2.0/24","10.0.3.0/24"] }

variable "cluster_name"       { type = string; default = "dev-eks" }
variable "cluster_version"    { type = string; default = "1.27" }
variable "node_instance_types" { type = list(string); default = ["t3.medium"] }

variable "db_instance_class" { type = string; default = "db.t3.micro" }
variable "db_name"           { type = string; default = "mydb" }
variable "db_username"       { type = string }
variable "db_password"       { type = string }
