#!/bin/bash
cd "/home/amir/Projects/NEURABOT"
exec >> "/home/amir/Projects/NEURABOT/.gateway-watchdog.log" 2>&1

log() { echo "[$(date -Iseconds)] $*" ; }

start_gateway() {
    "node" dist/index.js gateway &
    echo $! > "/home/amir/Projects/NEURABOT/.gateway.pid"
    log "Started gateway $PPID"
}

check() {
    if [ -f "/home/amir/Projects/NEURABOT/.gateway.pid" ] && kill -0 "$(cat "/home/amir/Projects/NEURABOT/.gateway.pid")" 2>/dev/null; then
        return 0
    fi
    log "Gateway down, restarting..."
    start_gateway
}

trap '' TERM INT
log "Watchdog started"
start_gateway
while sleep "30"; do check; done
