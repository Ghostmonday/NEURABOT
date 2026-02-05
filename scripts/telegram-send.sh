#!/bin/bash
# Quick Telegram sender - bypasses gateway message tool issues
# Usage: ./telegram-send.sh "Your message here"

BOT_TOKEN="8253355600:AAHpvHCHv8mrx2E88a_5AYxY2rtSNYE0jXA"
CHAT_ID="8587669820"

curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -d "chat_id=${CHAT_ID}" \
  -d "text=$1" \
  -d "parse_mode=HTML"
