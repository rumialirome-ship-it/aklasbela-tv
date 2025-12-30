# 🎯 AKLASBELA-TV | Production Server Deployment Guide

Welcome to the official deployment documentation for the **AKLASBELA-TV Exchange Platform**. This guide is designed for Senior System Administrators to set up a high-performance, secure environment on an **Ubuntu 22.04 LTS** VPS.

---

## 🏗️ 1. Infrastructure Requirements
*   **Operating System**: Ubuntu 22.04 LTS (Recommended)
*   **Memory**: 1GB RAM (Minimum)
*   **Software Stack**: Node.js v18+, PM2, Nginx, SQLite3

---

## 🚀 2. Server Preparation

### **Update System & Install Essentials**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx sqlite3
```

### **Install Node.js (v20 LTS)**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### **Install PM2 (Global Process Manager)**
```bash
sudo npm install -g pm2
```

---

## 📥 3. Deployment & Installation

### **Clone the Repository**
```bash
cd /var/www/html
git clone https://github.com/YOUR_USERNAME/aklasbela-tv.git
cd aklasbela-tv
```

### **Initialize Backend & Database**
```bash
cd backend
npm install
# Initialize the SQLite database from db.json
node setup-database.js
cd ..
```

### **Build Frontend Application**
```bash
npm install
npm run build
```

---

## ⚙️ 4. Process Management (PM2)

Start the backend service and ensure it persists after reboots:
```bash
cd backend
pm2 start server.js --name "aklasbela-backend"
pm2 save
pm2 startup
```
*Note: The backend listens on port **3000** by default.*

---

## 🌐 5. Nginx Reverse Proxy Configuration

Configure Nginx to serve the frontend and proxy API requests to the Node.js backend.

1. Create config: `sudo nano /etc/nginx/sites-available/aklasbela`
2. Paste the following:
```nginx
server {
    listen 80;
    server_name yourdomain.com; # Replace with your domain

    root /var/www/html/aklasbela-tv/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
3. Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/aklasbela /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔄 6. Automated Updates (Sync)

We have provided a `sync.sh` script to automate your workflow. Whenever you push code to GitHub:
```bash
./sync.sh
```

### **Fixing ".sh" Errors**
If you see errors like `-bash: ./sync.sh: /bin/bash^M: bad interpreter` or `Permission Denied`:
1.  **Fix Line Endings (Windows Copy-Paste Issue)**:
    ```bash
    sudo apt install -y dos2unix
    dos2unix sync.sh
    ```
2.  **Fix Permissions**:
    ```bash
    chmod +x sync.sh
    ```
3.  **Run Again**:
    ```bash
    ./sync.sh
    ```

---

## 🛠️ 7. Maintenance Commands

| Action | Command |
| :--- | :--- |
| **Check Backend Logs** | `pm2 logs aklasbela-backend` |
| **Restart Backend** | `pm2 restart aklasbela-backend` |
| **Check Port 3000 Status** | `sudo fuser -k 3000/tcp` |
| **Nginx Error Logs** | `sudo tail -f /var/log/nginx/error.log` |
| **Database Check** | `sqlite3 backend/database.sqlite "PRAGMA integrity_check;"` |

---

**AKLASBELA-TV EXCHANGE NETWORK**  
*Strategic Command Terminal*