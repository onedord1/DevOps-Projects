variable "region" {
  type    = string
  default = "ap-south-1"
}

variable "env_prefix" {
  type    = string
  default = "3tierk8s-dev"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnets" {
  type = list(string)
  default = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

variable "private_subnets" {
  type = list(string)
  default = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "cluster_name" {
  type    = string
  default = "3tier-dev-eks"
}

variable "cluster_version" {
  type    = string
  default = "1.32"
}

variable "node_instance_types" {
  type    = list(string)
  default = ["t3.medium"]
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "db_name" {
  type    = string
  default = "employeedb"
}

variable "db_username" {
  type = string
}

variable "db_password" {
  type = string
  sensitive = true
}
