resource "aws_iam_role" "ec2" {
  provider = aws.primary
  name     = "${var.project_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "ec2" {
  provider = aws.primary
  name     = "${var.project_name}-ec2-policy"
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
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          var.primary_s3_bucket_arn,
          "${var.primary_s3_bucket_arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  provider   = aws.primary
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "ec2_policy" {
  provider   = aws.primary
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.ec2.arn
}

resource "aws_iam_instance_profile" "ec2" {
  provider = aws.primary
  name     = "${var.project_name}-ec2-profile"
  role     = aws_iam_role.ec2.name
}

data "template_file" "user_data" {
  template = file("${path.module}/user_data.sh")
  vars = {
    region          = var.region
    s3_bucket_name  = var.primary_bucket_name
    app_zip         = "react-app.zip"
  }
}

resource "aws_launch_template" "primary" {
  provider = aws.primary
  name     = "${var.project_name}-${var.environment}-primary-lt"
  
  image_id      = var.ami_id
  instance_type = var.instance_type
  
  # key_pair {
  #   key_name = var.key_name
  # }
  
  vpc_security_group_ids = [aws_security_group.web.id]
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }
  
  user_data = base64encode(data.template_file.user_data.rendered)
  
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.project_name}-primary-instance"
      Environment = var.environment
    }
  }
}

resource "aws_launch_template" "secondary" {
  provider = aws.secondary
  name     = "${var.project_name}-${var.environment}-secondary-lt"
  
  image_id      = var.secondary_ami_id
  instance_type = var.instance_type
  
  # key_pair {
  #   key_name = var.key_name
  # }
  
  vpc_security_group_ids = [aws_security_group.secondary_web.id]
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }
  
  user_data = base64encode(data.template_file.user_data.rendered)
  
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.project_name}-secondary-instance"
      Environment = var.environment
    }
  }
}