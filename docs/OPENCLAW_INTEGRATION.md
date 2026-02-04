# OpenClaw Integration Guide for Sowwy

## Architecture Comparison

### OpenClaw Core Components

| Component           | Description                               | Sowwy Integration                                              |
| ------------------- | ----------------------------------------- | -------------------------------------------------------------- |
| **Gateway**         | Central RPC API at `ws://127.0.0.1:18789` | Sowwy registers `tasks.*`, `sowwy.*`, `identity.*` RPC methods |
| **Model Providers** | Configured via `models.providers.*`       | MiniMax M2.1 already configured via `minimax-portal-auth`      |
| **Extensions**      | Plugin system at `extensions/*`           | Sowwy extends via core code, not extension                     |
| **Skills**          | Skill system at `skills/*`                | 4 personas created: Dev, LegalOps, CoS, RnD                    |
| **Agents**          | Pi Agent runtime                          | Used for persona execution                                     |
| **Channels**        | WhatsApp, Telegram, etc.                  | Used for approval notifications                                |

### RPC Methods

**OpenClaw Built-in Methods:**

```json
{
  "status": {},
  "health": {},
  "last-heartbeat": {},
  "models.list": {},
  "models.get": {},
  "models.select": {},
  "agents.list": {},
  "agents.get": {},
  "sessions.list": {},
  "sessions.get": {},
  "sessions.create": {},
  "sessions.delete": {}
}
```

**Sowwy Methods (to be registered):**

```json
{
  "tasks.list": { "filter": {} },
  "tasks.create": { "input": {} },
  "tasks.update": { "taskId": "", "input": {} },
  "tasks.get": { "taskId": "" },
  "tasks.nextReady": {},
  "tasks.approve": { "taskId": "" },
  "tasks.complete": { "taskId": "", "outcome": "", "summary": "", "confidence": 0.9 },
  "tasks.cancel": { "taskId": "", "reason": "" },
  "tasks.audit": { "taskId": "" },
  "tasks.decisions": { "taskId": "" },
  "sowwy.status": {},
  "sowwy.pause": { "reason": "" },
  "sowwy.resume": {},
  "identity.search": { "query": "", "options": {} },
  "identity.stats": {},
  "sowwy.metrics": {},
  "sowwy.health": {}
}
```

## MiniMax M2.1 Configuration

The `minimax-portal-auth` extension is already configured:

```bash
# Configure MiniMax OAuth
pnpm openclaw models auth login --provider minimax-portal

# Verify configuration
pnpm openclaw models list | grep minimax
```

**Model Reference:** `minimax-portal/MiniMax-M2.1`

**API Configuration:**

- Global endpoint: `https://api.minimax.io/anthropic`
- CN endpoint: `https://api.minimaxi.com/anthropic`
- API format: `anthropic-messages`
- Context window: 200,000 tokens
- Max tokens: 8,192

## Extension Integration Pattern

### Extension Structure (OpenClaw Standard)

```
extensions/
└── <extension-name>/
    ├── index.ts          # Plugin registration
    ├── config.ts          # Configuration schema
    ├── auth.ts           # Auth handlers
    └── README.md         # Documentation
```

### Sowwy vs Extension Approach

**Sowwy uses core code approach:**

```
src/sowwy/
├── mission-control/  # Task OS
├── identity/        # Identity Model
├── personas/        # Persona system
├── smt/            # Throttling
├── security/       # Security policies
├── integrations/    # External integrations
└── gateway/        # RPC methods
```

**Why not an extension?**

- Requires deep integration with core
- Needs access to internal stores (PostgreSQL, LanceDB)
- Scheduler needs to run continuously
- Identity model affects all persona execution

## Skill Integration

OpenClaw skills are at `skills/*`. Sowwy personas are:

| Persona        | Skill           | Category |
| -------------- | --------------- | -------- |
| Senior Dev     | `persona-dev`   | DEV      |
| LegalOps       | `persona-legal` | LEGAL    |
| Chief of Staff | `persona-cos`   | ADMIN    |
| R&D            | `persona-rnd`   | RND      |

### Skill Format

```yaml
---
name: persona-dev
description: Senior Developer persona for Sowwy
metadata:
  persona: true
  category: DEV
  always: true
---

# Senior Developer Persona

You are Amir's Senior Developer...

## Identity Context
{identity_fragments}
```

## Gateway Configuration

### Required Settings

```yaml
# gateway.yaml
bind: 127.0.0.1 # Loopback only - security
port: 18789
token: ${OPENCLAW_GATEWAY_TOKEN}
dmPolicy: pairing # Only paired devices

# Sowwy configuration
sowwy:
  postgres:
    host: localhost
    port: 5432
    database: sowwy
  identity:
    provider: lancedb
    path: ./data/identity
  smt:
    windowMs: 18000000 # 5 hours
    maxPrompts: 500
```

### Security Hardening

Per OpenClaw docs, Gateway should:

- Bind to `127.0.0.1` only (not public)
- Require token authentication
- Enforce pairing for DM access

## What Works vs What Needs Work

### ✅ Already Working

1. MiniMax M2.1 OAuth configuration
2. PostgreSQL in docker-compose
3. Task schema and validation
4. Identity fragment schema
5. Persona priority system
6. SMT throttler
7. Circuit breakers
8. Skills for all 4 personas
9. Extension stubs for Proton, Twilio, DeskIn

### ⚠️ Needs Integration

1. Sowwy RPC methods need to be registered with Gateway
2. PostgreSQL store implementation (pg-store.ts)
3. LanceDB store implementation (lancedb-store.ts)
4. Scheduler loop integration
5. Audit logging integration
6. Health check endpoints

### ❌ Not Implemented Yet

1. Extension implementations (Proton, Twilio, DeskIn)
2. WebChat identity panel
3. Full monitoring dashboard
4. Backup scripts

## Next Steps for Integration

### 1. Register RPC Methods

The Sowwy RPC methods need to be integrated with the Gateway's RPC registry. This requires:

```typescript
// In gateway startup
import { registerSowwyRPCMethods } from "./sowwy/gateway/rpc-methods.js";

const context = {
  stores: sowwyStores,
  identityStore: identityStore,
  smt: smtThrottler,
  userId: "system",
};

const sowwyMethods = registerSowwyRPCMethods(context);
gateway.registerMethods(sowwyMethods);
```

### 2. Implement Stores

```bash
# Priority order:
1. pg-store.ts    # PostgreSQL for tasks (blocking)
2. lancedb-store.ts  # LanceDB for identity (blocking)
3. audit-store.ts   # Audit logging
```

### 3. Connect Scheduler

```typescript
const scheduler = new TaskScheduler(pgStore, lancedbStore, smtThrottler);

scheduler.registerPersona("Dev", devExecutor);
scheduler.registerPersona("LegalOps", legalExecutor);
scheduler.registerPersona("ChiefOfStaff", cosExecutor);
scheduler.registerPersona("RnD", rndExecutor);

scheduler.start();
```

## Reference Docs

- OpenClaw Docs: https://docs.openclaw.ai
- Gateway RPC: See Gateway section in docs
- Extensions: See Extensions section in docs
- Model Providers: See Providers section in docs
