#EKS Auto policies
resource "aws_iam_role" "cluster" {
  name = "${var.cluster_name}-eks-cluster-role"

  assume_role_policy = data.aws_iam_policy_document.cluster_role_assume_role_policy.json
}

resource "aws_iam_role_policy_attachments_exclusive" "cluster" {
  role_name = aws_iam_role.cluster.name
  policy_arns = [
    "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy",
    "arn:aws:iam::aws:policy/AmazonEKSComputePolicy",
    "arn:aws:iam::aws:policy/AmazonEKSBlockStoragePolicy",
    "arn:aws:iam::aws:policy/AmazonEKSLoadBalancingPolicy",
    "arn:aws:iam::aws:policy/AmazonEKSNetworkingPolicy",
    "arn:aws:iam::aws:policy/AmazonEKSServicePolicy",
    "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  ]
}

data "aws_iam_policy_document" "cluster_role_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole", "sts:TagSession"]

    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "node" {
  name = "${var.cluster_name}-eks-cluster-node"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = ["sts:AssumeRole"]
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "node_AmazonEKSWorkerNodeMinimalPolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodeMinimalPolicy"
  role       = aws_iam_role.node.name
}

resource "aws_iam_role_policy_attachment" "node_AmazonEC2ContainerRegistryPullOnly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPullOnly"
  role       = aws_iam_role.node.name
}

# S3 access policies for EKS nodes
resource "aws_iam_policy" "eks_s3_access" {
  name        = "${var.cluster_name}-eks-s3-access"
  description = "Policy for EKS nodes to access S3 buckets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.cluster_name}-velero-backups",
          "arn:aws:s3:::${var.cluster_name}-velero-backups/*",
          "arn:aws:s3:::${var.cluster_name}-alb-logs",
          "arn:aws:s3:::${var.cluster_name}-alb-logs/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eks_s3_access" {
  policy_arn = aws_iam_policy.eks_s3_access.arn
  role       = aws_iam_role.node.name
}

# RDS access policy for EKS nodes
resource "aws_iam_policy" "eks_rds_access" {
  name        = "${var.cluster_name}-eks-rds-access"
  description = "Policy for EKS nodes to access RDS"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds-db:connect"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eks_rds_access" {
  policy_arn = aws_iam_policy.eks_rds_access.arn
  role       = aws_iam_role.node.name
}

# CloudWatch access policy for EKS nodes
resource "aws_iam_policy" "eks_cloudwatch_access" {
  name        = "${var.cluster_name}-eks-cloudwatch-access"
  description = "Policy for EKS nodes to access CloudWatch"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams",
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cloudwatch_access" {
  policy_arn = aws_iam_policy.eks_cloudwatch_access.arn
  role       = aws_iam_role.node.name
}