#!/bin/bash
# file-sizes.sh — Phase 3: scan source files and build size distribution
# Usage: file-sizes.sh

echo "=== File Size Distribution ==="

# Find all source files, excluding noise directories
FILES=$(find src public docs .claude -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.js' -o -name '*.jsx' -o -name '*.css' -o -name '*.md' -o -name '*.json' \) 2>/dev/null | grep -v node_modules | grep -v .next | grep -v '/blog/')

TOTAL=0
OVER_500=0
LARGEST_SIZE=0
LARGEST_FILE=""

# Buckets
B_50=0; B_150=0; B_300=0; B_500=0; B_1000=0; B_2000=0; B_INF=0

while IFS= read -r f; do
  [ -z "$f" ] && continue
  LINES=$(wc -l < "$f" 2>/dev/null | tr -d ' ')
  [ -z "$LINES" ] && continue
  TOTAL=$((TOTAL + 1))

  if (( LINES <= 50 )); then B_50=$((B_50 + 1))
  elif (( LINES <= 150 )); then B_150=$((B_150 + 1))
  elif (( LINES <= 300 )); then B_300=$((B_300 + 1))
  elif (( LINES <= 500 )); then B_500=$((B_500 + 1))
  elif (( LINES <= 1000 )); then B_1000=$((B_1000 + 1)); OVER_500=$((OVER_500 + 1))
  elif (( LINES <= 2000 )); then B_2000=$((B_2000 + 1)); OVER_500=$((OVER_500 + 1))
  else B_INF=$((B_INF + 1)); OVER_500=$((OVER_500 + 1))
  fi

  if (( LINES > LARGEST_SIZE )); then
    LARGEST_SIZE=$LINES
    LARGEST_FILE=$f
  fi
done <<< "$FILES"

printf "%-12s %s\n" "<=50" "$B_50"
printf "%-12s %s\n" "51-150" "$B_150"
printf "%-12s %s\n" "151-300" "$B_300"
printf "%-12s %s\n" "301-500" "$B_500"
printf "%-12s %s\n" "501-1000" "$B_1000"
printf "%-12s %s\n" "1001-2000" "$B_2000"
printf "%-12s %s\n" "2000+" "$B_INF"
echo ""
echo "Total files: $TOTAL"
echo "Over 500 lines: $OVER_500"
echo "Largest: $LARGEST_FILE ($LARGEST_SIZE lines)"
