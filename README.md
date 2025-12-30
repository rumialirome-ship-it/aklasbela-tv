# 🎯 AKLASBELA-TV | VPS Deployment Guide

This application is managed using standard Git and PM2 workflows. Automated sync scripts have been removed for stability.

---

## 🏗️ 1. Server Configuration
*   **Backend Port**: 3000 (Strict)
*   **Nginx Proxy**: Should target `http://127.0.0.1:3000`
*   **Database**: SQLite3 (`backend/database.sqlite`)

---

## 🔄 2. Normal Update Process

To update your VPS with the latest changes:

1.  **Pull latest code**:
    ```bash
    git fetch --all
    git reset --hard origin/main
    ```

2.  **Rebuild Frontend**:
    ```bash
    npm install
    npm run build
    ```

3.  **Restart Backend**:
    ```bash
    cd backend
    npm install
    pm2 restart aklasbela-backend
    ```

---

## 🛠️ 3. Troubleshooting Port 3000

If the backend fails to start because port 3000 is "in use":
```bash
# Kill any existing process on port 3000
fuser -k 3000/tcp

# Restart the app
pm2 restart aklasbela-backend
```
*Note: Port 3001 is reserved for your other website and is never touched by this app.*

---

## 🌐 4. Nginx Integration Example

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