
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
2.  **Domain Name**: A domain (`aklasbela.tv`) with its DNS 'A' record pointing to your server's public IP address.
3.  **SSH Access**: You must be able to connect to your server via SSH.

---

### **Step 1: Initial Server Setup**

First, connect to your server via SSH and perform these initial configuration steps.

1.  **Update System Packages**:
    Ensure your server's package list and installed packages are up-to-date.
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

2.  **Configure Firewall (UFW)**:
    We'll set up a basic firewall to allow only essential traffic (SSH, HTTP, and HTTPS).
    ```bash
    sudo ufw allow OpenSSH
    sudo ufw allow 'Nginx Full'
    sudo ufw enable
    ```
    When prompted, type `y` and press Enter to proceed.

3.  **Install Node.js with NVM**:
    Using Node Version Manager (nvm) is recommended as it allows you to manage multiple Node.js versions easily.
    ```bash
    # Download and run the nvm installation script
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

    # Source your shell configuration to start using nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

    # Install Node.js version 18 (LTS) and set it as the default
    nvm install 18
    nvm use 18
    nvm alias default 18
    ```
    Verify the installation: `node -v` should show a version like `v18.x.x`.

---

### **Step 2: Upload Application Files**

Next, we'll create the necessary directory and upload your application code from your local machine to the server.

1.  **Create Project Directory on the Server**:
    We will host the entire application in `/var/www/html/Aklasbela-TV`.
    ```bash
    # Create the main project directory
    sudo mkdir -p /var/www/html/Aklasbela-TV

    # Set the current user as the owner of this directory
    # This allows you to upload files without needing sudo.
    sudo chown -R $USER:$USER /var/www/html/Aklasbela-TV
    ```

2.  **Upload Files from Local Machine**:
    Open a **new terminal on your local computer**. Use `scp` (secure copy) to transfer all your project files and folders (including the `backend` directory) into the server directory.

    ```bash
    # Replace /path/to/your/local/project/* with the actual path on your computer.
    # The '*' ensures the contents of the directory are copied.
    # Replace your_server_ip with your server's IP address.
    scp -r /path/to/your/local/project/* your_username@your_server_ip:/var/www/html/Aklasbela-TV/
    ```
    After this step, your server's `/var/www/html/Aklasbela-TV/` directory should contain your `index.html`, `package.json`, the `backend/` folder, and all other project files.

---

### **Step 3: Frontend Setup & Build**

Before setting up the backend, we need to install the frontend dependencies and create a production-ready build.

1.  **Navigate to the Project Directory**:
    ```bash
    cd /var/www/html/Aklasbela-TV
    ```

2.  **Install Frontend Dependencies**:
    This command reads the root `package.json` file and installs libraries like React and Vite.
    ```bash
    npm install
    ```

3.  **Build the Frontend**:
    This script compiles the React/TypeScript application into static HTML, CSS, and JavaScript files inside a `dist` directory.
    ```bash
    npm run build
    ```
    After this step, you will have a new `/var/www/html/Aklasbela-TV/dist` folder containing the optimized frontend assets.

---

### **Step 4: Backend Setup with PM2**

Now, let's configure and launch the Node.js backend application.

1.  **Navigate to the Backend Directory on the Server**:
    ```bash
    cd /var/www/html/Aklasbela-TV/backend
    ```

2.  **Install Dependencies**:
    This reads `package.json` and installs the required libraries (Express, JWT, etc.).
    ```bash
    npm install
    ```
    
3.  **Install SQLite and Setup Database**:
    The application uses SQLite for its database.
    ```bash
    # Install the SQLite command-line tool
    sudo apt update && sudo apt install sqlite3 -y

    # Run the database setup script
    # This reads the initial data from db.json, creates a database.sqlite file,
    # and populates it with the necessary tables and data.
    npm run db:setup
    ```
    > **Note**: This setup script is designed to run only once. If you need to reset the database, you must first delete the `backend/database.sqlite` file. You can now safely remove `backend/db.json`.


4.  **Create Environment File (`.env`)**:
    This file stores your application's secrets.
    ```bash
    nano .env
    ```
    Add the following content. **It is critical to generate a strong, unique secret for `JWT_SECRET`**. You can use an online generator or a command like `openssl rand -base64 32`.
    ```
    PORT=3001
    JWT_SECRET=your_super_secret_and_long_jwt_key_here
    API_KEY=your_google_gemini_api_key_here
    ```
    
    Save and close the file (`Ctrl+X`, then `Y`, then `Enter`).

5.  **Install PM2 Globally**:
    PM2 is the process manager that will keep your backend running.
    ```bash
    sudo npm install pm2 -g
    ```

6.  **Start the Backend with PM2**:
    This command starts the server, names the process `aklasbela-backend`, and will restart it automatically if it crashes.
    ```bash
    pm2 start server.js --name aklasbela-backend
    ```

7.  **Configure PM2 to Start on Boot**:
    This ensures that if your server reboots, your application will automatically restart.
    ```bash
    pm2 startup
    ```
    Run the command that PM2 gives you (it will start with `sudo env...`).

8.  **Save the Process List**:
    ```bash
    pm2 save
    ```
    You can check the status of your backend anytime with `pm2 status`.

---

### **Step 5: Nginx Configuration (Reverse Proxy)**

Nginx will act as the web server. It will serve your built frontend files and forward API requests (`/api/...`) to your backend.

1.  **Install Nginx**:
    ```bash
    sudo apt install nginx -y
    ```

2.  **Create an Nginx Configuration File**:
    ```bash
    sudo nano /etc/nginx/sites-available/aklasbela.tv
    ```

3.  **Add the following configuration**:
    This file tells Nginx how to handle requests for `aklasbela.tv`.
    ```nginx
    server {
        listen 80;
        server_name aklasbela.tv www.aklasbela.tv;

        # CRITICAL: Path to your project's *BUILD* folder.
        root /var/www/html/Aklasbela-TV/dist;
        index index.html;

        # For single-page applications, this ensures that refreshing any page
        # still serves the main index.html file.
        location / {
            try_files $uri /index.html;
        }

        # Proxy API requests to the backend Node.js server running on port 3001
        location /api/ {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

    Save and close the file.

4.  **Enable the Site**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/aklasbela.tv /etc/nginx/sites-enabled/
    ```

5.  **Test and Restart Nginx**:
    ```bash
    sudo nginx -t  # Test for syntax errors
    sudo systemctl restart nginx
    ```

---

### **Step 6: Secure Your Site with HTTPS (Let's Encrypt SSL)**

Finally, we will secure your site with a free SSL certificate.

1.  **Install Certbot**:
    ```bash
    sudo apt install certbot python3-certbot-nginx -y
    ```

2.  **Obtain and Install the SSL Certificate**:
    ```bash
    sudo certbot --nginx -d aklasbela.tv -d www.aklasbela.tv
    ```

---

### **Deployment Complete!**

Your Aklasbela-TV platform is now live and secure.
