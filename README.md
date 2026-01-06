# 🎯 AKLASBELA-TV | VPS Deployment Guide

This application consists of two parts: the **Frontend** (Root) and the **Backend** (backend folder).

---

## 📊 1. VPS Port Inventory (DO NOT CONFLICT)
Keep this list updated to avoid overlapping ports on your server:
- **Port 3001**: Site B (Important)
- **Port 5000**: Site C (Important)
- **Port 3005**: **AKLASBELA-TV (This App)** ⬅️

---

## 🚀 2. Deployment Steps

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
pm2 start ecosystem.config.js --env production
pm2 save
```

---

## 🌐 3. Update Nginx (CRITICAL)

Ensure the file `/etc/nginx/sites-available/aklasbela-tv.com` contains:
```nginx
location / {
    proxy_pass http://localhost:3005; # Points to the Node app on 3005
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### 🛠️ Troubleshooting "Conflicting Server Name"
If `nginx -t` reports a conflict for `aklasbela-tv.com`:
1. Run: `sudo grep -r "aklasbela-tv.com" /etc/nginx/`
2. Look for any file OTHER than `sites-available/aklasbela-tv.com` that has that domain name.
3. Edit or remove the conflicting file.
4. Run: `sudo nginx -t && sudo systemctl restart nginx`

---

## 🔍 4. Verification

1. **Check Backend Health**: 
   Open `https://aklasbela-tv.com/api/health` in your browser.
   It should return: `{"status":"UP","port":3005,"pid":...}`

2. **Check Logs**:
   `pm2 logs aklasbela-exchange`

---

**AKLASBELA-TV EXCHANGE NETWORK**