#!/bin/bash
# Telegram Bot Auto-Setup for @Sowwy2026_bot

set -e

# Get token from env or first argument
TOKEN="${1:-$TELEGRAM_BOT_TOKEN}"
if [ -z "$TOKEN" ]; then
    echo "Error: TELEGRAM_BOT_TOKEN not set. Provide as arg or env variable."
    exit 1
fi

API="https://api.telegram.org/bot$TOKEN"

echo "🤖 Configuring @Sowwy2026_bot..."

# Set bot name
echo "  📛 Setting name..."
curl -s -X POST "$API/setMyName" \
    -H "Content-Type: application/json" \
    -d '{"name": "Claw ⚡"}' > /dev/null

# Set description (about)
echo "  📝 Setting description..."
curl -s -X POST "$API/setMyDescription" \
    -H "Content-Type: application/json" \
    -d '{"description": "Your AI assistant ⚡ Built by Amir. I live in OpenClaw and get smarter every day."}' > /dev/null

# Set bio (about section)
echo "  📄 Setting bio..."
curl -s -X POST "$API/setMyShortDescription" \
    -H "Content-Type: application/json" \
    -d '{"short_description": "AI assistant ⚡ OpenClaw-powered"}' > /dev/null

# Set commands menu
echo "  📋 Setting commands..."
curl -s -X POST "$API/setMyCommands" \
    -H "Content-Type: application/json" \
    -d '{"commands": [
        {"command": "start", "description": "Start conversation"},
        {"command": "help", "description": "Get help"},
        {"command": "status", "description": "Check my status"}
    ]}' > /dev/null

# Set profile photo (if file provided)
if [ -n "$2" ]; then
    echo "  📷 Setting profile photo..."
    curl -s -X POST "$API/setMyPhoto" \
        -H "Content-Type: application/json" \
        -d '{"photo": {"stream": {"$source": "'"$2"'"}}}' 2>/dev/null || echo "  ⚠️  Photo upload skipped (requires file)"
fi

echo "✅ @Sowwy2026_bot configured!"
echo ""
echo "Next steps:"
echo "1. Open Telegram and message @Sowwy2026_bot"
echo "2. Say 'start' or 'hello'"
echo "3. I'm now reachable via Telegram!"
