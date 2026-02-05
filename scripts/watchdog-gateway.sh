#!/usr/bin/env bash
# DEPRECATED: Use PM2 instead of manual watchdog scripts
# See ecosystem.config.cjs for the new approach
#
# To use PM2:
#   npx pm2 start ecosystem.config.cjs
#   npx pm2 save
#   npx pm2 startup
#
# This script is kept for reference only.
# REPLACED BY PM2 - Exiting immediately to prevent conflicts.
exit 0

# TODO: Create external watchdog script that runs via cron (every 2 minutes). Check
# gateway health endpoint. Check channel connectivity (Telegram getUpdates, WhatsApp
# connection). Check Ollama discovery if configured. If critical failures detected,
# trigger gateway restart via systemd/launchctl. Log watchdog actions to audit trail.
#
# Usage: run from cron, e.g. */2 * * * * /path/to/scripts/watchdog-gateway.sh
