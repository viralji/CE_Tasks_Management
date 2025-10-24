module.exports = {
  apps: [
    {
      name: 'noclick',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/noclick',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/noclick-error.log',
      out_file: '/var/log/pm2/noclick-out.log',
      log_file: '/var/log/pm2/noclick-combined.log',
      time: true
    }
  ]
};
