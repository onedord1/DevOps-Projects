resource "aws_iam_role" "lambda" {
  provider = aws.primary
  name     = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "lambda" {
  provider = aws.primary
  name     = "${var.project_name}-lambda-policy"
  policy   = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeGlobalClusters",
          "rds:FailoverGlobalCluster",
          "rds:CreateDBInstance",
          "rds:DeleteDBInstance",
          "rds:ModifyDBInstance",
          "autoscaling:SetDesiredCapacity",
          "autoscaling:DescribeAutoScalingGroups",
          "route53:ChangeResourceRecordSets",
          "route53:GetHealthCheckStatus",
          "sns:Publish"
        ]
        Resource = "*"
      }
    ]
  })
}


resource "aws_iam_role_policy_attachment" "lambda" {
  provider   = aws.primary
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.lambda.arn
}

resource "aws_lambda_function" "failover" {
  provider = aws.primary
  function_name = "${var.project_name}-failover"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  
  filename         = "failover.zip"
  source_code_hash = data.archive_file.failover.output_base64sha256
  
  timeout = 300
  
  environment {
    variables = {
      PRIMARY_REGION          = var.primary_region
      SECONDARY_REGION        = var.secondary_region
      PRIMARY_CLUSTER_ID      = var.primary_cluster_id
      SECONDARY_CLUSTER_ID    = var.secondary_cluster_id
      PRIMARY_ASG_NAME        = var.primary_asg_name
      SECONDARY_ASG_NAME      = var.secondary_asg_name
      SECONDARY_DESIRED_SIZE  = var.secondary_desired_size
      DOMAIN_NAME             = var.domain_name
      HOSTED_ZONE_ID          = var.hosted_zone_id
      SNS_TOPIC_ARN           = var.sns_topic_arn
    }
  }
  
  tags = {
    Name        = "${var.project_name} Failover Lambda"
    Environment = var.environment
  }
}

resource "aws_lambda_function" "failback" {
  provider = aws.primary
  function_name = "${var.project_name}-failback"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "python3.11"
  
  filename         = "failback.zip"
  source_code_hash = data.archive_file.failback.output_base64sha256
  
  timeout = 300
  
  environment {
    variables = {
      PRIMARY_REGION          = var.primary_region
      SECONDARY_REGION        = var.secondary_region
      PRIMARY_CLUSTER_ID      = var.primary_cluster_id
      SECONDARY_CLUSTER_ID    = var.secondary_cluster_id
      PRIMARY_ASG_NAME        = var.primary_asg_name
      SECONDARY_ASG_NAME      = var.secondary_asg_name
      PRIMARY_DESIRED_SIZE    = var.primary_desired_size
      SECONDARY_DESIRED_SIZE  = var.secondary_desired_size
      DOMAIN_NAME             = var.domain_name
      HOSTED_ZONE_ID          = var.hosted_zone_id
      SNS_TOPIC_ARN           = var.sns_topic_arn
    }
  }
  
  tags = {
    Name        = "${var.project_name} Failback Lambda"
    Environment = var.environment
  }
}

resource "aws_api_gateway_rest_api" "failover" {
  provider = aws.primary
  name        = "${var.project_name}-failover-api"
  description = "API for triggering failover and failback"
}

resource "aws_api_gateway_resource" "failover" {
  provider = aws.primary
  rest_api_id = aws_api_gateway_rest_api.failover.id
  parent_id   = aws_api_gateway_rest_api.failover.root_resource_id
  path_part   = "failover"
}

resource "aws_api_gateway_resource" "failback" {
  provider = aws.primary
  rest_api_id = aws_api_gateway_rest_api.failover.id
  parent_id   = aws_api_gateway_rest_api.failover.root_resource_id
  path_part   = "failback"
}

resource "aws_api_gateway_method" "failover" {
  provider = aws.primary
  rest_api_id   = aws_api_gateway_rest_api.failover.id
  resource_id   = aws_api_gateway_resource.failover.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "failback" {
  provider = aws.primary
  rest_api_id   = aws_api_gateway_rest_api.failover.id
  resource_id   = aws_api_gateway_resource.failback.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "failover" {
  provider = aws.primary
  rest_api_id = aws_api_gateway_rest_api.failover.id
  resource_id = aws_api_gateway_resource.failover.id
  http_method = aws_api_gateway_method.failover.http_method
  
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.failover.invoke_arn
}

resource "aws_api_gateway_integration" "failback" {
  provider = aws.primary
  rest_api_id = aws_api_gateway_rest_api.failover.id
  resource_id = aws_api_gateway_resource.failback.id
  http_method = aws_api_gateway_method.failback.http_method
  
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.failback.invoke_arn
}

resource "aws_api_gateway_deployment" "failover" {
  provider = aws.primary
  rest_api_id = aws_api_gateway_rest_api.failover.id
  
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.failover.id,
      aws_api_gateway_resource.failback.id,
      aws_api_gateway_method.failover.id,
      aws_api_gateway_method.failback.id,
      aws_api_gateway_integration.failover.id,
      aws_api_gateway_integration.failback.id
    ]))
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "failover" {
  provider = aws.primary
  deployment_id = aws_api_gateway_deployment.failover.id
  rest_api_id   = aws_api_gateway_rest_api.failover.id
  stage_name    = "prod"
}

resource "aws_lambda_permission" "failover" {
  provider = aws.primary
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover.function_name
  principal     = "apigateway.amazonaws.com"
  
  source_arn = "${aws_api_gateway_rest_api.failover.execution_arn}/*/*"
}

resource "aws_lambda_permission" "failback" {
  provider = aws.primary
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failback.function_name
  principal     = "apigateway.amazonaws.com"
  
  source_arn = "${aws_api_gateway_rest_api.failover.execution_arn}/*/*"
}


resource "aws_lb" "failover_control" {
  provider = aws.primary
  name     = "${var.project_name}-failover-control-alb"
  internal = false
  
  load_balancer_type = "application"
  security_groups    = [aws_security_group.failover_control.id]
  subnets            = var.primary_public_subnet_ids

  tags = {
    Environment = var.environment
  }
}

resource "aws_security_group" "failover_control" {
  provider = aws.primary
  name     = "${var.project_name}-failover-control-sg"
  vpc_id   = var.primary_vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name} Failover Control SG"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "failover_control" {
  provider = aws.primary
  name     = "${var.project_name}-failover-control-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.primary_vpc_id

  health_check {
    path = "/"
    port = "traffic-port"
  }
}

resource "aws_lb_listener" "failover_control" {
  provider = aws.primary
  load_balancer_arn = aws_lb.failover_control.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"
    
    fixed_response {
      content_type = "text/html"
      message_body = "<html><head><title>ShopSmart Failover Control</title></head><body><h1>ShopSmart Failover Control</h1><p>Use the API Gateway to trigger failover/failback operations.</p></body></html>"
      status_code  = "200"
    }
  }
}

resource "aws_route53_record" "failover_control" {
  provider = aws.primary
  zone_id = var.hosted_zone_id
  name    = "failover.${var.domain_name}"
  type    = "A"
  
  alias {
    name                   = aws_lb.failover_control.dns_name
    zone_id                = aws_lb.failover_control.zone_id
    evaluate_target_health = true
  }
}

data "archive_file" "failover" {
  type        = "zip"
  source_file = "${path.module}/lambda/failover.py"
  output_path = "${path.module}/failover.zip"
}

data "archive_file" "failback" {
  type        = "zip"
  source_file = "${path.module}/lambda/failback.py"
  output_path = "${path.module}/failback.zip"
}