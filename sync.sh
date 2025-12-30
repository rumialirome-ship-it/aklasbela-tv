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

# Restart the service via PM2
echo ">>> Restarting PM2 Process..."
pm2 restart aklasbela-backend || pm2 start backend/server.js --name "aklasbela-backend"

echo ">>> SYNC COMPLETE: System is live!"
