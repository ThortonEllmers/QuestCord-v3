module.exports = {
  apps: [{
    name: 'questcord',
    script: './start.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    kill_timeout: 5000,
    listen_timeout: 10000,
    shutdown_with_message: true,
    // PM2 will automatically restart if the process crashes
    exp_backoff_restart_delay: 100,
    // Cron restart at 3 AM daily (optional, for maintenance)
    cron_restart: '0 3 * * *',
    // Don't run npm install on first start (start.js handles it)
    post_update: ['npm install'],
    // Health check
    wait_ready: true
  }]
};
