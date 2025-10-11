import json
import boto3
import os
import time

def handler(event, context):
    # Get environment variables
    primary_region = os.environ['PRIMARY_REGION']
    secondary_region = os.environ['SECONDARY_REGION']
    primary_cluster_id = os.environ['PRIMARY_CLUSTER_ID']
    secondary_cluster_id = os.environ['SECONDARY_CLUSTER_ID']
    primary_asg_name = os.environ['PRIMARY_ASG_NAME']
    secondary_asg_name = os.environ['SECONDARY_ASG_NAME']
    secondary_desired_size = int(os.environ['SECONDARY_DESIRED_SIZE'])
    domain_name = os.environ['DOMAIN_NAME']
    hosted_zone_id = os.environ['HOSTED_ZONE_ID']
    sns_topic_arn = os.environ['SNS_TOPIC_ARN']
    
    # Initialize AWS clients
    rds_primary = boto3.client('rds', region_name=primary_region)
    rds_secondary = boto3.client('rds', region_name=secondary_region)
    autoscaling_secondary = boto3.client('autoscaling', region_name=secondary_region)
    route53 = boto3.client('route53')
    sns = boto3.client('sns')
    
    try:
        # Step 1: Scale up the secondary ASG
        print(f"Scaling up secondary ASG {secondary_asg_name} to {secondary_desired_size} instances")
        autoscaling_secondary.set_desired_capacity(
            AutoScalingGroupName=secondary_asg_name,
            DesiredCapacity=secondary_desired_size,
            HonorCooldown=False
        )
        
        # Step 2: Promote the secondary database cluster to primary
        print(f"Promoting secondary cluster {secondary_cluster_id} to primary")
        rds_secondary.failover_global_cluster(
            GlobalClusterIdentifier=primary_cluster_id,
            TargetDbClusterIdentifier=secondary_cluster_id
        )
        
        # Wait for the failover to complete
        print("Waiting for database failover to complete...")
        time.sleep(60)  # Initial wait
        
        # Check the status of the global cluster
        while True:
            response = rds_primary.describe_global_clusters(
                GlobalClusterIdentifier=primary_cluster_id
            )
            global_cluster = response['GlobalClusters'][0]
            
            # Check if the secondary cluster is now the primary writer
            for member in global_cluster['GlobalClusterMembers']:
                if member['DBClusterArn'].endswith(secondary_cluster_id) and member['IsWriter']:
                    print("Database failover completed successfully")
                    break
            else:
                print("Database failover in progress, waiting...")
                time.sleep(30)
                continue
            break
        
        # Step 3: Send notification about the failover
        message = f"ShopSmart application has been failed over to {secondary_region}. Primary database is now {secondary_cluster_id}."
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject="ShopSmart Failover Initiated",
            Message=message
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Failover initiated successfully',
                'details': {
                    'primary_region': primary_region,
                    'secondary_region': secondary_region,
                    'new_primary_cluster': secondary_cluster_id,
                    'secondary_asg_scaled_to': secondary_desired_size
                }
            })
        }
    except Exception as e:
        error_message = f"Error during failover: {str(e)}"
        print(error_message)
        
        # Send notification about the error
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject="ShopSmart Failover Error",
            Message=error_message
        )
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error during failover',
                'error': str(e)
            })
        }