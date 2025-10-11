output "dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://${var.primary_region}.console.aws.amazon.com/cloudwatch/home?region=${var.primary_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}