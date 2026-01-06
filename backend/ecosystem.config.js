module.exports = {
  apps : [{
    name: "aklasbela-exchange",
    script: "./server.js",
    exec_mode: "fork",
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: "production",
      PORT: 3005,
      JWT_SECRET: "aklasbela_tv_secure_salt_2024"
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 3005
    }
  }]
}