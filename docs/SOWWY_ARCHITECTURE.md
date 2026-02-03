# Sowwy Architecture & Security Guide

## Overview

Sowwy is designed to give an AI **controlled** access to your digital life. The key insight is **tiered capability levels** - the AI can do routine things autonomously, but sensitive actions require explicit permission.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Your Computer (VPS)                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Sowwy Gateway (ws://localhost:18789)  │  │
│  │     - RPC API for all operations                          │  │
│  │     - Authentication & authorization                     │  │
│  │     - SMT throttling (rate limiting)                     │  │
│  │     - Approval gates for sensitive actions               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                    │
│              ┌───────────────┼───────────────┐                  │
│              ▼               ▼               ▼                  │
│     ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│     │  PostgreSQL  │  │  LanceDB    │  │  OpenClaw Core  │    │
│     │  (Tasks)     │  │(Identity)   │  │  (Channels)     │    │
│     └─────────────┘  └─────────────┘  └─────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Remote Nodes (Your Mac/iPhone)               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐│
│  │  DeskIn     │  │  Browser    │  │  iOS/Android Agent      ││
│  │  (Mac ctrl) │  │  automation │  │  (mobile access)       ││
│  └─────────────┘  └─────────────┘  └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## API Keys Required

### Core (Required for Testing)
```bash
# .env configuration
# LLM API Key - for AI reasoning
ANTHROPIC_API_KEY=sk-ant-api03-xxx
# or
OPENAI_API_KEY=sk-xxx

# PostgreSQL (included in docker-compose)
SOWWY_POSTGRES_PASSWORD=secure-password-here
```

### Extensions (Optional - Add as Needed)
```bash
# Twilio SMS
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890

# Proton Email
PROTON_EMAIL=your@email.com
PROTON_PASSWORD=your-password

# DeskIn Mac Control (deskinn.com)
DESKIN_API_URL=https://api.deskin.com
DESKIN_DEVICE_ID=your-device-id
```

## Testing Locally

### Step 1: Start PostgreSQL
```bash
cd /home/amir/Documents/clawdbot
docker-compose up -d postgres
```

### Step 2: Run the Gateway
```bash
# With API key
export ANTHROPIC_API_KEY=sk-ant-api03-xxx
pnpm gateway:dev
```

### Step 3: Connect to Gateway
The Gateway runs at `ws://127.0.0.1:18789`. Connect using any WebSocket client:

```javascript
// Example connection
const ws = new WebSocket('ws://127.0.0.1:18789');

ws.onopen = () => {
  // List tasks
  ws.send(JSON.stringify({
    method: 'tasks.list',
    params: {},
    id: 1
  }));
};
```

## Capability Tiers

### Tier 1: Always Allowed (No Approval Needed)
| Action | Description | Safety |
|--------|-------------|--------|
| `identity.extract` | Learn from conversations | ✅ Safe - only improves AI |
| `audit.log` | Record actions | ✅ Safe - only improves observability |
| `health.check` | System status | ✅ Safe - read-only |
| `tasks.list` | View tasks | ✅ Safe - read-only |
| `identity.search` | Retrieve context | ✅ Safe - read-only |

### Tier 2: Allowed with SMT Throttling
| Action | Description | Limit |
|--------|-------------|-------|
| `tasks.create` | Create tasks | 500/day |
| `persona.execute` | Run persona logic | 500/day |
| `llm.complete` | AI reasoning | 500/day |

### Tier 3: Requires Approval (Default-Deny)
| Action | Requires | Example |
|--------|----------|---------|
| `email.send` | Human approval | Send email to external |
| `sms.send` | Human approval | Send SMS |
| `browser.navigate` | Human approval | Visit URL |
| `file.write` | Human approval | Create/modify files |
| `deskin.click` | Human approval | Control Mac |
| `app.submit` | LegalOps approval | Submit to App Store |

## Approval Gates

### How Approval Works

1. **Task Creation**: Task marked `requiresApproval: true`
2. **Notification**: Human gets notified (SMS/email/WebChat)
3. **Human Review**: Human reviews and approves via `tasks.approve`
4. **Execution**: Scheduler proceeds after approval

### Approval Channels

```typescript
// Human approval options:
// 1. WebChat UI - click "Approve" button
// 2. SMS - reply "APPROVE <taskId>"
// 3. Email - forward approval request
// 4. WhatsApp - send approval command
```

## Security Layers (Defense in Depth)

### Layer 1: Gateway Hardening
```yaml
# gateway.config
bind: 127.0.0.1        # Loopback only - no public access
dmPolicy: pairing      # Only paired devices can DM
tokenRequired: true     # Always require auth token
```

### Layer 2: SMT Throttling
- Prevents runaway execution
- Reserves 20% capacity for LegalOps/Email
- Identity extraction, audit, health always bypass

### Layer 3: Circuit Breakers
- External APIs (Twilio, Proton, etc.) have breakers
- Breaker opens after 5 failures
- Fail fast instead of hanging

### Layer 4: Approval Gates
- Default-deny for sensitive actions
- Human must explicitly approve
- Audit trail of all approvals

### Layer 5: Kill Switch
```bash
# Emergency stop - immediately pauses all execution
pnpm sowwy pause --reason "emergency"

# Resume when safe
pnpm sowwy resume
```

### Layer 6: Audit Logging
- Every action logged with timestamp, user, details
- Append-only - never deleted
- Includes decision summaries and confidence scores

## Why This Design?

### The "AI Doing Anything" Problem

The goal is **contextual autonomy**:
- **In known contexts**: AI can act autonomously (e.g., "organize my downloads")
- **In unknown contexts**: AI asks for approval (e.g., "send email to stranger")
- **In sensitive contexts**: Human must approve (e.g., "submit to App Store")

### Benefits

1. **Speed**: Routine tasks happen immediately
2. **Safety**: Sensitive actions require human check
3. **Learning**: Identity model improves AI context
4. **Recovery**: Audit logs allow post-hoc review

## Approval Conditions Example

```typescript
// Exact conditions for autonomous action
const AUTONOMOUS_ACTIONS = {
  // These AI can do without asking:
  readEmails: true,           // Reading is safe
  searchIdentity: true,       // Learning is good
  createTasks: true,          // Task creation is reversible
  draftResponses: true,       // Drafts need review anyway
  
  // These require approval:
  sendEmail: "human_required",
  sendSms: "human_required", 
  modifyFiles: "human_required",
  controlMac: "human_required",
  visitUrls: "human_required",
};

// Conditional autonomy based on identity
async function canAutonomousAction(action: string, context: IdentityContext): Promise<boolean> {
  if (AUTONOMOUS_ACTIONS[action] === true) {
    return true; // Always allowed
  }
  
  if (AUTONOMOUS_ACTIONS[action] === "human_required") {
    return false; // Always requires approval
  }
  
  // Check identity for context-aware decisions
  if (action === "visitUrls" && context.prefersAutoBrowse) {
    return true; // User trusts AI for browsing
  }
  
  return false; // Default to requiring approval
}
```

## Testing Checklist

```bash
# 1. Start PostgreSQL
docker-compose up -d postgres

# 2. Run Gateway with API key
export ANTHROPIC_API_KEY=sk-ant-api03-xxx
pnpm gateway:dev

# 3. Test basic operations
# - Create task (should work)
# - List tasks (should work)
# - Complete task (should work)

# 4. Test approval flow
# - Create task with requiresApproval: true
# - Try to execute (should wait)
# - Approve via tasks.approve
# - Execute completes

# 5. Test kill switch
# - pnpm sowwy pause --reason "testing"
# - Verify scheduler stops
# - pnpm sowwy resume
# - Verify scheduler resumes

# 6. Test circuit breaker
# - Make 5 failing API calls
# - Verify breaker opens
# - Wait cooldown
# - Verify breaker half-opens
```

## The Attractive Part

### What This Enables

1. **Project Development**
   - AI reviews PRs, writes code, runs tests
   - Summon AI for code review via WhatsApp
   - AI manages CI/CD pipeline

2. **File Organization**
   - AI organizes downloads, documents, photos
   - Learns your folder preferences
   - Suggests better organization

3. **Email Management**
   - AI reads and drafts responses
   - Categorizes emails by priority
   - Flags important messages for you

4. **Web Browser**
   - AI fills out forms, researches topics
   - Compares prices, finds information
   - Automates repetitive web tasks

5. **Personal Assistant**
   - Answer questions about your files
   - Schedule meetings based on your preferences
   - Draft documents in your style

### The Value Proposition

> **"An AI that knows you, respects your boundaries, and gets things done"**

- **Knows you**: Identity model remembers your preferences
- **Respects boundaries**: Approval gates for sensitive actions  
- **Gets things done**: Autonomous for routine tasks, assisted for complex ones

## Security Best Practices

1. **Never bind Gateway to public IP**
   ```
   bind: 127.0.0.1  # ✅ Good
   bind: 0.0.0.0    # ❌ Bad - anyone can connect
   ```

2. **Rotate API keys monthly**
   ```
   # In .env
   ANTHROPIC_API_KEY=sk-ant-xxx  # Rotate every 30 days
   ```

3. **Review audit logs daily**
   ```bash
   # Check for anomalies
   pnpm sowwy audit --recent --format json | jq '.[] | select(.action == "email.send")'
   ```

4. **Use approval for new extensions**
   - When adding DeskIn, require approval initially
   - Only enable autonomous mode after testing

5. **Separate credentials for prod/dev**
   ```
   # development
   ANTHROPIC_API_KEY=sk-ant-dev-xxx
   
   # production  
   ANTHROPIC_API_KEY=sk-ant-prod-xxx
   ```

## Next Steps

1. **Add your API keys to `.env`**
2. **Start PostgreSQL with `docker-compose up -d postgres`**
3. **Run `pnpm gateway:dev`**
4. **Test basic operations**
5. **Enable extensions one by one**
6. **Configure approval gates**
7. **Set up monitoring**
