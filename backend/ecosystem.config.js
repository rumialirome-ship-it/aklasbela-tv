module.exports = {
  apps : [{
    name: "aklasbela-backend",
    script: "./server.js",
    exec_mode: "fork",
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      JWT_SECRET: "aklasbela_tv_secure_salt_2024"
    }
  }]
}