module.exports = {
  apps: [{
    name: "backend-notes-ai",
    script: "./dist/app.js",
    instances: "max", // Atau ganti dengan angka, misal: 1
    exec_mode: "cluster",
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
};
