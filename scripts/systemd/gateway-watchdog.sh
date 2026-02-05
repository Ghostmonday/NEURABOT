#!/bin/bash
#
# OpenClaw Gateway Watchdog - 100% Uptime Guardian
#
# Features:
# - Fast recovery (10s check interval)
# - Crash detection with backoff
# - Restart count tracking
# - Verification after restart
# - Graceful shutdown
#
# Environment:
#   OPENCLAW_CHECK_INTERVAL   - Check interval seconds (default: 10)
#   OPENCLAW_MAX_RESTARTS    - Max restarts in window (default: 5)
#   OPENCLAW_BACKOFF_MS      - Backoff after crash loop (default: 60000)
#

OPENCLAW_DIR="${OPENCLAW_DIR:-/home/amir/Projects/NEURABOT}"
OPENCLAW_NODE="${OPENCLAW_NODE:-node}"
OPENCLAW_CHECK_INTERVAL="${OPENCLAW_CHECK_INTERVAL:-10}"
OPENCLAW_MAX_RESTARTS="${OPENCLAW_MAX_RESTARTS:-5}"
OPENCLAW_BACKOFF_MS="${OPENCLAW_BACKOFF_MS:-60000}"

PID_FILE="$OPENCLAW_DIR/.gateway-watchdog.pid"
GATEWAY_PID_FILE="$OPENCLAW_DIR/.gateway.pid"
LOG_FILE="$OPENCLAW_DIR/.gateway-watchdog.log"
DAEMON_SCRIPT="$OPENCLAW_DIR/.watchdog-daemon.sh"
RESTART_LOG="$OPENCLAW_DIR/.gateway-restart-log.json"

# Track restarts
get_restart_count() {
    if [ -f "$RESTART_LOG" ]; then
        grep -o '"count":[0-9]*' "$RESTART_LOG" 2>/dev/null | cut -d: -f2 || echo "0"
    else
        echo "0"
    fi
}

increment_restart() {
    local count
    count=$(get_restart_count)
    count=$((count + 1))
    echo "{\"count\":$count,\"last\":\"$(date -Iseconds)\"}" > "$RESTART_LOG"
}

reset_restart() {
    echo "{\"count\":0,\"last\":\"$(date -Iseconds)\"}" > "$RESTART_LOG"
}

write_daemon() {
    cat > "$DAEMON_SCRIPT" << EOF
#!/bin/bash
cd "$OPENCLAW_DIR"
exec >> "$LOG_FILE" 2>&1

log() { echo "[\$(date -Iseconds)] \$*" ; }
warn() { echo "[\$(date -Iseconds)] WARN: \$*" ; }

MAX_RESTARTS=$OPENCLAW_MAX_RESTARTS
BACKOFF_MS=$OPENCLAW_BACKOFF_MS
RESTART_LOG="$RESTART_LOG"
GATEWAY_PID_FILE="$GATEWAY_PID_FILE"

get_restart_count() {
    if [ -f "\$RESTART_LOG" ]; then
        grep -o '"count":[0-9]*' "\$RESTART_LOG" 2>/dev/null | cut -d: -f2 || echo "0"
    else
        echo "0"
    fi
}

check_gateway() {
    if [ -f "\$GATEWAY_PID_FILE" ] && kill -0 "\$(cat "\$GATEWAY_PID_FILE")" 2>/dev/null; then
        return 0
    fi
    return 1
}

start_gateway() {
    "$OPENCLAW_NODE" dist/index.js gateway &
    local new_pid=\$!
    echo \$new_pid > "\$GATEWAY_PID_FILE"
    log "Started gateway \$new_pid"
    
    # Verify it started
    sleep 2
    if kill -0 \$new_pid 2>/dev/null; then
        log "Gateway \$new_pid verified alive"
        return 0
    else
        warn "Gateway \$new_pid failed to start"
        return 1
    fi
}

trap '' TERM INT

log "Watchdog started (interval: ${OPENCLAW_CHECK_INTERVAL}s, max restarts: \$MAX_RESTARTS)"
start_gateway

while sleep ${OPENCLAW_CHECK_INTERVAL}; do
    if check_gateway; then
        # Gateway healthy, reset restart count if been stable
        local count
        count=\$(get_restart_count)
        if [ "\$count" -gt 0 ] && [ "\$count" -lt 3 ]; then
            reset_restart
        fi
        continue
    fi
    
    # Gateway down
    local count
    count=\$(get_restart_count)
    
    if [ "\$count" -ge "\$MAX_RESTARTS" ]; then
        warn "Too many restarts (\$count), backing off for \$BACKOFF_MS ms"
        sleep \$((BACKOFF_MS / 1000))
        reset_restart
    fi
    
    increment_restart
    count=\$(get_restart_count)
    log "Gateway down, restart attempt \$count/\$MAX_RESTARTS"
    start_gateway
done
EOF
    chmod +x "$DAEMON_SCRIPT"
}

start() {
    # Check if already running
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "Watchdog already running ($(cat "$PID_FILE"))"
        return 0
    fi
    
    # Kill stale processes
    [ -f "$PID_FILE" ] && kill "$(cat "$PID_FILE")" 2>/dev/null
    sleep 1
    
    write_daemon
    nohup bash "$DAEMON_SCRIPT" &
    echo $! > "$PID_FILE"
    
    echo "Watchdog started ($(cat "$PID_FILE"))"
    log "Manual start"
}

stop() {
    [ -f "$PID_FILE" ] && kill "$(cat "$PID_FILE")" 2>/dev/null
    [ -f "$GATEWAY_PID_FILE" ] && kill "$(cat "$GATEWAY_PID_FILE")" 2>/dev/null
    rm -f "$PID_FILE" "$GATEWAY_PID_FILE" "$DAEMON_SCRIPT"
    echo "Watchdog stopped"
    log "Manual stop"
}

status() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "Watchdog: $(cat "$PID_FILE") (alive)"
    else
        echo "Watchdog: not running"
    fi
    
    if [ -f "$GATEWAY_PID_FILE" ] && kill -0 "$(cat "$GATEWAY_PID_FILE")" 2>/dev/null; then
        echo "Gateway: $(cat "$GATEWAY_PID_FILE") (alive)"
    else
        echo "Gateway: not running"
    fi
    
    if [ -f "$RESTART_LOG" ]; then
        echo "Restarts: $(cat "$RESTART_LOG")"
    fi
}

log() {
    echo "[$(date -Iseconds)] CLI: $*" >> "$LOG_FILE"
}

case "$1" in
    start) start ;;
    stop) stop ;;
    status) status ;;
    restart) stop; sleep 1; start ;;
    *) echo "Usage: $0 {start|stop|status|restart}" ;;
esac
