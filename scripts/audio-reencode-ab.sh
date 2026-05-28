#!/usr/bin/env bash
# THROWAWAY experiment — NOT wired into any build.
# Re-encodes one narration mp3 to a few lighter settings so you can A/B quality
# vs. size before deciding whether to change the audio pipeline. Requires ffmpeg.
#
# Usage: scripts/audio-reencode-ab.sh [source.mp3] [outDir]
#   defaults: public/audio/en/first-talk/01-opening.mp3  ->  /tmp/pd-audio-ab
set -euo pipefail

SRC="${1:-public/audio/en/first-talk/01-opening.mp3}"
OUT="${2:-/tmp/pd-audio-ab}"
mkdir -p "$OUT"
base="$(basename "${SRC%.mp3}")"

filesize() { stat -f%z "$1" 2>/dev/null || stat -c%s "$1"; }

echo "source: $SRC"
ffprobe -v error -show_entries stream=sample_rate,channels,bit_rate \
  -show_entries format=size,duration -of default=noprint_wrappers=1 "$SRC" || true
echo "  bytes: $(filesize "$SRC")"

encode() { # rate bitrate label
  local out="$OUT/${base}.${3}.mp3"
  ffmpeg -y -loglevel error -i "$SRC" -ac 1 -ar "$1" -b:a "$2" "$out"
  printf "  %-12s %-12s -> %s bytes\n" "$3" "${1}Hz/${2}" "$(filesize "$out")"
}

echo "variants (all mono):"
encode 24000 48k 24k-48k   # safe: transparent for speech
encode 24000 40k 24k-40k   # lean
encode 22050 32k 22k-32k   # audiobook-low

echo ""
echo "A/B in $OUT — listen back-to-back against the source:"
ls -1 "$OUT"/*.mp3
