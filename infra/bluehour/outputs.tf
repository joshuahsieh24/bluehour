output "cloudfront_domain" {
  description = "CloudFront domain to use as NEXT_PUBLIC_AUDIO_CDN in Vercel."
  value       = "https://${aws_cloudfront_distribution.audio.domain_name}"
}

output "s3_bucket_name" {
  description = "S3 bucket name — needed for the upload script."
  value       = aws_s3_bucket.audio.id
}

output "cloudfront_distribution_id" {
  description = "Distribution ID — needed if you ever want to run a cache invalidation."
  value       = aws_cloudfront_distribution.audio.id
}
