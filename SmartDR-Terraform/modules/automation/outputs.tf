output "failover_api_url" {
  description = "URL of the failover API"
  value       = "${aws_api_gateway_stage.failover.invoke_url}failover"
}

output "failback_api_url" {
  description = "URL of the failback API"
  value       = "${aws_api_gateway_stage.failover.invoke_url}failback"
}

output "failover_control_url" {
  description = "URL of the failover control endpoint"
  value       = "http://${aws_lb.failover_control.dns_name}"
}

output "failover_control_lb_dns_name" {
  description = "DNS name of the failover control ALB"
  value       = aws_lb.failover_control.dns_name
}

output "failover_control_lb_zone_id" {
  description = "Zone ID of the failover control ALB"
  value       = aws_lb.failover_control.zone_id
}