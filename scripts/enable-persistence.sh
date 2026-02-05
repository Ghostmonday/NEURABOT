#!/bin/bash
# DEPRECATED: Use PM2 instead of systemd for process management
# See ecosystem.config.cjs for the new approach
#
# To use PM2:
#   npx pm2 start ecosystem.config.cjs
#   npx pm2 save
#   npx pm2 startup
#
# This script is kept for reference only.
set -e

# Ensure we are in the project root
if [ ! -f "scripts/systemd/openclaw-watchdog.service" ]; then
    echo "Error: Please run this script from the project root (e.g., ./scripts/enable-persistence.sh)"
    exit 1
fi

SERVICE_NAME="openclaw-watchdog.service"
SERVICE_SRC="$(pwd)/scripts/systemd/$SERVICE_NAME"
SERVICE_DEST="/etc/systemd/system/$SERVICE_NAME"

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (sudo ./scripts/enable-persistence.sh)"
  exit 1
fi

echo "Installing $SERVICE_NAME..."
echo "Source: $SERVICE_SRC"
echo "Dest:   $SERVICE_DEST"
cp "$SERVICE_SRC" "$SERVICE_DEST"

echo "Reloading systemd..."
systemctl daemon-reload

echo "Enabling service..."
systemctl enable openclaw-watchdog

echo "Starting service..."
systemctl start openclaw-watchdog

echo "Done! Service status:"
systemctl status openclaw-watchdog --no-pager
