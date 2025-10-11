
resource "aws_iam_role" "replication" {
  provider = aws.primary
  name     = "${var.project_name}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })
}


resource "aws_iam_policy" "replication" {
  provider = aws.primary
  name     = "${var.project_name}-s3-replication-policy"
  policy   = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = [aws_s3_bucket.primary.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersion",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = ["${aws_s3_bucket.primary.arn}/*"]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = ["${aws_s3_bucket.secondary.arn}/*"]
      }
    ]
  })
}


resource "aws_iam_role_policy_attachment" "replication" {
  provider   = aws.primary
  role       = aws_iam_role.replication.name
  policy_arn = aws_iam_policy.replication.arn
}


resource "aws_s3_bucket_replication_configuration" "this" {
  provider = aws.primary
  role     = aws_iam_role.replication.arn
  bucket   = aws_s3_bucket.primary.id

  rule {
    id     = "replicate-all"
    status = "Enabled"
    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD"
    }
  }

  depends_on = [aws_iam_role_policy_attachment.replication, aws_s3_bucket_versioning.primary]
}