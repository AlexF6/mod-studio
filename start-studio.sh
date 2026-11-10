#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Starting ModCraft Studio..."
if [ -f "$DIR/backend/server.py" ]; then
    python3 "$DIR/backend/server.py" "$@"
elif [ -f "$DIR/mod-studio/backend/server.py" ]; then
    python3 "$DIR/mod-studio/backend/server.py" "$@"
fi

