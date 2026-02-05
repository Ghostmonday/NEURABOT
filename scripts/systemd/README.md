# OpenClaw Watchdog - Boot Persistence Guide

## Quick Install

```bash
# Copy service file
sudo cp scripts/systemd/openclaw-watchdog.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start
sudo systemctl enable openclaw-watchdog
sudo systemctl start openclaw-watchdog

# Verify
sudo systemctl status openclaw-watchdog
```

## Uninstall

```bash
sudo systemctl stop openclaw-watchdog
sudo systemctl disable openclaw-watchdog
sudo rm /etc/systemd/system/openclaw-watchdog.service
sudo systemctl daemon-reload
```

## What It Does

1. Starts watchdog on boot (before login)
2. Watchdog starts gateway automatically
3. Gateway monitored every 10 seconds
4. Auto-restart on crash with crash loop protection
5. All logs go to journalctl

## View Logs

```bash
# Watchdog logs
journalctl -u openclaw-watchdog -f

# Gateway logs
journalctl -u openclaw-watchdog -f | grep gateway
```

## Configuration

Edit `/etc/systemd/system/openclaw-watchdog.service` or set environment:

```bash
# As environment file: /etc/systemd/system/openclaw-watchdog.service.d/override.conf
[Service]
Environment=OPENCLAW_CHECK_INTERVAL=10
Environment=OPENCLAW_MAX_RESTARTS=5
```
