/**
 * PM2 Ecosystem Configuration for NEURABOT Gateway
 *
 * Features:
 * - Auto-restart on crash
 * - Memory limit: 300MB
 * - Log rotation to ./logs/
 * - Production environment
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup
 *
 * TODO(setup): Run these commands to complete setup:
 *   1. npx pm2 install pm2-logrotate   # Prevent disk fill
 *   2. npx pm2 startup                  # Copy the sudo command it outputs and run it
 *   3. Set HEALTHCHECKS_URL below       # Dead Man's Switch
 */

module.exports = {
  apps: [
    {
      name: "neurabot-gateway",
      script: "dist/index.js",
      args: "gateway",
      cwd: __dirname,

      // Environment
      node_args: "--enable-source-maps",
      env: {
        NODE_ENV: "production",
        // TODO(healthchecks): Get your free ping URL from https://healthchecks.io
        // Then uncomment and paste below:
        // HEALTHCHECKS_URL: "https://hc-ping.com/YOUR-UUID-HERE",
      },

      // Restart behavior
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 5000, // 5s between restarts

      // Memory management
      max_memory_restart: "300M",

      // Logging
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/neurabot-error.log",
      out_file: "./logs/neurabot-out.log",
      merge_logs: true,
      log_type: "json",

      // Process management
      instances: 1,
      exec_mode: "fork",
      kill_timeout: 10000, // 10s graceful shutdown

      // Source maps for better stack traces
      source_map_support: true,
    },
  ],
};
