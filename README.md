# Aklasbela-TV - Production Deployment Guide

This guide provides the professional method to connect and sync your Ubuntu 22.04 server with GitHub.

---

### **1. Professional Connection (SSH Deploy Keys)**
Avoid password prompts and connection timeouts by using an SSH Key:

1.  **Generate Key**: `ssh-keygen -t ed25519 -C "server@aklasbela-tv.com"` (Press Enter for all prompts).
2.  **Get Key**: `cat ~/.ssh/id_ed25519.pub`
3.  **Add to GitHub**: 
    - Go to your GitHub Repo -> **Settings** -> **Deploy Keys**.
    - Click **Add deploy key**, paste the key, and give it a title like "Production Server".
4.  **Switch to SSH**: 
    ```bash
    git remote set-url origin git@github.com:YOUR_USERNAME/aklasbela-tv.git
    ```

---

### **2. Automated Sync (One-Command)**
To update your site to the latest version on GitHub, simply run:
```bash
cd /var/www/html/aklasbela-tv && ./sync.sh
```
*This script fixes permissions, pulls code, builds the UI, and restarts the backend.*

---

### **3. Manual Troubleshooting**

#### **Port Conflict (EADDRINUSE)**
If port 3000 is stuck:
```bash
sudo fuser -k 3000/tcp
pm2 restart aklasbela-backend
```

#### **Database Health**
If you suspect database issues, check the SQLite integrity:
```bash
sqlite3 backend/database.sqlite "PRAGMA integrity_check;"
```

#### **Logs**
- **Live Logs**: `pm2 logs aklasbela-backend`
- **Nginx Errors**: `sudo tail -f /var/log/nginx/error.log`

---

### **4. Maintenance Commands**
- **Restart Everything**: `pm2 restart all && sudo systemctl restart nginx`
- **View Status**: `pm2 status`
- **Reset Git Status**: `git reset --hard origin/main`
