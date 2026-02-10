#!/bin/bash
# ============================================
# TCN Member Database - Stop Script
# ============================================

PORT=4001
PID_FILE="/home/tcn_technician/TCN_Member_DB/tcn_central_db/app.pid"

echo "🛑 Stopping TCN Member Database..."

# Kill by PID file if exists
if [ -f "$PID_FILE" ]; then
    kill $(cat "$PID_FILE") 2>/dev/null
    rm "$PID_FILE"
fi

# Kill any remaining processes on the port
lsof -ti:$PORT | xargs kill -9 2>/dev/null

sleep 1

if lsof -i:$PORT >/dev/null 2>&1; then
    echo "❌ Failed to stop server"
    exit 1
else
    echo "✅ Server stopped successfully"
fi
