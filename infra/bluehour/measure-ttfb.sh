#!/usr/bin/env bash
# measure-ttfb.sh — Measure Time To First Byte from the CloudFront distribution.
#
# Usage:
#   ./measure-ttfb.sh
#
# Requires: curl, terraform output (run after `terraform apply` and upload)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Read CloudFront domain from terraform output
CF_DOMAIN=$(terraform -chdir="$SCRIPT_DIR" output -raw cloudfront_domain 2>/dev/null)
if [ -z "$CF_DOMAIN" ]; then
  echo "ERROR: Could not read cloudfront_domain. Run 'terraform apply' first."
  exit 1
fi

# Files to measure — covers a range of sizes
FILES=(
  "chimeending.mp3"
  "pianoroom.mp3"
  "citywindow.mp3"
  "hogwart.mp3"
  "loficafe.mp3"
)

echo "Measuring TTFB from CloudFront: $CF_DOMAIN"
echo "Each file is fetched once (cold) then once (warm/cached)."
echo ""
printf "%-22s  %10s  %10s\n" "File" "Cold (s)" "Warm (s)"
printf "%-22s  %10s  %10s\n" "----" "--------" "--------"

declare -a WARM_TIMES

for file in "${FILES[@]}"; do
  URL="$CF_DOMAIN/$file"

  # Cold request — bypass cache with unique query param
  COLD=$(curl -o /dev/null -s -w "%{time_starttransfer}" \
    --max-time 15 \
    "${URL}?nocache=$(date +%s%N)" 2>/dev/null || echo "ERR")

  # Warm request — file should now be at the edge
  WARM=$(curl -o /dev/null -s -w "%{time_starttransfer}" \
    --max-time 15 \
    "$URL" 2>/dev/null || echo "ERR")

  printf "%-22s  %10s  %10s\n" "$file" "$COLD" "$WARM"

  if [ "$WARM" != "ERR" ]; then
    WARM_TIMES+=("$WARM")
  fi
done

echo ""

# Compute median of warm TTFBs using Python (awk's asort is not available on macOS)
if [ ${#WARM_TIMES[@]} -gt 0 ]; then
  MEDIAN=$(printf '%s\n' "${WARM_TIMES[@]}" | \
    python3 -c "
import sys, statistics
vals = [float(x) for x in sys.stdin.read().split()]
m = statistics.median(vals)
print(f'{m:.3f}')
")
  MS=$(python3 -c "print(round(${MEDIAN}*1000))")
  echo "Median warm TTFB: ${MEDIAN}s (${MS}ms)"
  echo ""
  echo "Resume-ready: \"CloudFront-backed audio CDN — median TTFB ${MS}ms (PriceClass_100, us-west-2 origin, OAC-signed S3)\""
else
  echo "Could not compute median — check that audio files are uploaded."
fi
