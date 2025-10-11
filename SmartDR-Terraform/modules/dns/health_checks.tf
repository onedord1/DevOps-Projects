resource "aws_cloudwatch_metric_alarm" "primary_health_sns" {
  provider = aws.primary
  alarm_name          = "${var.project_name}-primary-alb-health-sns-alert" 
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "This metric monitors the health of the primary ALB and sends SNS alerts on failure."
  
  dimensions = {
    HealthCheckId = aws_route53_health_check.primary.id
  }
  
  alarm_actions = [aws_sns_topic.failover_alerts.arn]
  ok_actions    = [aws_sns_topic.failover_alerts.arn]
}


resource "aws_cloudwatch_metric_alarm" "secondary_health_sns" {
  provider = aws.primary
  alarm_name          = "${var.project_name}-secondary-alb-health-sns-alert"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "This metric monitors the health of the secondary ALB and sends SNS alerts on failure."
  
  dimensions = {
    HealthCheckId = aws_route53_health_check.secondary.id
  }
  
  alarm_actions = [aws_sns_topic.failover_alerts.arn]
  ok_actions    = [aws_sns_topic.failover_alerts.arn]
}

resource "aws_sns_topic" "failover_alerts" {
  provider = aws.primary
  name     = "${var.project_name}-failover-alerts"
  
  tags = {
    Name        = "${var.project_name} Failover Alerts"
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "email" {
  provider = aws.primary
  topic_arn = aws_sns_topic.failover_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}