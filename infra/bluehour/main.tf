terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  # Uses your default AWS profile (~/.aws/credentials).
  # No credentials are hardcoded here.
}

# ── S3 Bucket ────────────────────────────────────────────────────────────────

resource "aws_s3_bucket" "audio" {
  bucket = var.bucket_name

  tags = {
    Project = "bluehour"
  }
}

# Keep a version history so you can roll back a bad upload.
resource "aws_s3_bucket_versioning" "audio" {
  bucket = aws_s3_bucket.audio.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Block every form of public access — only CloudFront (via OAC) can read.
resource "aws_s3_bucket_public_access_block" "audio" {
  bucket = aws_s3_bucket.audio.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ── CloudFront Origin Access Control (OAC) ───────────────────────────────────
# OAC is the modern replacement for Origin Access Identity (OAI).
# It signs every request from CloudFront to S3 using SigV4.

resource "aws_cloudfront_origin_access_control" "audio" {
  name                              = "bluehour-audio-oac"
  description                       = "OAC for Bluehour audio bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ── CloudFront Distribution ───────────────────────────────────────────────────

resource "aws_cloudfront_distribution" "audio" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "Bluehour ambient audio CDN"
  price_class     = "PriceClass_100" # US, Canada, Europe only — lowest cost

  origin {
    domain_name              = aws_s3_bucket.audio.bucket_regional_domain_name
    origin_id                = "bluehour-audio-s3"
    origin_access_control_id = aws_cloudfront_origin_access_control.audio.id
  }

  default_cache_behavior {
    target_origin_id       = "bluehour-audio-s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    # Audio files are immutable — cache aggressively.
    min_ttl     = 0
    default_ttl = 86400    # 1 day
    max_ttl     = 31536000 # 1 year
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Project = "bluehour"
  }
}

# ── Bucket Policy — allow only this CloudFront distribution to read ──────────

resource "aws_s3_bucket_policy" "audio" {
  bucket = aws_s3_bucket.audio.id

  # Must wait until public access block is applied, otherwise AWS rejects the policy.
  depends_on = [aws_s3_bucket_public_access_block.audio]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAC"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.audio.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.audio.arn
          }
        }
      }
    ]
  })
}
