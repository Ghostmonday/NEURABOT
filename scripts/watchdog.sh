#!/bin/bash
# Watchdog cron job - ensures gateway never stops
# Run every 5 minutes: */5 * * * * ~/Projects/NEURABOT/scripts/watchdog.sh

LOG_FILE="/home/amir/.openclaw/logs/watchdog.log"
BOT_TOKEN="8029978113:AAH2pmb2Y4q52OXj7STyNFrXnlhpwuNaAJ0"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-8587669820}"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

send_telegram() {
    local msg="$1"
    curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
        -d "chat_id=${TELEGRAM_CHAT_ID}" \
        -d "text=$msg" \
        -d "parse_mode=HTML" >> /dev/null
}

# Check if gateway is running
GATEWAY_STATUS=$(systemctl --user is-active openclaw-gateway 2>/dev/null)

if [ "$GATEWAY_STATUS" != "active" ]; then
    log "Gateway dead - restarting..."
    send_telegram "⚠️ Gateway dead. Restarting..."
    
    systemctl --user stop openclaw-gateway 2>/dev/null
    sleep 2
    pkill -9 openclaw-gateway 2>/dev/null
    sleep 1
    
    systemctl --user start openclaw-gateway
    sleep 5
    
    # Verify restart
    GATEWAY_STATUS=$(systemctl --user is-active openclaw-gateway 2>/dev/null)
    if [ "$GATEWAY_STATUS" == "active" ]; then
        log "Gateway restored"
        send_telegram "✅ Gateway restored. System nominal."
    else
        log "FAILED to restore gateway"
        send_telegram "❌ CRITICAL: Gateway failed to restart"
    fi
else
    log "Gateway healthy"
fi

# Log memory usage
MEM=$(ps aux | grep openclaw-gateway | grep -v grep | awk '{sum+=$6} END {print sum/1024 "MB"}')
log "Gateway memory: $MEM"
