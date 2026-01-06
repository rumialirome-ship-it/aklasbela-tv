# 🎯 AKLASBELA-TV | VPS Deployment Guide

This app is designed for simple, manual deployment. All automated sync scripts have been removed for maximum stability.

---

## 🏗️ 1. Environment Requirements
*   **Port**: 3000 (Strictly enforced for backend and frontend).
*   **Node.js**: v18 or v20+ recommended.
*   **Database**: SQLite3 (automatically handled).

---

## 🚀 2. Step-by-Step Manual Deployment

Follow these 3 steps to get the app running:

### Step 1: Prepare the Code
```bash
# Pull latest code
git pull origin main

# Install root dependencies and build the interface
npm install
npm run build
```

### Step 2: Prepare the Backend
```bash
cd backend
# Install backend dependencies
npm install

# Initialize the database (ONLY RUN ONCE OR WHEN DATA IS RESET)
# WARNING: This will overwrite existing data if database.sqlite exists.
node setup-database.js
```

### Step 3: Start with PM2
```bash
# Start the process using the config file
pm2 start ecosystem.config.js

# To see logs if there is an error:
pm2 logs aklasbela-backend
```

---

## 🛠️ 3. Fix "500 Internal Server Error"

If you get a 500 error at the root URL, it usually means the `dist` folder is missing or PM2 is stuck.
1. Run `npm run build` in the project root.
2. Run `fuser -k 3000/tcp` to clear the port.
3. Run `pm2 reload aklasbela-backend`.

---

## 🌐 4. Nginx Reverse Proxy (Optional)

Nginx should simply point everything to Port 3000:
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

**AKLASBELA-TV EXCHANGE NETWORK**