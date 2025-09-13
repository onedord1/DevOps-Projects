terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Create WAF WebACL for rate limiting
resource "aws_wafv2_web_acl" "this" {
  name        = "${var.environment}-employee-management-waf"
  description = "WAF for employee management application with rate limiting"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # Custom response body for rate limit exceeded
  custom_response_body {
    key     = "rate-limit-exceeded"
    content = jsonencode({
      error = "Rate limit exceeded. Please try again later."
      code  = 429
    })
    content_type = "APPLICATION_JSON"
  }

  # Global rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {
        custom_response {
          custom_response_body_key = "rate-limit-exceeded"
          response_code           = 429
        }
      }
    }

    statement {
      rate_based_statement {
        limit              = var.global_rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # API-specific rate limiting rule
  rule {
    name     = "APIRateLimitRule"
    priority = 2

    action {
      block {
        custom_response {
          custom_response_body_key = "rate-limit-exceeded"
          response_code           = 429
        }
      }
    }

    statement {
      rate_based_statement {
        limit              = var.api_rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "APIRateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # Authentication endpoints rate limiting rule
  rule {
    name     = "AuthRateLimitRule"
    priority = 3

    action {
      block {
        custom_response {
          custom_response_body_key = "rate-limit-exceeded"
          response_code           = 429
        }
      }
    }

    statement {
      rate_based_statement {
        limit              = var.auth_rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AuthRateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.environment}-employee-management-waf"
    sampled_requests_enabled   = true
  }

  tags = {
    Name        = "${var.environment}-employee-management-waf"
    Environment = var.environment
  }
}

# CloudWatch Metric Alarm for WAF rate limiting
resource "aws_cloudwatch_metric_alarm" "waf_rate_limit_alarm" {
  alarm_name          = "${var.environment}-waf-rate-limit-exceeded"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "CountedRequests"
  namespace           = "AWS/WAFV2"
  period             = "300"
  statistic          = "Sum"
  threshold          = var.alarm_threshold
  alarm_description  = "WAF rate limiting has been triggered frequently"

  dimensions = {
    WebACL = aws_wafv2_web_acl.this.name
    Rule   = "RateLimitRule"
  }

  alarm_actions = var.alarm_actions
}

# SNS Topic for alerts (if enabled)
resource "aws_sns_topic" "waf_alerts" {
  count = var.create_sns_topic ? 1 : 0
  name  = "${var.environment}-waf-alerts"
}