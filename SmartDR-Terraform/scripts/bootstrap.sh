#!/bin/bash

# Bootstrap script for setting up Terraform state management

set -e

echo "Starting Terraform state management bootstrap..."


cd bootstrap


terraform init


terraform plan -out=tfplan
terraform apply tfplan


STATE_BUCKET=$(terraform output -raw state_bucket_name)
DYNAMODB_TABLE=$(terraform output -raw dynamodb_table_name)

echo "Bootstrap completed successfully!"
echo "State bucket: $STATE_BUCKET"
echo "DynamoDB table: $DYNAMODB_TABLE"


cd ../resources
sed -i.bak "s/bucket         = \"shopsmart-terraform-state\"/bucket         = \"$STATE_BUCKET\"/" backend.tf
sed -i.bak "s/dynamodb_table = \"shopsmart-terraform-locks\"/dynamodb_table = \"$DYNAMODB_TABLE\"/" backend.tf

echo "Backend configuration updated. You can now run 'terraform init' in the resources directory."