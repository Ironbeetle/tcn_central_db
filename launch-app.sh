#!/bin/bash
# TCN Member Database Launcher Script
# Launches the Next.js development server

APP_DIR="/home/tcn_technician/TCN_Member_DB/tcn_central_db"
APP_NAME="TCN Member Database"

cd "$APP_DIR" || { echo "Failed to change to app directory"; exit 1; }

echo "========================================"
echo "  $APP_NAME"
echo "========================================"
echo ""
echo "Starting development server..."
echo "App will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

npm run dev
