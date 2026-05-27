#!/bin/bash
# session-stats.sh — compute session productivity stats
# Usage: session-stats.sh file1 file2 file3 ...
# Pass the list of session files as arguments

if [ $# -eq 0 ]; then
  echo "Usage: session-stats.sh <file1> [file2] ..."
  exit 1
fi

echo "=== Session File Stats ==="

# Modification timestamps for session duration
TIMESTAMPS=""
for f in "$@"; do
  if [ -f "$f" ]; then
    TS=$(stat -f "%m" "$f" 2>/dev/null)
    if [ -n "$TS" ]; then
      TIMESTAMPS="$TIMESTAMPS $TS"
    fi
  fi
done

if [ -n "$TIMESTAMPS" ]; then
  EARLIEST=$(echo $TIMESTAMPS | tr ' ' '\n' | sort -n | head -1)
  LATEST=$(echo $TIMESTAMPS | tr ' ' '\n' | sort -n | tail -1)
  DURATION=$((LATEST - EARLIEST))
  MINS=$((DURATION / 60))
  HOURS=$((MINS / 60))
  REMAINING_MINS=$((MINS % 60))

  FIRST_TIME=$(date -r "$EARLIEST" "+%I:%M%p" 2>/dev/null)
  LAST_TIME=$(date -r "$LATEST" "+%I:%M%p" 2>/dev/null)

  if (( HOURS > 0 )); then
    echo "Session duration: ${HOURS}h ${REMAINING_MINS}m (${FIRST_TIME} -> ${LAST_TIME})"
  else
    echo "Session duration: ${MINS}m (${FIRST_TIME} -> ${LAST_TIME})"
  fi
fi

# Count files
MODIFIED=0
CREATED=0
for f in "$@"; do
  if [ -f "$f" ]; then
    # Check if file is new (untracked or added)
    if git ls-files --error-unmatch "$f" > /dev/null 2>&1; then
      MODIFIED=$((MODIFIED + 1))
    else
      CREATED=$((CREATED + 1))
    fi
  fi
done
echo "Files modified: $MODIFIED"
echo "Files created: $CREATED"

# Line changes for session files
echo ""
echo "=== Line Changes ==="
ADDED=0
REMOVED=0
for f in "$@"; do
  if [ -f "$f" ]; then
    DIFF=$(git diff --numstat -- "$f" 2>/dev/null)
    if [ -n "$DIFF" ]; then
      A=$(echo "$DIFF" | awk '{print $1}')
      R=$(echo "$DIFF" | awk '{print $2}')
      [ "$A" != "-" ] && ADDED=$((ADDED + A))
      [ "$R" != "-" ] && REMOVED=$((REMOVED + R))
    fi
    # Also check staged
    DIFF=$(git diff --cached --numstat -- "$f" 2>/dev/null)
    if [ -n "$DIFF" ]; then
      A=$(echo "$DIFF" | awk '{print $1}')
      R=$(echo "$DIFF" | awk '{print $2}')
      [ "$A" != "-" ] && ADDED=$((ADDED + A))
      [ "$R" != "-" ] && REMOVED=$((REMOVED + R))
    fi
  fi
done
echo "Lines: +$ADDED / -$REMOVED"
