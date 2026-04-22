#!/usr/bin/env bash
# upload-audio.sh — Upload Bluehour ambient audio files to S3.
#
# Usage:
#   ./upload-audio.sh                        # uses bucket name from terraform output
#   BUCKET=my-bucket-name ./upload-audio.sh  # override bucket name
#
# Requirements: aws CLI configured with your default profile.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AUDIO_DIR="$REPO_ROOT/public/audio"

# Resolve bucket name — prefer env override, fall back to terraform output.
if [ -z "${BUCKET:-}" ]; then
  echo "Reading bucket name from terraform output..."
  BUCKET=$(terraform -chdir="$SCRIPT_DIR" output -raw s3_bucket_name 2>/dev/null)
  if [ -z "$BUCKET" ]; then
    echo "ERROR: Could not read bucket name. Run 'terraform apply' first, or set BUCKET=<name>."
    exit 1
  fi
fi

echo "Uploading audio files to s3://$BUCKET/"
echo "Source: $AUDIO_DIR"
echo ""

# Upload every MP3 in public/audio/ with:
#   Content-Type: audio/mpeg   — tells browsers/CloudFront what the file is
#   Cache-Control: immutable   — these files don't change; CDN and browser cache forever
for file in "$AUDIO_DIR"/*.mp3; do
  filename=$(basename "$file")
  echo "  Uploading $filename..."
  aws s3 cp "$file" "s3://$BUCKET/$filename" \
    --content-type "audio/mpeg" \
    --cache-control "public, max-age=31536000, immutable" \
    --no-progress
done

echo ""
echo "Done. All audio files uploaded to s3://$BUCKET/"
echo ""
echo "Next: set NEXT_PUBLIC_AUDIO_CDN in Vercel (see README.md for the value)."
