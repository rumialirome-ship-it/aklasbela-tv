#!/bin/bash

# AKLASBELA-TV Production Sync Script
# COPY THIS CONTENT INTO A FILE NAMED sync.sh ON YOUR SERVER

# 1. Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' 

echo ">>> Starting Aklasbela-TV System Sync..."

# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# 2. Port Cleanup (Nuclear Option for EADDRINUSE)
echo ">>> Cleaning up zombie processes on ports 3000, 3001, 3002..."
sudo fuser -k 3000/tcp 3001/tcp 3002/tcp || true

# Pull latest changes from GitHub
echo ">>> Pulling code from GitHub..."
git fetch --all
git reset --hard origin/main

# Update dependencies and build frontend
echo ">>> Installing Frontend Dependencies & Building..."
npm install
npm run build

# Update backend dependencies
echo ">>> Updating Backend Dependencies..."
cd backend
npm install
cd ..

# Set permissions for database
echo ">>> Fixing Database Permissions..."
chmod 666 backend/database.sqlite 2>/dev/null || true

# Restart the service via PM2 (Clean Start)
echo ">>> Restarting PM2 Process..."
pm2 delete aklasbela-backend 2>/dev/null || true
cd backend
pm2 start server.js --name "aklasbela-backend"
cd ..

echo ">>> SYNC COMPLETE: System is live!"
