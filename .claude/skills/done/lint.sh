#!/bin/bash
# lint.sh — Phase 2: run ESLint and report
# Usage: lint.sh

echo "=== Running ESLint ==="
pnpm lint 2>&1
EXIT_CODE=$?

echo ""
echo "=== Lint Exit Code: $EXIT_CODE ==="
exit $EXIT_CODE
