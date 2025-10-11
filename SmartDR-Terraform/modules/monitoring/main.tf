resource "aws_cloudwatch_dashboard" "main" {
  provider = aws.primary
  dashboard_name = "${var.project_name}-${var.environment}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.primary_alb_arn_suffix],
            [".", "TargetResponseTime", ".", "."],
            [".", "HTTPCode_Target_2XX_Count", ".", "."],
            [".", "HTTPCode_Target_5XX_Count", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.primary_region
          title   = "Primary ALB Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.secondary_alb_arn_suffix],
            [".", "TargetResponseTime", ".", "."],
            [".", "HTTPCode_Target_2XX_Count", ".", "."],
            [".", "HTTPCode_Target_5XX_Count", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.secondary_region
          title   = "Secondary ALB Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBClusterIdentifier", var.primary_db_cluster_id],
            [".", "DatabaseConnections", ".", "."],
            [".", "ReadLatency", ".", "."],
            [".", "WriteLatency", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.primary_region
          title   = "Primary Database Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBClusterIdentifier", var.secondary_db_cluster_id],
            [".", "DatabaseConnections", ".", "."],
            [".", "ReadLatency", ".", "."],
            [".", "WriteLatency", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.secondary_region
          title   = "Secondary Database Metrics"
          period  = 300
        }
      },
      {
        type   = "text"
        x      = 0
        y      = 12
        width  = 24
        height = 3

        properties = {
          markdown = "## ShopSmart Application Monitoring Dashboard\n\nThis dashboard provides monitoring for the ShopSmart application across both primary and secondary regions."
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "primary_alb_5xx" {
  provider = aws.primary
  alarm_name          = "${var.project_name}-primary-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors 5XX errors on the primary ALB"
  
  dimensions = {
    LoadBalancer = var.primary_alb_arn_suffix
  }
  

  alarm_actions = [var.failover_alerts_sns_topic_arn]
  ok_actions    = [var.failover_alerts_sns_topic_arn]
}

resource "aws_cloudwatch_metric_alarm" "secondary_alb_5xx" {
  provider = aws.primary
  alarm_name          = "${var.project_name}-secondary-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors 5XX errors on the secondary ALB"
  
  dimensions = {
    LoadBalancer = var.secondary_alb_arn_suffix
  }

  alarm_actions = [var.failover_alerts_sns_topic_arn]
  ok_actions    = [var.failover_alerts_sns_topic_arn]
}

resource "aws_cloudwatch_metric_alarm" "primary_db_cpu" {
  provider = aws.primary
  alarm_name          = "${var.project_name}-primary-db-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors CPU utilization on the primary database"
  
  dimensions = {
    DBClusterIdentifier = var.primary_db_cluster_id
  }
  

  alarm_actions = [var.failover_alerts_sns_topic_arn]
  ok_actions    = [var.failover_alerts_sns_topic_arn]
}

resource "aws_cloudwatch_metric_alarm" "secondary_db_cpu" {
  provider = aws.secondary
  alarm_name          = "${var.project_name}-secondary-db-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors CPU utilization on the secondary database"
  
  dimensions = {
    DBClusterIdentifier = var.secondary_db_cluster_id
  }
  

  alarm_actions = [var.failover_alerts_sns_topic_arn]
  ok_actions    = [var.failover_alerts_sns_topic_arn]
}