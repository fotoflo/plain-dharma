#!/bin/bash

# Check ngrok status and get the current tunnel URL
echo "Checking ngrok status..."

# Check if ngrok is running
if pgrep -f "ngrok" > /dev/null; then
    echo "ngrok is running"

    # Try to get the tunnel URL from ngrok's web interface
    if curl -s http://127.0.0.1:4040/api/tunnels > /dev/null 2>&1; then
        echo ""
        echo "Current ngrok tunnels:"
        curl -s http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[] | "  \(.name): \(.public_url) -> \(.config.addr)"' 2>/dev/null || curl -s http://127.0.0.1:4040/api/tunnels
        echo ""
    else
        echo "ngrok web interface not accessible at http://127.0.0.1:4040"
        echo "Make sure ngrok is running with web interface enabled"
    fi
else
    echo "ngrok is not running"
    echo ""
    echo "Start it with:"
    echo "  pnpm ngrok          # Start tunnel to port 8008"
    echo "  pnpm dev:tunnel     # Start dev server + ngrok together"
fi
