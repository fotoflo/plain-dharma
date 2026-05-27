#!/bin/bash

# Start ngrok tunnel to Next.js dev server (port 8008).
#
# Usage: pnpm run ngrok

set -e

# Load env (optional — no required vars for plain-dharma). Guard each source
# with an existence check so bash 3.2 + `set -e` doesn't trip on missing files.
set -a
[ -f .env.local ] && source .env.local
[ -f .env ]       && source .env
set +a

PORT="${1:-8008}"

# Locate ngrok binary — prefer system (typically newer, supports current config
# format), fall back to project-local npm dev dep for fresh checkouts.
if command -v ngrok &> /dev/null; then
    NGROK_BIN="ngrok"
elif [ -x "./node_modules/.bin/ngrok" ]; then
    NGROK_BIN="./node_modules/.bin/ngrok"
else
    echo "ngrok not found. Install one:"
    echo "  brew install ngrok        (system, recommended)"
    echo "  or: pnpm add -D ngrok     (project-local, already declared but may not be installed)"
    echo "Then: $NGROK_BIN config add-authtoken YOUR_TOKEN"
    exit 1
fi

# Kill any existing ngrok
pkill -f "ngrok http" 2>/dev/null || true
sleep 1

echo "Starting ngrok tunnel to localhost:${PORT}..."
"$NGROK_BIN" http "$PORT" --log stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

# Fast-fail: tunnel should be ready instantly after auth. Poll for 500ms total.
# If it's slower than that, something's actually broken — show the log.
for i in {1..5}; do
    NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$NGROK_URL" ]; then
        break
    fi
    sleep 0.1
done

if [ -z "$NGROK_URL" ]; then
    echo "Failed to get ngrok URL within 500ms."
    echo "--- ngrok log (/tmp/ngrok.log) ---"
    tail -20 /tmp/ngrok.log 2>/dev/null || echo "(no log file)"
    echo "--- end log ---"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

echo ""
echo "================================================================"
echo "  ngrok tunnel ready"
echo "================================================================"
echo "  URL:  $NGROK_URL"
echo "  ->    localhost:${PORT}"
echo ""

# Auto-print QR code if qrencode is available so phones can scan immediately
if command -v qrencode &> /dev/null; then
    qrencode -t ANSIUTF8 "$NGROK_URL"
    echo ""
    echo "  Scan with your phone camera."
else
    echo "  Install qrencode for an inline QR code: brew install qrencode"
fi
echo "================================================================"
echo ""
echo "Press Ctrl+C to stop ngrok"

# Trap Ctrl+C to kill ngrok cleanly
cleanup() {
    echo ""
    echo "Stopping ngrok..."
    kill $NGROK_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Keep running (show ngrok logs)
wait $NGROK_PID
