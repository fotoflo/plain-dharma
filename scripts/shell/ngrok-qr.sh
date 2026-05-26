#!/bin/bash

# Print the current ngrok URL as a QR code (great for opening on your phone).
#
# Usage: pnpm run ngrok:qr

# Get current ngrok URL
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$NGROK_URL" ]; then
    echo "No ngrok tunnel running."
    echo ""
    echo "Start one first:"
    echo "  pnpm ngrok"
    exit 1
fi

echo ""
echo "ngrok URL: $NGROK_URL"
echo ""

if command -v qrencode &> /dev/null; then
    qrencode -t ANSIUTF8 "$NGROK_URL"
    echo ""
    echo "Scan with your phone camera to open."
else
    echo "(Install qrencode for an inline QR code: brew install qrencode)"
fi
