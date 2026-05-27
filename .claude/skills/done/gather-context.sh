#!/bin/bash
# gather-context.sh — Phase 0: collect session context
# Usage: gather-context.sh

echo "=== Git Diff Stats ==="
git diff --stat

echo ""
echo "=== Staged Diff Stats ==="
git diff --cached --stat

echo ""
echo "=== Architecture Docs ==="
ls docs/architecture/ 2>/dev/null || echo "(none)"

echo ""
echo "=== Bug Fix Docs ==="
ls docs/bug-fixes/ 2>/dev/null || echo "(none)"

echo ""
echo "=== Uncommitted Files ==="
git status --short
