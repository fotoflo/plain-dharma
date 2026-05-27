#!/bin/bash
# tests.sh — Phase 4: run test suite
# Usage: tests.sh

echo "=== Running Tests ==="
pnpm test 2>&1
EXIT_CODE=$?

echo ""
echo "=== Test Exit Code: $EXIT_CODE ==="
exit $EXIT_CODE
