resource "aws_security_group" "web" {
  provider = aws.primary
  name     = "${var.project_name}-web-sg"
  vpc_id   = var.primary_vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name} Web SG"
    Environment = var.environment
  }
}

resource "aws_security_group" "alb" {
  provider = aws.primary
  name     = "${var.project_name}-alb-sg"
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
    Name        = "${var.project_name} ALB SG"
    Environment = var.environment
  }
}


resource "aws_security_group" "secondary_web" {
  provider = aws.secondary
  name     = "${var.project_name}-secondary-web-sg"
  vpc_id   = var.secondary_vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    security_groups = [aws_security_group.secondary_alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name} Secondary Web SG"
    Environment = var.environment
  }
}


resource "aws_security_group" "secondary_alb" {
  provider = aws.secondary
  name     = "${var.project_name}-secondary-alb-sg"
  vpc_id   = var.secondary_vpc_id

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
    Name        = "${var.project_name} Secondary ALB SG"
    Environment = var.environment
  }
}


resource "aws_lb" "primary" {
  provider = aws.primary
  name     = "${var.project_name}-${var.environment}-primary-alb"
  internal = false
  
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.primary_public_subnet_ids

  tags = {
    Environment = var.environment
  }
}


resource "aws_lb_target_group" "primary" {
  provider = aws.primary
  name     = "${var.project_name}-${var.environment}-primary-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.primary_vpc_id

  health_check {
    path = "/"
    port = "traffic-port"
  }
}


resource "aws_lb_listener" "primary" {
  provider = aws.primary
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }
}


resource "aws_autoscaling_group" "primary" {
  provider = aws.primary
  name     = "${var.project_name}-${var.environment}-primary-asg"
  
  vpc_zone_identifier = var.primary_private_subnet_ids
  target_group_arns   = [aws_lb_target_group.primary.arn]
  
  desired_capacity = var.primary_desired_capacity
  max_size         = var.primary_max_size
  min_size         = var.primary_min_size
  
  launch_template {
    id      = aws_launch_template.primary.id
    version = "$Latest"
  }
}


resource "aws_lb" "secondary" {
  provider = aws.secondary
  name     = "${var.project_name}-${var.environment}-secondary-alb"
  internal = false
  
  load_balancer_type = "application"
  security_groups    = [aws_security_group.secondary_alb.id]
  subnets            = var.secondary_public_subnet_ids

  tags = {
    Environment = var.environment
  }
}


resource "aws_lb_target_group" "secondary" {
  provider = aws.secondary
  name     = "${var.project_name}-${var.environment}-secondary-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.secondary_vpc_id

  health_check {
    path = "/"
    port = "traffic-port"
  }
}


resource "aws_lb_listener" "secondary" {
  provider = aws.secondary
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }
}

# Auto Scaling Group in secondary region (warm standby)
resource "aws_autoscaling_group" "secondary" {
  provider = aws.secondary
  name     = "${var.project_name}-${var.environment}-secondary-asg"
  
  vpc_zone_identifier = var.secondary_private_subnet_ids
  target_group_arns   = [aws_lb_target_group.secondary.arn]
  
  desired_capacity = var.secondary_desired_capacity
  max_size         = var.secondary_max_size
  min_size         = var.secondary_min_size
  
  launch_template {
    id      = aws_launch_template.secondary.id
    version = "$Latest"
  }
}