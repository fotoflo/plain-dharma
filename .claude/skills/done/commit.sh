#!/bin/bash
# commit.sh — Phase 5: stage and commit
# Usage: commit.sh "commit message" [file1 file2 ...]
# First argument is the commit message, remaining are files to stage

if [ $# -lt 1 ]; then
  echo "Usage: commit.sh \"commit message\" [file1 file2 ...]"
  exit 1
fi

MESSAGE="$1"
shift

echo "=== Staging Files ==="
if [ $# -gt 0 ]; then
  for f in "$@"; do
    if [ -e "$f" ]; then
      git add "$f"
      echo "  staged: $f"
    fi
  done
else
  echo "No files specified to stage"
  exit 1
fi

echo ""
echo "=== Committing ==="
git commit -m "$MESSAGE"
EXIT_CODE=$?

echo ""
echo "=== Post-Commit Status ==="
git status --short

exit $EXIT_CODE
