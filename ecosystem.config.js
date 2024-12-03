module.exports = {
  apps: [{
    name: 'AnimeStream',
    script: 'dist/index.js',
    watch: false,
    instances: 1,
    autorestart: true,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    merge_logs: true,
    time: true,
    // Graceful shutdown
    kill_timeout: 5000,
    // Restart delay
    restart_delay: 4000,
    // Auto restart if memory exceeds 1GB
    max_memory_restart: '1G',
    // Specify node args if needed
    node_args: '--max-old-space-size=1024',
  }]
} 