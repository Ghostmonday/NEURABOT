#!/bin/bash
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

cd "/home/amir/Projects/NEURABOT"
exec >> "/home/amir/Projects/NEURABOT/.gateway-watchdog.log" 2>&1

log() { echo "[$(date -Iseconds)] $*" ; }
warn() { echo "[$(date -Iseconds)] WARN: $*" ; }

MAX_RESTARTS=5
BACKOFF_MS=60000
RESTART_LOG="/home/amir/Projects/NEURABOT/.gateway-restart-log.json"
GATEWAY_PID_FILE="/home/amir/Projects/NEURABOT/.gateway.pid"

get_restart_count() {
    if [ -f "$RESTART_LOG" ]; then
        grep -o '"count":[0-9]*' "$RESTART_LOG" 2>/dev/null | cut -d: -f2 || echo "0"
    else
        echo "0"
    fi
}

check_gateway() {
    if [ -f "$GATEWAY_PID_FILE" ] && kill -0 "$(cat "$GATEWAY_PID_FILE")" 2>/dev/null; then
        return 0
    fi
    return 1
}

start_gateway() {
    "node" dist/index.js gateway &
    local new_pid=$!
    echo $new_pid > "$GATEWAY_PID_FILE"
    log "Started gateway $new_pid"

    # Verify it started
    sleep 2
    if kill -0 $new_pid 2>/dev/null; then
        log "Gateway $new_pid verified alive"
        return 0
    else
        warn "Gateway $new_pid failed to start"
        return 1
    fi
}

trap '' TERM INT

log "Watchdog started (interval: 10s, max restarts: $MAX_RESTARTS)"
start_gateway

while sleep 10; do
    if check_gateway; then
        # Gateway healthy, reset restart count if been stable
        local count
        count=$(get_restart_count)
        if [ "$count" -gt 0 ] && [ "$count" -lt 3 ]; then
            reset_restart
        fi
        continue
    fi

    # Gateway down
    local count
    count=$(get_restart_count)

    if [ "$count" -ge "$MAX_RESTARTS" ]; then
        warn "Too many restarts ($count), backing off for $BACKOFF_MS ms"
        sleep $((BACKOFF_MS / 1000))
        reset_restart
    fi

    increment_restart
    count=$(get_restart_count)
    log "Gateway down, restart attempt $count/$MAX_RESTARTS"
    start_gateway
done
