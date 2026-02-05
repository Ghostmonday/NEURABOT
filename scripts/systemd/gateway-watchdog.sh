#!/bin/bash
#
# OpenClaw Gateway Watchdog Daemon
#

OPENCLAW_DIR="${OPENCLAW_DIR:-/home/amir/Projects/NEURABOT}"
OPENCLAW_NODE="${OPENCLAW_NODE:-node}"
OPENCLAW_CHECK_INTERVAL="${OPENCLAW_CHECK_INTERVAL:-30}"

PID_FILE="$OPENCLAW_DIR/.gateway-watchdog.pid"
GATEWAY_PID_FILE="$OPENCLAW_DIR/.gateway.pid"
LOG_FILE="$OPENCLAW_DIR/.gateway-watchdog.log"
DAEMON_SCRIPT="$OPENCLAW_DIR/.watchdog-daemon.sh"

write_daemon() {
    cat > "$DAEMON_SCRIPT" << EOF
#!/bin/bash
cd "$OPENCLAW_DIR"
exec >> "$LOG_FILE" 2>&1

log() { echo "[\$(date -Iseconds)] \$*" ; }

start_gateway() {
    "$OPENCLAW_NODE" dist/index.js gateway &
    echo \$! > "$GATEWAY_PID_FILE"
    log "Started gateway \$PPID"
}

check() {
    if [ -f "$GATEWAY_PID_FILE" ] && kill -0 "\$(cat "$GATEWAY_PID_FILE")" 2>/dev/null; then
        return 0
    fi
    log "Gateway down, restarting..."
    start_gateway
}

trap '' TERM INT
log "Watchdog started"
start_gateway
while sleep "$OPENCLAW_CHECK_INTERVAL"; do check; done
EOF
    chmod +x "$DAEMON_SCRIPT"
}

start() {
    [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null && echo "Running $(cat "$PID_FILE")" && return
    write_daemon
    nohup bash "$DAEMON_SCRIPT" &
    echo $! > "$PID_FILE"
    echo "Started $(cat "$PID_FILE")"
}

stop() {
    [ -f "$PID_FILE" ] && kill "$(cat "$PID_FILE")" 2>/dev/null
    [ -f "$GATEWAY_PID_FILE" ] && kill "$(cat "$GATEWAY_PID_FILE")" 2>/dev/null
    rm -f "$PID_FILE" "$GATEWAY_PID_FILE" "$DAEMON_SCRIPT"
    echo "Stopped"
}

status() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "Watchdog $(cat "$PID_FILE")"
        [ -f "$GATEWAY_PID_FILE" ] && kill -0 "$(cat "$GATEWAY_PID_FILE")" 2>/dev/null && echo "Gateway $(cat "$GATEWAY_PID_FILE")" || echo "Gateway down"
    else
        echo "Not running"
    fi
}

case "$1" in
    start) start ;;
    stop) stop ;;
    status) status ;;
    *) echo "Usage: $0 {start|stop|status}" ;;
esac
