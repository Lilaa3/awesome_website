#!/bin/bash
# serve.sh - Start a local HTTP server for the website

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

# Default port
PORT="${1:-8000}"

# Check if port is already in use
if lsof -i ":$PORT" >/dev/null 2>&1; then
    echo "Port $PORT is already in use. Kill existing server? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        lsof -ti ":$PORT" | xargs kill -9 2>/dev/null
        sleep 0.5
    else
        echo "Exiting."
        exit 1
    fi
fi

echo "Starting server at http://localhost:$PORT"
echo "Press Ctrl+C to stop"
python3 -m http.server "$PORT"