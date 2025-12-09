#!/bin/bash

# Stop server script
echo "🛑 Stopping Next.js server..."

if [ -f server.pid ]; then
    PID=$(cat server.pid)
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID"
        echo "✅ Server process $PID stopped"
        rm server.pid
    else
        echo "❌ Process $PID not found"
        rm server.pid
    fi
else
    echo "❌ No server.pid file found"
fi

# Also kill any processes on port 4001 as backup
lsof -ti:4001 | xargs kill -9 2>/dev/null && echo "🧹 Cleaned up remaining processes on port 4001"

echo "✅ Server cleanup complete"