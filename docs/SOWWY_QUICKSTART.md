# Sowwy Quick Start Guide

**Get Sowwy OpenClaw Synthesis running in minutes**

---

## Prerequisites

- Node.js 22.x (`nvm install 22`)
- pnpm (`npm install -g pnpm`)
- PostgreSQL (Docker or local install) - optional for initial testing
- MiniMax Portal account - handled by onboarding

---

## Step 1: Run OpenClaw Onboarding

The onboarding wizard automatically configures MiniMax M2.1:

```bash
cd /home/amir/Documents/clawdbot

# Run the OpenClaw onboarding wizard
openclaw onboard
```

**During onboarding:**

1. Choose **QuickStart** (recommended for first run)
2. When asked about model/auth, select **MiniMax M2.1** (config auto-written)
3. Accept defaults for everything else
4. Let it install dependencies and run health check

---

## Step 2: Configure Sowwy Environment

The onboarding creates `~/.openclaw/openclaw.json`. Add Sowwy-specific vars:

```bash
# Create .env for Sowwy
cat >> ~/.openclaw/.env << 'EOF'
# PostgreSQL (optional for testing - will use in-memory if not set)
SOWWY_POSTGRES_HOST=localhost
SOWWY_POSTGRES_PORT=5432
SOWWY_POSTGRES_USER=sowwy
SOWWY_POSTGRES_PASSWORD=your-secure-password
SOWWY_POSTGRES_DB=sowwy

# LanceDB for Identity (auto-created)
SOWWY_IDENTITY_PATH=~/.openclaw/sowwy-identity

# SMT Throttling
SOWWY_SMT_WINDOW_MS=18000000
SOWWY_SMT_MAX_PROMPTS=100

# Scheduler
SOWWY_SCHEDULER_POLL_MS=5000
SOWWY_SCHEDULER_MAX_RETRIES=3

# Security
SOWWY_REQUIRE_APPROVAL=true
SOWWY_KILL_SWITCH=false
EOF
```

---

## Step 3: Start PostgreSQL (Optional)

If you want Mission Control + scheduler persistence:

```bash
# Using Docker
docker run -d \
  --name sowwy-postgres \
  -e POSTGRES_USER=sowwy \
  -e POSTGRES_PASSWORD=your-secure-password \
  -e POSTGRES_DB=sowwy \
  -p 127.0.0.1:5432:5432 \
  postgres:15-alpine

# Create database
docker exec sowwy-postgres psql -U sowwy -d sowwy -c "SELECT 1"
```

---

## Step 4: Run the Gateway

```bash
# Development mode with MiniMax M2.1
cd /home/amir/Documents/clawdbot
pnpm gateway:dev --model minimax-portal/MiniMax-M2.1

# Or use the startup script with env
node --env-file=~/.openclaw/.env openclaw.mjs gateway --model minimax-portal/MiniMax-M2.1
```

The gateway will start on `ws://127.0.0.1:18789`

---

## Step 5: Test Sowwy

Open the Control UI in your browser:

```
http://127.0.0.1:18790
```

Or test via CLI:

```bash
# List tasks
openclaw rpc sowwy.tasks.list

# Get identity status
openclaw rpc sowwy.identity.status

# Check system health
openclaw health
```

---

## Step 6: Add Sowwy Skills

The onboarding wizard can install Sowwy-specific skills:

```bash
# Install skills
openclaw skills install sowwy

# Or manually
cd /home/amir/Documents/clawdbot/skills/persona-dev
# Edit the skill file as needed
```

---

## Step 7: Configure Channels (Optional)

```bash
# WhatsApp (QR login required)
openclaw configure --section whatsapp

# Telegram
openclaw configure --section telegram

# Discord
openclaw configure --section discord
```

---

## Testing Without PostgreSQL

For initial testing, you can run without PostgreSQL. Sowwy will use in-memory storage:

```bash
# Don't set SOWWY_POSTGRES_HOST
# Comment out or remove from ~/.openclaw/.env:
# SOWWY_POSTGRES_HOST=localhost
# SOWWY_POSTGRES_PORT=5432
# SOWWY_POSTGRES_USER=sowwy
# SOWWY_POSTGRES_PASSWORD=...
```

---

## Troubleshooting

### Gateway won't start

```bash
# Check if port is in use
lsof -i :18789

# Kill existing process
kill $(lsof -t -i :18789)
```

### MiniMax auth failed

```bash
# Re-run onboarding to re-authenticate
openclaw onboard --reset auth

# Or manually set token
export MINIMAX_API_KEY="sk-cp-..."
```

### PostgreSQL connection refused

```bash
# Check if Docker is running
docker ps | grep sowwy

# Check logs
docker logs sowwy-postgres

# Restart container
docker restart sowwy-postgres
```

### Health check failing

```bash
# Deep health check
openclaw status --deep

# Check gateway logs
openclaw logs --tail 100
```

---

## Next Steps

Once working locally:

1. **Set up SSH keys** for passwordless login
2. **Configure firewall** (see `SOWWY_VPS_SECURITY.md`)
3. **Deploy to VPS** (see `SOWWY_VPS_SECURITY.md`)
4. **Enable daemon** for auto-start on boot

---

## Files Reference

| File                                       | Purpose                |
| ------------------------------------------ | ---------------------- |
| `~/.openclaw/openclaw.json`                | Main OpenClaw config   |
| `~/.openclaw/.env`                         | Environment variables  |
| `~/.openclaw/sowwy-identity/`              | LanceDB identity store |
| `/home/amir/Documents/clawdbot/src/sowwy/` | Sowwy source code      |
| `/home/amir/Documents/clawdbot/skills/`    | Persona skills         |

---

## Useful Commands

```bash
# Start gateway in background
nohup pnpm gateway:dev --model minimax-portal/MiniMax-M2.1 > /tmp/sowwy.log 2>&1 &

# Check if running
pgrep -f "openclaw.*gateway"

# View logs
tail -f /tmp/sowwy.log

# Stop gateway
pkill -f "openclaw.*gateway"

# Full reset (WARNING: deletes everything)
openclaw onboard --reset full
```
