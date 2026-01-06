# 🎯 AKLASBELA-TV | VPS Deployment Guide

This application consists of two parts: the **Frontend** (Root) and the **Backend** (backend folder).

---

## 🚀 1. Unique Port Deployment (Multiple Apps)

Since you have other PM2 apps running, this app is configured to use **Port 3005**.

### Step 1: Clean start
```bash
# Delete the old process if it exists
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

## 🌐 2. Update Nginx (CRITICAL)

If you are using Nginx to serve your domain (e.g., aklasbela-tv.com), you **must** update the Nginx configuration file.

1. Open your Nginx config:
   `sudo nano /etc/nginx/sites-available/default` (or your specific config file)

2. Find the `location /` or `location /api` block and change the port:
   ```nginx
   location / {
       proxy_pass http://localhost:3005; # WAS 3000, MUST BE 3005
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
   }
   ```

3. Test and restart Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## 🔍 3. Troubleshooting Multi-App VPS

### Check what ports are used:
```bash
netstat -tuln | grep LISTEN
```

### Find the PID of an app on a port:
```bash
lsof -i :3005
```

### View all PM2 apps:
```bash
pm2 list
```

---

**AKLASBELA-TV EXCHANGE NETWORK**