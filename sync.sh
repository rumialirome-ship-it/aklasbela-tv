# TO USE THIS FILE:
# 1. Run: nano sync.sh
# 2. Paste this content
# 3. Run: chmod +x sync.sh
# 4. Run: ./sync.sh

#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"
sudo fuser -k 3000/tcp 3001/tcp 3002/tcp || true
git fetch --all
git reset --hard origin/main
npm install
npm run build
cd backend
npm install
cd ..
chmod 666 backend/database.sqlite 2>/dev/null || true
pm2 delete aklasbela-backend 2>/dev/null || true
cd backend
pm2 start server.js --name "aklasbela-backend"
cd ..
echo "SYNC COMPLETE"
