
domain_name = "kk.me"
# You can find this in the Route 53 console.
hosted_zone_id = "Z0055265XILAWQ3V1R2Y" # Example ID, replace with yours

# An email address to receive notifications for failover events and alarms.
alert_email = "alerts@your-shop-app.com"
# The name of an EC2 Key Pair to allow SSH access to the instances.
# Leave as an empty string "" if you don't need SSH access.
# key_name = "my-aws-key-pair"
project_name = "shopsmart"
environment  = "prod"
primary_region = "ap-south-1"
secondary_region = "ap-southeast-1"
instance_type = "t3.micro"
primary_desired_capacity = 2
primary_max_size         = 4
primary_min_size         = 2


secondary_desired_capacity = 1
secondary_max_size         = 2
secondary_min_size         = 1


db_username = "shopsmartadmin"
db_instance_class = "db.t3.micro"
secondary_db_instance_class = "db.t3.medium"

primary_vpc_cidr   = "10.0.0.0/16"
secondary_vpc_cidr = "10.1.0.0/16"
primary_azs = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
secondary_azs = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
ami_id           = "ami-0f9708d1cd2cfee41" 
secondary_ami_id = "ami-088d74defe9802f14"
react_app_source_path = "./react-app" 