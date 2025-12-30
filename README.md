# Aklasbela-TV - Production Deployment Guide

This comprehensive guide provides step-by-step instructions to deploy the Aklasbela-TV full-stack application on a fresh Ubuntu 22.04 server.

We will use:
-   **Vite** to build the frontend into optimized static assets.
-   **SQLite** as the SQL database engine.
-   **Nginx** as a reverse proxy to serve the frontend and route API requests.
-   **PM2** as a process manager to keep the Node.js backend running continuously.
-   **Certbot (Let's Encrypt)** to secure the application with a free SSL certificate (HTTPS).

---

### **Prerequisites**

1.  **Ubuntu 22.04 Server**: A clean installation of Ubuntu 22.04.
2.  **Domain Name**: A domain (`aklasbela-tv.com`) with its DNS 'A' record pointing to your server's public IP address.
3.  **SSH Access**: You must be able to connect to your server via SSH.

---

### **Step 1: Initial Server Setup**

1.  **Update System Packages**:
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

2.  **Configure Firewall (UFW)**:
    ```bash
    sudo ufw allow OpenSSH
    sudo ufw allow 'Nginx Full'
    sudo ufw enable
    ```

3.  **Install Node.js with NVM**:
    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 18
    nvm use 18
    ```

---

### **Step 2: Upload Application Files**

1.  **Create Project Directory**:
    ```bash
    sudo mkdir -p /var/www/html/Aklasbela-TV
    sudo chown -R $USER:$USER /var/www/html/Aklasbela-TV
    ```

2.  **Upload Files**:
    Ensure the project root files (index.html, package.json, src/, etc.) are in `/var/www/html/Aklasbela-TV/`.

---

### **Step 3: Frontend Setup & Build**

**CRITICAL:** To avoid "Redirection Cycle" errors, you must ensure the `dist` folder is correctly generated and accessible.

1.  **Navigate to the Project Directory**:
    ```bash
    cd /var/www/html/Aklasbela-TV
    ```

2.  **Install Frontend Dependencies**:
    ```bash
    npm install
    ```

3.  **Build the Frontend**:
    ```bash
    npm run build
    ```
    This creates the `/var/www/html/Aklasbela-TV/dist` folder. **Verify its existence:**
    ```bash
    ls -la /var/www/html/Aklasbela-TV/dist
    ```
    It should contain `index.html` and an `assets/` folder.

---

### **Step 4: Backend Setup with PM2**

1.  **Navigate to the Backend Directory**:
    ```bash
    cd /var/www/html/Aklasbela-TV/backend
    npm install
    ```
    
2.  **Setup Database**:
    ```bash
    sudo apt update && sudo apt install sqlite3 -y
    npm run db:setup
    ```

3.  **Create Environment File (`.env`)**:
    ```bash
    nano .env
    ```
    Add content:
    ```
    PORT=3002
    JWT_SECRET=your_strong_secret
    API_KEY=your_gemini_api_key
    ```

4.  **Start with PM2**:
    ```bash
    sudo npm install pm2 -g
    pm2 start server.js --name aklasbela-backend
    pm2 save
    pm2 startup
    ```

---

### **Step 5: Nginx Configuration**

1.  **Create Config**:
    ```bash
    sudo nano /etc/nginx/sites-available/aklasbela.tv
    ```

2.  **Configuration Content**:
    ```nginx
    server {
        listen 80;
        server_name aklasbela-tv.com www.aklasbela-tv.com;

        # The 'root' must point to the 'dist' folder created by 'npm run build'
        root /var/www/html/Aklasbela-TV/dist;
        index index.html;

        location / {
            # This handles SPA routing and prevents 404s/redirection cycles
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

3.  **Permissions Fix**:
    ```bash
    sudo chown -R www-data:www-data /var/www/html/Aklasbela-TV
    sudo chmod -R 755 /var/www/html/Aklasbela-TV
    ```

4.  **Enable and Restart**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/aklasbela.tv /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

---

### **Step 6: SSL Security**

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d aklasbela-tv.com -d www.aklasbela-tv.com
```