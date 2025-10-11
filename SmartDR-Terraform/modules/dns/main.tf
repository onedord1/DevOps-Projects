data "aws_caller_identity" "current" {}


resource "aws_route53_health_check" "primary" {
  fqdn                            = var.primary_alb_dns_name
  port                            = 80
  type                            = "HTTP"
  resource_path                   = "/"
  failure_threshold               = 3
  request_interval                = 30
  
  
  cloudwatch_alarm_region         = var.primary_region
  cloudwatch_alarm_name           = "${var.project_name}-primary-alb-failover-alarm"
  
  # insufficient_data_health_status = "Unhealthy"
  measure_latency                 = true
  
  tags = {
    Name        = "${var.project_name} Primary ALB Health Check"
    Environment = var.environment
  }
}


resource "aws_route53_health_check" "secondary" {
  fqdn                            = var.secondary_alb_dns_name
  port                            = 80
  type                            = "HTTP"
  resource_path                   = "/"
  failure_threshold               = 3
  request_interval                = 30

  
  cloudwatch_alarm_region         = var.secondary_region
  cloudwatch_alarm_name           = "${var.project_name}-secondary-alb-failover-alarm"

  # insufficient_data_health_status = "Unhealthy"
  measure_latency                 = true
  
  tags = {
    Name        = "${var.project_name} Secondary ALB Health Check"
    Environment = var.environment
  }
}


resource "aws_route53_record" "primary" {
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"
  
  set_identifier = "primary"
  failover_routing_policy {
    type = "PRIMARY"
  }
  
  health_check_id = aws_route53_health_check.primary.id
  
  alias {
    name                   = var.primary_alb_dns_name
    zone_id                = var.primary_alb_zone_id
    evaluate_target_health = true
  }
}


resource "aws_route53_record" "secondary" {
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"
  
  set_identifier = "secondary"
  failover_routing_policy {
    type = "SECONDARY"
  }
  
  health_check_id = aws_route53_health_check.secondary.id
  
  alias {
    name                   = var.secondary_alb_dns_name
    zone_id                = var.secondary_alb_zone_id
    evaluate_target_health = true
  }
}