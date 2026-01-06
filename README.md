# 🎯 AKLASBELA-TV | VPS Deployment Guide

This application consists of two parts: the **Frontend** (Root) and the **Backend** (backend folder).

---

## 📊 1. VPS Port Inventory (DO NOT CONFLICT)
Keep this list updated to avoid overlapping ports on your server:
- **Port 3001**: Site B (Running)
- **Port 5000**: Site C (Running)
- **Port 3005**: **AKLASBELA-TV (This App)** ⬅️

---

## 🛠️ 2. Nginx Conflict Resolution (CRITICAL)
Your `nginx -t` shows a conflict because `aklasbela-tv.com` is declared multiple times. 

### Step A: Clean old links
Remove the symlink for the site you deleted:
```bash
sudo rm /etc/nginx/sites-enabled/api-DDL-2
```

### Step B: Replace with this Clean Config
Open your config: `sudo nano /etc/nginx/sites-available/aklasbela-tv.com`
Delete everything and paste this (it handles redirection and proxying to 3005):

```nginx
server {
    listen 80;
    server_name aklasbela-tv.com www.aklasbela-tv.com;
    return 301 https://aklasbela-tv.com$request_uri;
}

server {
    listen 443 ssl;
    server_name aklasbela-tv.com www.aklasbela-tv.com;

    ssl_certificate /etc/letsencrypt/live/aklasbela-tv.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aklasbela-tv.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step C: Test and Reload
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🚀 3. Application Deployment

### Step 1: Clean start
```bash
pm2 delete aklasbela-exchange || true
```

### Step 2: Build & Start
```bash
# In Root
npm run build

# In Backend
cd backend
pm2 start ecosystem.config.js --env production
pm2 save
```

---

## 🔍 4. Verification
- **Health Check**: `https://aklasbela-tv.com/api/health`
- **Port Check**: `sudo lsof -i :3005`
- **Logs**: `pm2 logs aklasbela-exchange`

---
**AKLASBELA-TV EXCHANGE NETWORK**