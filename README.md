# 🎯 AKLASBELA-TV | Standard VPS Management Guide

This guide provides the industry-standard "Manual Solution" for running the AKLASBELA-TV exchange on a VPS using PM2.

---

## 🏗️ 1. Environment Details
*   **Backend Port**: 3000 (Strictly enforced)
*   **Database**: SQLite3 (`backend/database.sqlite`)
*   **Manager**: PM2 with `ecosystem.config.js`

---

## 🚀 2. Deployment (The New Solution)

Instead of using sync scripts, follow these standard steps:

1.  **Pull Latest Updates**:
    ```bash
    git pull origin main
    ```

2.  **Build Frontend**:
    ```bash
    npm install
    npm run build
    ```

3.  **Start/Reload Backend**:
    ```bash
    cd backend
    npm install
    # Start for the first time
    pm2 start ecosystem.config.js
    # OR Reload after changes
    pm2 reload aklasbela-backend
    ```

---

## 🛠️ 3. Handling Conflicts (Port 3000 Only)

If PM2 fails because Port 3000 is "busy", run this command to clear **only** this app's space:
```bash
fuser -k 3000/tcp
pm2 reload aklasbela-backend
```
*Note: This command will not affect your website running on Port 3001.*

---

## 🌐 4. Nginx Reverse Proxy Config

Point your domain to the internal Port 3000:
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