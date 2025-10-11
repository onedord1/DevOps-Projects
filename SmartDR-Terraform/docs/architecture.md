# ShopSmart Application Architecture Theory

## Overview
The ShopSmart application is deployed across two AWS regions in a warm-standby disaster recovery configuration.

## Primary Region (Region A)
- **VPC**: 10.0.0.0/16
- **Public Subnets**: 10.0.1.0/24, 10.0.2.0/24
- **Private Subnets**: 10.0.11.0/24, 10.0.12.0/24
- **Application Layer**: EC2 instances in Auto Scaling Group (2 instances)
- **Database**: Aurora Global Database (writer node)
- **Storage**: S3 bucket (primary)

## Secondary Region (Region B)
- **VPC**: 10.1.0.0/16
- **Public Subnets**: 10.1.1.0/24, 10.1.2.0/24
- **Private Subnets**: 10.1.11.0/24, 10.1.12.0/24
- **Application Layer**: EC2 instances in Auto Scaling Group (1 instance, warm standby)
- **Database**: Aurora Global Database (read replica)
- **Storage**: S3 bucket (replica)

## Disaster Recovery Configuration
- **RPO (Recovery Point Objective)**: ≤ 5 minutes (database replication lag)
- **RTO (Recovery Time Objective)**: ≤ 5 minutes (DNS failover time)
- **Failover Mechanism**: Route53 health checks + automated Lambda functions
- **Data Replication**: Aurora Global Database + S3 Cross-Region Replication

## Traffic Routing
- **Normal Operations**: Route53 directs traffic to primary region
- **Failover**: Route53 health checks detect failure in primary region and automatically redirect traffic to secondary region
- **Failback**: Manual or automated process to restore traffic to primary region after recovery

## Monitoring and Alerting
- CloudWatch dashboards for monitoring application and infrastructure health
- SNS notifications for failover events
- Health checks for application endpoints

## Automation
- Lambda functions for automated failover/failback
- API Gateway endpoints for manual triggering of failover/failback
- Scripts for DR testing