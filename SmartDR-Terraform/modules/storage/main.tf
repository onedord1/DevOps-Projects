resource "aws_s3_bucket" "primary" {
  provider = aws.primary
  bucket   = "${var.project_name}-${var.environment}-primary-${random_id.bucket_suffix.hex}"
  force_destroy = true
  tags = {
    Name        = "${var.project_name} Primary Bucket"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket" "secondary" {
  provider = aws.secondary
  bucket   = "${var.project_name}-${var.environment}-secondary-${random_id.bucket_suffix.hex}"
  force_destroy = true
  tags = {
    Name        = "${var.project_name} Secondary Bucket"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}