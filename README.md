# Aklasbela-TV - Production Deployment Guide

This guide provides instructions to deploy the Aklasbela-TV platform on Ubuntu 22.04 using Nginx, PM2, and SQLite.

---

### **Step 1: File Structure**
Ensure your project is located at: `/var/www/html/aklasbela-tv`

### **Step 2: Frontend Build (CRITICAL)**
Nginx serves the `dist` folder. You must generate it:
```bash
cd /var/www/html/aklasbela-tv
npm install
npm run build
```
*Note: If `dist` is missing, Nginx will throw a "Redirection Cycle" error.*

### **Step 3: Backend Setup**
```bash
cd /var/www/html/aklasbela-tv/backend
npm install
# Ensure .env has PORT=3002
pm2 restart aklasbela-backend || pm2 start server.js --name aklasbela-backend
```

### **Step 4: Nginx Configuration**
Edit your config: `sudo nano /etc/nginx/sites-available/aklasbela.tv`

```nginx
server {
    listen 80;
    server_name aklasbela-tv.com www.aklasbela-tv.com;

    # Use LOWERCASE path to match server folders
    root /var/www/html/aklasbela-tv/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **Step 5: Permissions**
Nginx needs permission to read your files:
```bash
sudo chown -R www-data:www-data /var/www/html/aklasbela-tv
sudo chmod -R 755 /var/www/html/aklasbela-tv
sudo systemctl restart nginx
```