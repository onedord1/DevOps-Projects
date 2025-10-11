#!/bin/bash
# User data script to deploy and serve the ShopSmart React application

set -e

# The region is now passed directly from Terraform via the ${region} variable.
# No need to fetch it from instance metadata.
# REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone | sed 's/\(.*\)[a-z]/\1/')

yum update -y
yum install -y httpd unzip

# Use the Terraform-provided variables directly in the commands.
echo "Downloading application from S3 bucket: s3://${s3_bucket_name}/${app_zip}"
aws s3 cp "s3://${s3_bucket_name}/${app_zip}" /tmp/${app_zip}"

echo "Extracting application to /var/www/html"
unzip -o /tmp/${app_zip} -d /var/www/html/
chown -R apache:apache /var/www/html

systemctl start httpd
systemctl enable httpd

cat > /var/www/html/healthcheck.html <<EOF
<!DOCTYPE html>
<html>
<head>
  <title>ShopSmart Health Check</title>
</head>
<body>
  <h1>ShopSmart Application Health Check</h1>
  <p>Status: Healthy</p>
  <p>Region: ${region}</p>
  <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
</body>
</html>
EOF

echo "Setup complete."