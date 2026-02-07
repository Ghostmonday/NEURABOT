#!/usr/bin/env bash
# Monitors NEURABOT status during multi-iteration testing

INTERVAL=${1:-30}  # Default 30 seconds
LOG_FILE="logs/monitor-$(date +%Y%m%d-%H%M%S).log"

while true; do
  echo "=== $(date) ===" | tee -a "$LOG_FILE"

  # PM2 status
  npx pm2 show neurabot-gateway | grep -E "status|restarts|uptime|memory" | tee -a "$LOG_FILE"

  # Task count by status (parse logs)
  echo "Tasks (last 100 log entries):" | tee -a "$LOG_FILE"
  tail -100 logs/neurabot-out.log | jq -r '.message' 2>/dev/null | \
    grep -oE "Task.*completed: (COMPLETED|FAILED|BLOCKED)" | \
    cut -d: -f2 | sort | uniq -c | tee -a "$LOG_FILE"

  # Recent extensions activity
  echo "Extension activity:" | tee -a "$LOG_FILE"
  tail -100 logs/neurabot-out.log | jq -r '.message' 2>/dev/null | \
    grep -E "Roadmap|ContinuousSelfModify|SELF_MODIFY" | tail -5 | tee -a "$LOG_FILE"

  echo "" | tee -a "$LOG_FILE"
  sleep "$INTERVAL"
done
