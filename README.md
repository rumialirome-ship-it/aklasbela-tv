# 🎯 AKLASBELA-TV | VPS Deployment Guide

This application consists of two parts: the **Frontend** (Root) and the **Backend** (backend folder).

---

## 🏗️ 1. Build & Deploy Instructions

Follow these steps exactly to avoid "Missing script" or "500" errors.

### Step 1: Build the Interface (MUST BE IN ROOT)
```bash
# Go to the main project folder
cd /var/www/html/aklasbela-tv

# Install and build the frontend
npm install
npm run build
```
*Note: This creates the `dist` folder which contains your website.*

### Step 2: Prepare Backend
```bash
# Go into the backend folder
cd /var/www/html/aklasbela-tv/backend

# Install backend dependencies
npm install

# If you haven't setup the database yet:
node setup-database.js
```

### Step 3: Start with PM2
```bash
# From inside the backend folder
pm2 start ecosystem.config.js

# To see logs and check for errors
pm2 logs aklasbela-backend
```

---

## 🛠️ 2. Troubleshooting "500 Internal Server Error"

If the website shows a 500 error:
1.  **Check for 'dist'**: Ensure the folder `/var/www/html/aklasbela-tv/dist` exists and contains `index.html`.
2.  **Check PM2 Logs**: Run `pm2 logs aklasbela-backend`. It will now print the exact path it is using to look for your files.

---

**AKLASBELA-TV EXCHANGE NETWORK**