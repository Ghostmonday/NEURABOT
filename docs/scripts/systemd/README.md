# Gateway Watchdog

The gateway watchdog monitors the OpenClaw gateway and automatically restarts it if it goes down.

## Usage

```bash
# Start the watchdog
./scripts/systemd/gateway-watchdog.sh start

# Stop the watchdog
./scripts/systemd/gateway-watchdog.sh stop

# Check status
./scripts/systemd/gateway-watchdog.sh status

# Manually restart the gateway
./scripts/systemd/gateway-watchdog.sh restart-gateway
```

## Actions

| Action            | Description                                                         |
| ----------------- | ------------------------------------------------------------------- |
| `start`           | Start the watchdog daemon (monitors gateway, auto-restarts if down) |
| `stop`            | Stop the watchdog daemon                                            |
| `status`          | Check if watchdog is running and gateway status                     |
| `restart-gateway` | Manually trigger gateway restart                                    |

## Agent Tool Usage

Agents can control the watchdog via the `watchdog` tool:

```typescript
// Start watchdog before self-modification
await watchdog({ action: "start" });

// Request self-modification reload
await self_modify.reload();

// Stop watchdog after successful restart (optional)
await watchdog({ action: "stop" });
```

## Configuration

Environment variables:

- `AUTO_STOP_AFTER_RESTART=true` - Stop watchdog automatically after successful gateway restart

## Logs

- Watchdog log: `/tmp/openclaw-watchdog.log`
- Gateway log: `/tmp/openclaw-gateway.log`

## How It Works

1. The watchdog checks if the gateway is running every 30 seconds
2. If the gateway is down, it:
   - Builds UI assets (`pnpm ui:build`)
   - Builds TypeScript (`pnpm build`)
   - Starts the gateway on port 18789
3. Logs all actions to `/tmp/openclaw-watchdog.log`
