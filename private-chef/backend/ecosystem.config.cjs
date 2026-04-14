const ecosystemConfig = {
  apps: [
    {
      name: 'private-chef-api',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      time: true,
      error_file: '/data/private-chef/private-chef/logs/error.log',
      out_file: '/data/private-chef/private-chef/logs/out.log',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};

module.exports = ecosystemConfig;
