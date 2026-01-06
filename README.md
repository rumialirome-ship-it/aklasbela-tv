# 🎯 AKLASBELA-TV | VPS Deployment Guide

This application consists of two parts: the **Frontend** (Root) and the **Backend** (backend folder).

---

## 🚀 1. Unique Port Deployment (Multiple Apps)

Since you have other PM2 apps running, this app is configured to use **Port 3005**.

### Step 1: Clean start
```bash
# Delete the old process if it exists
pm2 delete aklasbela-backend
pm2 delete aklasbela-exchange
```

### Step 2: Build (In Root)
```bash
cd /var/www/html/aklasbela-tv
npm run build
```

### Step 3: Start (In Backend)
```bash
cd backend
pm2 start ecosystem.config.js
```

---

## 🔍 2. Troubleshooting Multi-App VPS

If you still get a 500 error, another app might be using Port 3005.

### Check what ports are used:
```bash
# List all processes using ports
netstat -tuln | grep LISTEN
```

### Find the PID of an app on a port:
```bash
# Replace 3005 with the port you want to check
lsof -i :3005
```

### View all PM2 apps:
```bash
pm2 list
```

---

**AKLASBELA-TV EXCHANGE NETWORK**