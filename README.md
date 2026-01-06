# 🎯 AKLASBELA-TV | VPS FINAL RECOVERY GUIDE

If you are seeing a **500 Internal Server Error**, Nginx is confused by duplicate configurations. Follow these steps exactly.

---

## 📊 1. Your Server Port Map
- **Port 3001**: Site B (Do not change)
- **Port 5000**: Site C (Do not change)
- **Port 3005**: **AKLASBELA-TV (This App)** ⬅️

---

## 🛠️ 2. Fix the Nginx 500 Error

### Step A: Delete the Ghost Link
Your Nginx is still trying to load a link to a file that doesn't exist.
```bash
sudo rm /etc/nginx/sites-enabled/api-DDL-2
```

### Step B: Reset the Config File
The `grep` command showed you have 3 copies of your domain in one file. Let's fix it.
```bash
sudo nano /etc/nginx/sites-available/aklasbela-tv.com
```
**Delete everything inside and paste ONLY this:**
```nginx
server {
    listen 80;
    server_name aklasbela-tv.com www.aklasbela-tv.com;
    # Redirect all HTTP to HTTPS
    return 301 https://aklasbela-tv.com$request_uri;
}

server {
    listen 443 ssl;
    server_name aklasbela-tv.com www.aklasbela-tv.com;

    ssl_certificate /etc/letsencrypt/live/aklasbela-tv.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aklasbela-tv.com/privkey.pem;

    # Fix for Nginx 500: Ensure valid root even for proxy
    root /var/www/html/aklasbela-tv/dist;

    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Step C: Apply Changes
```bash
sudo nginx -t
# It MUST say "syntax is ok" and "test is successful".
# If it doesn't, check for duplicates: sudo grep -r "aklasbela-tv.com" /etc/nginx/sites-enabled/

sudo systemctl restart nginx
```

---

## 🚀 3. Start the Application

### Step 1: Kill old processes
```bash
pm2 delete aklasbela-exchange || true
```

### Step 2: Build the UI (Critical)
If you skip this, the backend will return a 500 error.
```bash
cd /var/www/html/aklasbela-tv
npm install
npm run build
```

### Step 3: Run Backend
```bash
cd backend
npm install
# Initialize DB if first time: node setup-database.js
pm2 start ecosystem.config.js --env production
pm2 save
```

---

## 🔍 4. Verification
1. **App Health**: `https://aklasbela-tv.com/api/health` (Should return JSON with port 3005)
2. **Logs**: `pm2 logs aklasbela-exchange`

---
**AKLASBELA-TV STRATEGIC COMMAND**