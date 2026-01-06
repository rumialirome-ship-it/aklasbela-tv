module.exports = {
  apps : [{
    name: "aklasbela-backend",
    script: "./server.js",
    instances: 1,
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