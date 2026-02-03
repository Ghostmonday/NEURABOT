# Sowwy Implementation Guide for Speed Demon

**MiniMax M2.1 - Ready to Implement the Remaining Components**

---

## Current State: What's Already Done ✅

### Core Schemas & Interfaces

| File | Status | Description |
|------|--------|-------------|
| [`src/sowwy/mission-control/schema.ts`](src/sowwy/mission-control/schema.ts) | ✅ Complete | Task, Category, Persona, Status enums with TypeBox |
| [`src/sowwy/mission-control/store.ts`](src/sowwy/mission-control/store.ts) | ✅ Complete | TaskStore interface with all CRUD + audit |
| [`src/sowwy/mission-control/pg-store.ts`](src/sowwy/mission-control/pg-store.ts) | ✅ Complete | Full PostgreSQL implementation with transactions |
| [`src/sowwy/mission-control/scheduler.ts`](src/sowwy/mission-control/scheduler.ts) | ✅ Complete | TaskScheduler with priority queuing + stuck detection |

### Identity Model

| File | Status | Description |
|------|--------|-------------|
| [`src/sowwy/identity/fragments.ts`](src/sowwy/identity/fragments.ts) | ✅ Complete | 8 LOCKED categories: goal, constraint, preference, belief, risk, capability, relationship, historical_fact |
| [`src/sowwy/identity/store.ts`](src/sowwy/identity/store.ts) | ✅ Complete | IdentityStore interface with search + similarity |
| [`src/sowwy/identity/lancedb-store.ts`](src/sowwy/identity/lancedb-store.ts) | ✅ Complete | Full LanceDB implementation with vector search |

### Personas

| File | Status | Description |
|------|--------|-------------|
| [`src/sowwy/personas/priority.ts`](src/sowwy/personas/priority.ts) | ✅ Complete | Priority constants: LegalOps > ChiefOfStaff > Dev > RnD |
| [`src/sowwy/personas/router.ts`](src/sowwy/personas/router.ts) | ✅ Complete | PersonaRouter with arbitration logic |

### Security & SMT

| File | Status | Description |
|------|--------|-------------|
| [`src/sowwy/security/policy.ts`](src/sowwy/security/policy.ts) | ✅ Complete | Zero-trust model, approval gates, threat model |
| [`src/sowwy/security/redact.ts`](src/sowwy/security/redact.ts) | ✅ Complete | Secrets redaction for logs |
| [`src/sowwy/smt/throttler.ts`](src/sowwy/smt/throttler.ts) | ✅ Complete | SMT with protection scope (identity/audit never throttled) |

### Gateway Integration

| File | Status | Description |
|------|--------|-------------|
| [`src/sowwy/gateway/rpc-methods.ts`](src/sowwy/gateway/rpc-methods.ts) | ✅ Complete | Task RPC, Identity RPC, System Control methods |
| [`src/sowwy/extensions/integration.ts`](src/sowwy/extensions/integration.ts) | ⚠️ Needs Integration | Extension registration + approval gates |

---

## What Needs Implementation 🚨

### 1. Gateway Integration (HIGHEST PRIORITY)

**File**: [`src/sowwy/gateway/rpc-methods.ts`](src/sowwy/gateway/rpc-methods.ts)

Currently exports interfaces only. Need to:

```typescript
// SPEED DEMON: Implement these interfaces

import { Gateway } from "openclaw/gateway";
import { TaskScheduler } from "../mission-control/scheduler.js";
import { PostgresTaskStore } from "../mission-control/pg-store.js";
import { LanceDBIdentityStore } from "../identity/lancedb-store.js";
import { SMTThrottler } from "../smt/throttler.js";

export async function registerSowwyRPCMethods(
  gateway: Gateway,
  scheduler: TaskScheduler,
  taskStore: PostgresTaskStore,
  identityStore: LanceDBIdentityStore,
  smt: SMTThrottler
): Promise<void> {
  // IMPLEMENTATION_HERE
  
  // Register task methods
  gateway.registerMethod("tasks.list", async (filter) => {
    return taskStore.list(filter);
  });
  
  gateway.registerMethod("tasks.create", async (input) => {
    return taskStore.create(input);
  });
  
  // Register identity methods
  gateway.registerMethod("identity.search", async (query, options) => {
    return identityStore.search(query, options);
  });
  
  // Register system control
  gateway.registerMethod("sowwy.pause", async (reason) => {
    smt.pause();
    return { success: true, reason };
  });
  
  gateway.registerMethod("sowwy.resume", async () => {
    smt.resume();
    return { success: true };
  });
}
```

### 2. Extension Registration (HIGH PRIORITY)

**File**: [`src/sowwy/extensions/integration.ts`](src/sowwy/extensions/integration.ts)

Currently has inline types only. Need to:

```typescript
// SPEED DEMON: Implement extension registration

import { ExtensionContext } from "openclaw/plugin-sdk";
import { HostingerClient } from "../../extensions/hostinger/index.js";
import { ProtonEmailClient } from "../../extensions/proton-email/index.js";
import { TwilioSMSClient } from "../../extensions/twilio-sms/index.js";
import { ApprovalGateRegistry } from "../security/policy.js";

export async function registerSowwyExtensions(
  ctx: ExtensionContext,
  approvalGates: ApprovalGateRegistry
): Promise<void> {
  // IMPLEMENTATION_HERE
  
  // Register Hostinger extension
  ctx.registerExtension("hostinger", async (api) => {
    const client = new HostingerClient({
      apiToken: api.getConfig("HOSTINGER_API_TOKEN"),
    });
    
    api.registerTool("hostinger.domains.list", async () => {
      return client.getDomainPortfolio();
    });
    
    // Approval gates for destructive operations
    api.registerApprovalGate("hostinger.vps.stop", async (args) => {
      // Check if VM is running, require approval
    });
  });
  
  // Register other extensions...
}
```

