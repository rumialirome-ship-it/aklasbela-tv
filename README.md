# 🎯 AKLASBELA-TV | Production Server Management

This platform is managed via standard Git and PM2 workflows. Automated synchronization scripts have been deprecated in favor of manual, secure protocol execution.

---

## 🏗️ 1. Infrastructure
*   **Backend**: Node.js/Express (Port 3000)
*   **Database**: SQLite3
*   **Process Manager**: PM2

---

## 🔄 2. Standard Update Protocol

To update the production server to the latest version from GitHub:

1. **Pull Latest Changes**:
   ```bash
   cd /var/www/html/aklasbela-tv
   git fetch --all
   git reset --hard origin/main
   ```

2. **Frontend Rebuild**:
   ```bash
   npm install
   npm run build
   ```

3. **Backend Update**:
   ```bash
   cd backend
   npm install
   pm2 restart aklasbela-backend
   ```

---

## 🛠️ 3. Maintenance Commands

| Action | Command |
| :--- | :--- |
| **Check Backend Status** | `pm2 list` |
| **View Live Logs** | `pm2 logs aklasbela-backend` |
| **Restart Application** | `pm2 restart aklasbela-backend` |
| **Reset Database** | `node backend/setup-database.js` *(CAUTION: Wipes all data)* |

---

## 🌐 4. Nginx Integration

Ensure your Nginx config proxies `/api` to `http://localhost:3000`.

```nginx
location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

**AKLASBELA-TV EXCHANGE NETWORK**  
*Strategic Command Terminal*