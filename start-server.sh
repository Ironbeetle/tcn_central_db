#!/bin/bash

# Robust server startup script
# This prevents the "zombie server" issue by properly managing the process

echo "🔄 Stopping any existing processes on port 4001..."

# Kill any existing processes on port 4001
lsof -ti:4001 | xargs kill -9 2>/dev/null || echo "No existing processes found"

# Wait a moment for processes to fully terminate
sleep 2

# Verify port is free
if lsof -i:4001 >/dev/null 2>&1; then
    echo "❌ Port 4001 is still in use. Please manually stop the process."
    exit 1
fi

echo "✅ Port 4001 is free"

# Start the server with proper process management
echo "🚀 Starting Next.js server on port 4001..."

# Use nohup to prevent terminal interference and log output
nohup npm run dev > server.log 2>&1 &

# Store the process ID
echo $! > server.pid

echo "📝 Server PID: $(cat server.pid)"
echo "📋 Log file: server.log"

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test if server is responding
if curl -m 5 -s "http://localhost:4001" > /dev/null 2>&1; then
    echo "✅ Server is running and responding on http://localhost:4001"
    echo "🔍 To monitor logs: tail -f server.log"
    echo "🛑 To stop server: kill \$(cat server.pid)"
else
    echo "❌ Server failed to start or is not responding"
    echo "📋 Check server.log for details"
    exit 1
fi