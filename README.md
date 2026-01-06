# 🎯 AKLASBELA-TV | VPS FINAL RECOVERY GUIDE

If you see **500 Internal Server Error**, it is because Nginx is finding duplicate entries for your domain.

---

## 🛠️ 1. Fixing the Nginx Conflict

### Step A: Empty the corrupted file
Your `grep` showed 3 copies of the domain in one file. We must empty it first:
```bash
sudo truncate -s 0 /etc/nginx/sites-available/aklasbela-tv.com
```

### Step B: Paste the Clean Config
```bash
sudo nano /etc/nginx/sites-available/aklasbela-tv.com
```
**Paste this exact block:**
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

### Step C: Reload
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🚀 2. Deploying the App (Port 3005)

### Step 1: Build the UI
```bash
cd /var/www/html/aklasbela-tv
npm run build
```

### Step 2: Start Backend
```bash
cd backend
pm2 delete aklasbela-exchange || true
pm2 start ecosystem.config.js --env production
pm2 save
```

---

## 🔍 3. Verification
1. **Is it running?** `pm2 list`
2. **What's the port?** `sudo lsof -i :3005`
3. **Internal Test**: `curl http://localhost:3005/api/health`

---
**AKLASBELA-TV COMMAND**