#!/bin/bash
#
# OpenClaw Gateway Watchdog Daemon
#
# Monitors the gateway process and restarts it if it dies.
# Receives SIGUSR1 for clean reloads.
#
# Usage:
#   ./gateway-watchdog.sh start    - Start daemon
#   ./gateway-watchdog.sh stop     - Stop daemon
#   ./gateway-watchdog.sh status   - Check if running
#   ./gateway-watchdog.sh restart  - Restart gateway (not daemon)
#
# Environment:
#   OPENCLAW_DIR   - Directory containing the gateway (default: script dir)
#   OPENCLAW_NODE  - Node binary to use (default: node)
#   OPENCLAW_CHECK_INTERVAL - Seconds between checks (default: 30)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPENCLAW_DIR="${OPENCLAW_DIR:-$SCRIPT_DIR}"
OPENCLAW_NODE="${OPENCLAW_NODE:-node}"
OPENCLAW_CHECK_INTERVAL="${OPENCLAW_CHECK_INTERVAL:-30}"

PID_FILE="$OPENCLAW_DIR/.gateway-watchdog.pid"
GATEWAY_PID_FILE="$OPENCLAW_DIR/.gateway.pid"
LOG_FILE="$OPENCLAW_DIR/.gateway-watchdog.log"

start_daemon() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "Watchdog already running (PID $(cat "$PID_FILE"))"
        return 0
    fi

    echo "Starting watchdog daemon..."
    cd "$OPENCLAW_DIR"

    # Start watchdog in background
    (
        exec env NODE_PATH="$OPENCLAW_DIR/node_modules" \
            "$OPENCLAW_NODE" -e "
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PID_FILE = '$GATEWAY_PID_FILE';
const LOG_FILE = '$LOG_FILE';
const CHECK_INTERVAL = $OPENCLAW_CHECK_INTERVAL;

function log(msg) {
    const ts = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, \`[\${ts}] \${msg}\\n\`);
    console.log(\`[\${ts}] \${msg}\`);
}

function getGatewayPid() {
    try {
        if (fs.existsSync(PID_FILE)) {
            return parseInt(fs.readFileSync(PID_FILE, 'utf8').trim());
        }
    } catch {}
    return null;
}

function isAlive(pid) {
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

function startGateway() {
    const gateway = spawn('$OPENCLAW_NODE', ['dist/index.js', 'gateway'], {
        cwd: '$OPENCLAW_DIR',
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true
    });

    gateway.stdout.on('data', (d) => process.stdout.write(d));
    gateway.stderr.on('data', (d) => process.stderr.write(d));

    gateway.unref();

    // Write PID
    fs.writeFileSync(PID_FILE, gateway.pid.toString());
    log(\`Gateway started with PID \${gateway.pid}\`);
}

function checkGateway() {
    const pid = getGatewayPid();
    if (pid && isAlive(pid)) {
        log(\`Gateway alive (PID \${pid})\`);
        return true;
    }
    log('Gateway not running, starting...');
    startGateway();
    return true;
}

// Handle SIGUSR1 for clean reload
process.on('SIGUSR1', () => {
    log('Received SIGUSR1, requesting gateway reload...');
    const pid = getGatewayPid();
    if (pid && isAlive(pid)) {
        try {
            process.kill(pid, 'SIGUSR1');
            log('Sent SIGUSR1 to gateway');
        } catch (e) {
            log(\`Failed to send SIGUSR1: \${e.message}\`);
        }
    }
});

// Handle SIGTERM/SIGINT for clean shutdown
process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down...');
    const pid = getGatewayPid();
    if (pid && isAlive(pid)) {
        process.kill(pid, 'SIGTERM');
    }
    process.exit(0);
});

process.on('SIGINT', () => {
    log('Received SIGINT, shutting down...');
    const pid = getGatewayPid();
    if (pid && isAlive(pid)) {
        process.kill(pid, 'SIGINT');
    }
    process.exit(0);
});

// Main loop
log('Watchdog started');
startGateway();

setInterval(() => {
    checkGateway();
}, CHECK_INTERVAL * 1000);
" >> "$LOG_FILE" 2>&1 &
    )

    # Store watchdog PID
    echo $! > "$PID_FILE"
    log "Watchdog daemon started (PID $!)"

    # Wait a moment and verify
    sleep 1
    if kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "Watchdog started successfully"
        return 0
    else
        echo "Failed to start watchdog"
        return 1
    fi
}

stop_daemon() {
    if [ ! -f "$PID_FILE" ]; then
        echo "Watchdog not running"
        return 0
    fi

    local watchdog_pid
    watchdog_pid=$(cat "$PID_FILE")

    if ! kill -0 "$watchdog_pid" 2>/dev/null; then
        echo "Watchdog not running (stale PID file)"
        rm -f "$PID_FILE"
        return 0
    fi

    echo "Stopping watchdog (PID $watchdog_pid)..."
    kill "$watchdog_pid" 2>/dev/null || true

    # Also stop gateway
    if [ -f "$GATEWAY_PID_FILE" ]; then
        local gateway_pid
        gateway_pid=$(cat "$GATEWAY_PID_FILE")
        if kill -0 "$gateway_pid" 2>/dev/null; then
            echo "Stopping gateway (PID $gateway_pid)..."
            kill "$gateway_pid" 2>/dev/null || true
        fi
        rm -f "$GATEWAY_PID_FILE"
    fi

    rm -f "$PID_FILE"
    echo "Watchdog stopped"
}

restart_gateway() {
    if [ -f "$GATEWAY_PID_FILE" ]; then
        local gateway_pid
        gateway_pid=$(cat "$GATEWAY_PID_FILE")
        if kill -0 "$gateway_pid" 2>/dev/null; then
            echo "Sending SIGUSR1 to gateway (PID $gateway_pid)..."
            kill -USR1 "$gateway_pid"
            echo "Gateway reload requested"
            return 0
        fi
    fi
    echo "Gateway not running"
    return 1
}

case "$1" in
    start)
        start_daemon
        ;;
    stop)
        stop_daemon
        ;;
    status)
        if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
            echo "Watchdog running (PID $(cat "$PID_FILE"))"
            if [ -f "$GATEWAY_PID_FILE" ] && kill -0 "$(cat "$GATEWAY_PID_FILE")" 2>/dev/null; then
                echo "Gateway running (PID $(cat "$GATEWAY_PID_FILE"))"
            else
                echo "Gateway not running"
            fi
        else
            echo "Watchdog not running"
        fi
        ;;
    restart-gateway)
        restart_gateway
        ;;
    restart)
        stop_daemon
        start_daemon
        ;;
    *)
        echo "Usage: $0 {start|stop|status|restart|restart-gateway}"
        exit 1
        ;;
esac
