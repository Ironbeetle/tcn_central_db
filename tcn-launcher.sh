#!/bin/bash
# ============================================
# TCN Member Database - Easy Launcher
# Double-click this script or use desktop icon
# ============================================

APP_DIR="/home/tcn_technician/TCN_Member_DB/tcn_central_db"
APP_NAME="TCN Member Database"
PORT=4001
URL="http://localhost:$PORT"
LOG_FILE="$APP_DIR/app.log"
PID_FILE="$APP_DIR/app.pid"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear
echo -e "${BLUE}========================================"
echo -e "  🏛️  $APP_NAME"
echo -e "========================================${NC}"
echo ""

cd "$APP_DIR" || {
    echo -e "${RED}❌ Error: Cannot find app directory${NC}"
    echo "Press Enter to close..."
    read
    exit 1
}

# Function to check if server is running
check_server() {
    if lsof -i:$PORT >/dev/null 2>&1; then
        return 0  # Server is running
    else
        return 1  # Server is not running
    fi
}

# Function to wait for server with visual feedback
wait_for_server() {
    local max_attempts=30
    local attempt=0
    echo -ne "${YELLOW}⏳ Starting server"
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null | grep -q "200\|304\|302"; then
            echo -e "${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
        ((attempt++))
    done
    echo -e "${NC}"
    return 1
}

# Check if server is already running
if check_server; then
    echo -e "${GREEN}✅ Server is already running!${NC}"
    echo ""
    echo -e "${BLUE}Opening browser...${NC}"
    xdg-open "$URL" 2>/dev/null &
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  App is ready at: $URL${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Press Enter to close this window (app will keep running)..."
    read
    exit 0
fi

# Kill any zombie processes on the port
echo -e "${YELLOW}🔄 Preparing to start...${NC}"
lsof -ti:$PORT | xargs kill -9 2>/dev/null
sleep 1

# Start the server
echo -e "${YELLOW}🚀 Starting $APP_NAME...${NC}"
echo ""

# Start server in background
nohup npm run dev > "$LOG_FILE" 2>&1 &
echo $! > "$PID_FILE"

# Wait for server to be ready
if wait_for_server; then
    echo -e "${GREEN}✅ Server started successfully!${NC}"
    echo ""
    
    # Open browser automatically
    echo -e "${BLUE}🌐 Opening browser...${NC}"
    sleep 1
    xdg-open "$URL" 2>/dev/null &
    
    echo ""
    echo -e "${GREEN}========================================"
    echo -e "  ✅ $APP_NAME is now running!"
    echo -e "========================================"
    echo -e "  📍 Address: $URL"
    echo -e "  📋 Log file: $LOG_FILE"
    echo -e "========================================${NC}"
    echo ""
    echo -e "${YELLOW}Note: The app runs in the background.${NC}"
    echo -e "${YELLOW}To stop it, run: ./stop-app.sh${NC}"
    echo ""
    echo "Press Enter to close this window (app will keep running)..."
    read
else
    echo -e "${RED}❌ Server failed to start${NC}"
    echo ""
    echo "Check the log file for errors:"
    echo "  $LOG_FILE"
    echo ""
    echo "Last 10 lines of log:"
    tail -10 "$LOG_FILE" 2>/dev/null
    echo ""
    echo "Press Enter to close..."
    read
    exit 1
fi