### 3. Main Entry Point (MEDIUM PRIORITY)

**File**: [`src/sowwy/index.ts`](src/sowwy/index.ts)

Already exports everything. The actual initialization needs to happen:

```typescript
// SPEED DEMON: Implement main initialization

import { createPostgresStores } from "./mission-control/pg-store.js";
import { createLanceDBIdentityStore } from "./identity/lancedb-store.js";
import { TaskScheduler } from "./mission-control/scheduler.js";
import { SMTThrottler } from "./smt/throttler.js";
import { registerSowwyRPCMethods } from "./gateway/rpc-methods.js";
import { registerSowwyExtensions } from "./extensions/integration.js";

export interface SowwyConfig {
  postgres: PostgresConfig;
  lancedb: LanceDbConfig;
  smt: SMTConfig;
  extensions: Record<string, unknown>;
}

export async function createSowwy(
  config: SowwyConfig,
  gateway: Gateway
): Promise<void> {
  // IMPLEMENTATION_HERE
  
  // 1. Initialize PostgreSQL
  const { tasks, audit, decisions } = await createPostgresStores(config.postgres);
  
  // 2. Initialize LanceDB
  const identity = await createLanceDBIdentityStore(config.lancedb);
  
  // 3. Initialize SMT
  const smt = new SMTThrottler(config.smt);
  
  // 4. Initialize Scheduler
  const scheduler = new TaskScheduler(tasks, identity, smt);
  
  // 5. Register RPC methods
  await registerSowwyRPCMethods(gateway, scheduler, tasks, identity, smt);
  
  // 6. Register extensions
  await registerSowwyExtensions(gateway, { /* config */ });
  
  // 7. Start scheduler
  await scheduler.start();
}
```

---

## Dependency Check

```bash
# Required packages (already in package.json or need to add)
pnpm add pg                    # PostgreSQL client ✓
pnpm add @lancedb/lancedb     # Vector database ✓
pnpm add @anthropic-ai/sdk     # For embeddings (optional)

# Development dependencies
pnpm add -D @types/pg         # TypeScript types ✓
```

---

## Quick Start Implementation Order

1. **Day 1**: Gateway RPC methods registration
2. **Day 2**: Extension registration (Hostinger, Proton, Twilio)
3. **Day 3**: Main entry point and initialization
4. **Day 4**: Testing and debugging

---

## Key Integration Points

### With OpenClaw Gateway

```typescript
import { Gateway } from "openclaw/gateway";

const gateway = new Gateway({
  port: 18789,
  bind: "127.0.0.1",
});

// Register Sowwy after gateway is running
gateway.on("ready", async () => {
  await createSowwy(config, gateway);
});
```

### With MiniMax M2.1

```typescript
import { MiniMaxProvider } from "openclaw/providers/minimax";

const provider = new MiniMaxProvider({
  apiKey: process.env.MINIMAX_API_KEY,
  model: "MiniMax-M2.1",
});

// Use in task execution
const result = await provider.complete({
  messages: contextMessages,
  maxTokens: 4096,
});
```

### With PostgreSQL

```typescript
// Connection is handled by pg-store.ts
// Just need to set environment variables:
process.env.SOWWY_POSTGRES_HOST = "localhost";
process.env.SOWWY_POSTGRES_PORT = "5432";
process.env.SOWWY_POSTGRES_USER = "sowwy";
process.env.SOWWY_POSTGRES_PASSWORD = "...";
process.env.SOWWY_POSTGRES_DB = "sowwy";
```

---

## Testing Checklist

- [ ] PostgreSQL connection works
- [ ] Task CRUD operations function
- [ ] Identity search returns results
- [ ] Scheduler picks up tasks
- [ ] SMT throttling prevents runaway
- [ ] Approval gates trigger correctly
- [ ] Extension tools are registered
- [ ] Gateway RPC methods respond

---

## Files Created for You

| File | Purpose |
|------|---------|
| [`docs/SOWWY_QUICKSTART.md`](docs/SOWWY_QUICKSTART.md) | Setup guide |
| [`docs/SOWWY_ARCHITECTURE.md`](docs/SOWWY_ARCHITECTURE.md) | Architecture overview |
| [`docs/SOWWY_VPS_SECURITY.md`](docs/SOWWY_VPS_SECURITY.md) | VPS hardening |
| [`docs/SOWWY_MEMORY_RESEARCH.md`](docs/SOWWY_MEMORY_RESEARCH.md) | Memory strategy |
| [`docs/OPENCLAW_INTEGRATION.md`](docs/OPENCLAW_INTEGRATION.md) | OpenClaw patterns |
| [`docs/workspace/AGENTS.md`](workspace/AGENTS.md) | Agent instructions |
| [`docs/workspace/SOUL.md`](workspace/SOUL.md) | Persona definition |
| [`docs/workspace/USER.md`](workspace/USER.md) | User context template |

---

## You're Ready!

All foundations are in place. The interfaces are clear, the schemas are validated, and the architecture is sound. Time to implement! 🚀
