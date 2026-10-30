#!/bin/zsh
# Scene video pipeline — turns source clips into the delivery encodes under
# public/scenes/v2 plus a poster frame per scene.
#
#   scripts/encode-scenes.sh <source-dir> [output-dir]
#
# Delivery targets (chosen for a full-screen *background* under a 35% dim):
#   - ≤1440p (4K sources step down; 1080p sources stay 1080p)
#   - 30 fps, H.264 High, CRF 20, 2s GOP, no audio track
#   - faststart so playback begins before the file finishes downloading
#   - poster: first frame as 1280w WebP (paints before the first video frame)
#
# Requires ffmpeg (libx264) and cwebp. Add new scenes to SPECS as name:height.
set -euo pipefail

SRC="${1:?source dir with <name>.mp4 files}"
OUT="${2:-$(dirname "$0")/../public/scenes/v2}"
mkdir -p "$OUT"

SPECS=(charlie-snoopy:1440 hogwarts:1440 lofi-cafe:1080 nightstudy:1080 ylia:1080)

for spec in "${SPECS[@]}"; do
  n=${spec%%:*}; h=${spec##*:}
  [[ -f "$SRC/$n.mp4" ]] || { echo "skip $n (no source)"; continue; }
  lvl=4.1; [[ $h == 1440 ]] && lvl=5.1
  ffmpeg -y -hide_banner -loglevel error -i "$SRC/$n.mp4" -an \
    -vf "scale=-2:${h}:flags=lanczos,fps=30,format=yuv420p" \
    -c:v libx264 -preset slow -crf 20 -profile:v high -level "$lvl" \
    -g 60 -keyint_min 60 -sc_threshold 0 -bf 2 \
    -movflags +faststart "$OUT/$n.mp4"
  ffmpeg -y -hide_banner -loglevel error -i "$OUT/$n.mp4" -frames:v 1 -vf "scale=1280:-2" "$OUT/$n.png"
  cwebp -quiet -q 78 "$OUT/$n.png" -o "$OUT/$n.webp"
  rm -f "$OUT/$n.png"
  echo "$n → $(du -h "$OUT/$n.mp4" | cut -f1) video, $(du -h "$OUT/$n.webp" | cut -f1) poster"
done
