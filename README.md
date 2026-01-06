# 🎯 AKLASBELA-TV | VPS Deployment Guide

This application is optimized for manual VPS deployment using PM2.

---

## 🏗️ 1. Environment Info
*   **Target Port**: 3000
*   **Process Name**: `aklasbela-backend`
*   **Other Sites**: Safe (Port 3001 and others remain untouched)

---

## 🚀 2. How to Update / Deploy

Follow these steps when you upload new code to the VPS:

### Step 1: Build the Interface
```bash
# In the project root folder
npm install
npm run build
```

### Step 2: Prepare Backend
```bash
cd backend
npm install
# Note: If database.sqlite is missing, run: node setup-database.js
```

### Step 3: Manage with PM2
```bash
# To start fresh
pm2 start ecosystem.config.js

# To reload changes
pm2 reload aklasbela-backend

# To check if it is running correctly
pm2 logs aklasbela-backend
```

---

## 🛠️ 3. Troubleshooting "500 Error"

If you see a 500 error, ensure the `dist` folder exists in the project root. The backend serves your website from that folder. If `dist` is empty or missing, run `npm run build` again.

---

**AKLASBELA-TV EXCHANGE NETWORK**