variable "bucket_name" {
  description = "Globally unique S3 bucket name for Bluehour audio files."
  type        = string
  default     = "bluehour-audio-231101980451"
}

variable "aws_region" {
  description = "AWS region for the S3 bucket. CloudFront is always global."
  type        = string
  default     = "us-west-2"
}
