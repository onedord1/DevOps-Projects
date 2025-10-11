# ShopSmart Multi-Region Disaster Recovery Setup

### Note: This project is still in alpha mode.

## Overview

This project implements a comprehensive disaster recovery (DR) solution for the ShopSmart e-commerce application using AWS and Terraform. The architecture follows a warm-standby pattern across multiple AWS regions to ensure high availability and business continuity in case of regional failures.

## Scenario

ShopSmart is an online application that requires high availability and disaster recovery capabilities. The application is initially deployed in a single AWS region (Region A) but needs to be upgraded to a multi-region setup where if Region A fails, Region B automatically takes over with minimal data loss and downtime.

## Architecture

The solution implements:

- **Warm-standby DR setup** in Region B (secondary region) with core infrastructure running at reduced capacity
- **Database replication** from Region A → Region B with minimal lag (RPO target ≤ 5 minutes) using Aurora Global Database
- **Object storage** cross-region replication for static assets and backups using S3 CRR
- **Automated failover** using Route 53 health checks and routing policies
- **Monitoring, backups, secrets/config sync**, and testing capabilities

## Project Structure

```
.
├── bootstrap/                    # Initial state management setup
├── docs/                         # Documentation
├── envs/                         # Environment configurations
├── modules/                      # Terraform modules
│   ├── automation/               # Lambda functions for failover automation
│   ├── compute/                  # EC2 instances and Auto Scaling Groups
│   ├── database/                 # Aurora Global Database
│   ├── dns/                      # Route53 configuration
│   ├── monitoring/               # CloudWatch dashboards and alarms
│   ├── networking/               # VPC, subnets, and networking components
│   ├── state-management/         # S3 bucket and DynamoDB for state
│   └── storage/                  # S3 buckets with cross-region replication
├── resources/                    # Main Terraform configuration
├── scripts/                      # Helper scripts
└── states/                       # Terraform state files
```

## Prerequisites

- Terraform 1.0 or later
- AWS CLI configured with appropriate credentials
- A registered domain name in Route53
- An email address for notifications

## Setup and Configuration

### 1. Environment Variables

Before running the project, you need to configure the following variables in `resources/variables.tf`:

```hcl
variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"  # Change to your preferred primary region
}

variable "secondary_region" {
  description = "Secondary AWS region for DR"
  type        = string
  default     = "us-west-2"  # Change to your preferred secondary region
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "shopsmart"  # Change to your project name
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"  # Change to your environment (dev, staging, prod)
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  # You must provide this value
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for the domain"
  type        = string
  # You must provide this value
}

variable "alert_email" {
  description = "Email address for failover alerts"
  type        = string
  # You must provide this value
}

variable "key_name" {
  description = "SSH key name for EC2 instances"
  type        = string
  default     = ""  # Provide your SSH key name if needed
}
```

### 2. AMI IDs

Update the AMI IDs in `modules/compute/variables.tf` to match your regions:

```hcl
variable "ami_id" {
  description = "AMI ID for EC2 instances in primary region"
  type        = string
  default     = "ami-0c55b159cbfafe1f0" # Amazon Linux 2 in us-east-1
}

variable "secondary_ami_id" {
  description = "AMI ID for EC2 instances in secondary region"
  type        = string
  default     = "ami-0d593311db5abb72b" # Amazon Linux 2 in us-west-2
}
```

### 3. Auto Scaling Group Sizes

Configure the desired capacities for your Auto Scaling Groups in `resources/variables.tf`:

```hcl
variable "primary_desired_capacity" {
  description = "Desired capacity for primary ASG"
  type        = number
  default     = 2
}

variable "secondary_desired_capacity" {
  description = "Desired capacity for secondary ASG (warm standby)"
  type        = number
  default     = 1
}
```

## Deployment Steps

### Step 1: Bootstrap State Management

First, create the S3 bucket and DynamoDB table for Terraform state management:

```bash
# Make the bootstrap script executable
chmod +x scripts/bootstrap.sh

# Run the bootstrap script
./scripts/bootstrap.sh
```

This will:
- Create an S3 bucket for storing Terraform state
- Create a DynamoDB table for state locking
- Update the backend configuration in `resources/backend.tf`

### Step 2: Initialize Terraform

```bash
cd resources
terraform init
```

### Step 3: Plan and Apply Infrastructure

```bash
# Review the execution plan
terraform plan

# Apply the configuration
terraform apply
```

This will deploy:
- VPCs, subnets, and networking components in both regions
- S3 buckets with cross-region replication
- Aurora Global Database
- EC2 instances and Auto Scaling Groups
- Application Load Balancers
- Route53 health checks and DNS records
- CloudWatch dashboards and alarms
- Lambda functions for automated failover

### Step 4: Package Lambda Functions

Package the Lambda functions for automation:

```bash
cd modules/automation/lambda
zip -r ../failover.zip failover.py
zip -r ../failback.zip failback.py
cd ../../..
```

### Step 5: Deploy Automation

Deploy the automation components:

```bash
cd resources
terraform plan
terraform apply
```

## Testing the DR Setup

### Manual Failover Test

To manually trigger a failover:

```bash
# Get the failover API URL
FAILOVER_API_URL=$(terraform output -raw failover_api_url)

# Trigger failover
curl -X POST $FAILOVER_API_URL
```

To manually trigger a failback:

```bash
# Get the failback API URL
FAILBACK_API_URL=$(terraform output -raw failback_api_url)

# Trigger failback
curl -X POST $FAILBACK_API_URL
```

### Automated DR Test

Run the automated DR test script:

```bash
# Make the script executable
chmod +x scripts/dr-test.sh

# Run the DR test
./scripts/dr-test.sh
```

This script will:
1. Check which region is currently serving traffic
2. Initiate a failover to the secondary region
3. Verify that the failover was successful
4. Wait for a specified period
5. Initiate a failback to the primary region
6. Verify that the failback was successful

## Monitoring and Alerting

- **CloudWatch Dashboard**: Access the monitoring dashboard at the URL provided in the Terraform outputs
- **SNS Notifications**: You'll receive email notifications when failover events occur
- **Health Checks**: Route53 health checks continuously monitor the health of your application

## Disaster Recovery Plan

For detailed information about the DR plan, refer to `docs/dr-plan.md`.

## Architecture Diagram

For a detailed architecture diagram, refer to `docs/architecture.md`.

## Troubleshooting

### Common Issues

1. **Bootstrap Fails**: Ensure your AWS credentials are properly configured and you have the necessary permissions.
2. **Terraform Apply Fails**: Check the error messages and ensure all required variables are properly configured.
3. **Failover Doesn't Work**: Verify that the health checks are properly configured and the Lambda functions have the necessary permissions.

### Getting Help

If you encounter issues, check the CloudWatch logs for the Lambda functions and the EC2 instances. You can also run `terraform validate` to check for syntax errors in your configuration.

## Cleanup

To destroy all resources created by this project:

```bash
cd resources
terraform destroy
```

Note: This will not destroy the S3 bucket and DynamoDB table created during the bootstrap process. You'll need to delete those manually.

## Security Considerations

- The S3 bucket for Terraform state is encrypted and has versioning enabled
- The database is encrypted at rest
- Security groups are configured to allow only necessary traffic
- IAM roles follow the principle of least privilege

## Cost Considerations

This architecture creates resources in two AWS regions, which will incur costs in both regions. The secondary region runs at reduced capacity (warm standby) to minimize costs while still providing DR capabilities. For detailed cost information, refer to the AWS pricing documentation for each service used.