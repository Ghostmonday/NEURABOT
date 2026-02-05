#!/bin/bash
# Quick Telegram sender - primary delivery method
# Usage: ./telegram-send.sh "Your message here"

# Get token from env or use default
BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-8029978113:AAH2pmb2Y4q52OXj7STyNFrXnlhpwuNaAJ0}"
CHAT_ID="${TELEGRAM_CHAT_ID}"

# Require chat_id
if [ -z "$CHAT_ID" ]; then
    echo "ERROR: TELEGRAM_CHAT_ID not set"
    exit 1
fi

curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -d "chat_id=${CHAT_ID}" \
  -d "text=$1" \
  -d "parse_mode=HTML"
