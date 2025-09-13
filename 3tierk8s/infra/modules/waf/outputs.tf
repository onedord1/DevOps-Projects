output "waf_acl_arn" {
  description = "The ARN of the WAF WebACL"
  value       = aws_wafv2_web_acl.this.arn
}

output "waf_acl_id" {
  description = "The ID of the WAF WebACL"
  value       = aws_wafv2_web_acl.this.id
}

output "waf_acl_name" {
  description = "The name of the WAF WebACL"
  value       = aws_wafv2_web_acl.this.name
}

output "sns_topic_arn" {
  description = "The ARN of the SNS topic for WAF alerts (if created)"
  value       = var.create_sns_topic ? aws_sns_topic.waf_alerts[0].arn : ""
}

output "cloudwatch_alarm_arn" {
  description = "The ARN of the CloudWatch alarm for WAF rate limiting"
  value       = aws_cloudwatch_metric_alarm.waf_rate_limit_alarm.arn
}