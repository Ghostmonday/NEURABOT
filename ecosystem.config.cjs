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
 *   1. ✅ npx pm2 install pm2-logrotate   # Prevent disk fill (DONE)
 *   2. ⚠️  npx pm2 startup                  # Copy the sudo command it outputs and run it (requires sudo password)
 *   3. ⚠️  Set HEALTHCHECKS_URL below       # Dead Man's Switch (user must get URL from https://healthchecks.io)
 */

module.exports = {
  apps: [
    {
      name: "neurabot-gateway",
      script: "dist/index.js",
      args: "gateway",
      cwd: __dirname,

      // Environment
      node_args: "--enable-source-maps --max-old-space-size=896",
      env: {
        NODE_ENV: "production",
        // TODO(healthchecks): Get your free ping URL from https://healthchecks.io
        // Then uncomment and paste below:
        // HEALTHCHECKS_URL: "https://hc-ping.com/YOUR-UUID-HERE",
        // PostgreSQL configuration (uncomment after running scripts/setup-postgres.sh)
        // SOWWY_POSTGRES_HOST: "127.0.0.1",
        // SOWWY_POSTGRES_PORT: "5432",
        // SOWWY_POSTGRES_USER: "sowwy",
        // SOWWY_POSTGRES_PASSWORD: "<password-from-setup-script>",
        // SOWWY_POSTGRES_DB: "sowwy",
      },

      // Restart behavior
      autorestart: true,
      watch: false,
      max_restarts: 0, // 0 = unlimited restarts (PM2 convention) - ensures continuous operation
      min_uptime: "5s", // Reduced so normal restarts (config reloads, self-modify reloads) don't count against restart budget
      restart_delay: 5000, // 5s between restarts

      // Memory management (high-throughput: increased to 1024M)
      max_memory_restart: "1024M",

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
    {
      name: "neurabot-sentinel",
      script: "scripts/pm2-sentinel.cjs",
      cwd: __dirname,
      autorestart: true,
      max_restarts: 3,
      restart_delay: 5000,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/sentinel-error.log",
      out_file: "./logs/sentinel-out.log",
      merge_logs: true,
    },
  ],
};
