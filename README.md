# 🧠 NEURABOT — Autonomous AI Orchestration Platform

> **Super Output Workforce Intelligence Entity (SOWWY)** — An AI that learns who you are and executes tasks autonomously with zero-trust security.

---

## What Makes This Different

This isn't just another OpenClaw fork. **NEURABOT** adds **Sowwy** — a complete autonomous agent orchestration system that transforms OpenClaw from a chatbot into a **self-managing AI workforce**.

### 🎯 Core Innovation: Sowwy Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SOWWY MISSION CONTROL                    │
│  • Task OS with priority queuing & scheduling              │
│  • Persona arbitration (LegalOps > ChiefOfStaff > Dev)    │
│  • SMT throttling (rate limiting with safety gates)       │
│  • Circuit breakers & failure recovery                     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌──────────────────┐
│ IDENTITY MODEL│  │ MEMORY SYSTEM │  │ SECURITY LAYER   │
│ • Learns you  │  │ • Consolidates│  │ • Zero-trust     │
│ • 8 categories│  │ • Extracts    │  │ • Approval gates │
│ • Vector DB   │  │ • Multi-store │  │ • Data redaction │
└───────────────┘  └───────────────┘  └──────────────────┘
```

### 🚀 What You Get That Others Don't

**1. Identity Learning System**
- Extracts who you are from conversations (goals, constraints, preferences, beliefs, risks, capabilities, relationships, historical facts)
- Stores in LanceDB for semantic similarity search
- Automatically improves context over time

**2. Persona-Based Task Routing**
- **LegalOps** (highest priority): Compliance, contracts, sensitive decisions
- **ChiefOfStaff**: Email, scheduling, coordination, synthesis
- **Dev**: Coding, debugging, architecture
- **RnD**: Research, experimentation (lowest priority)
- Automatic arbitration when personas conflict

**3. Mission Control Task OS**
- PostgreSQL-backed task queue with priorities
- Automatic scheduling and retry logic
- Stuck task detection and recovery
- Full audit logging

**4. Zero-Trust Security Model**
- Mandatory approval gates for: email.send, browser.navigate, financial.transaction, VPS provisioning
- SMT throttling (100 prompts per 5-hour window, 80% target utilization)
- Emergency kill switch (`SOWWY_KILL_SWITCH=true`)
- Automatic PII/credential redaction in logs

**5. Memory Consolidation**
- Extracts preferences and decisions from conversations
- Consolidates duplicate memories
- Prioritizes recent information
- Dual storage: PostgreSQL (structured) + LanceDB (semantic)

**6. Extension Ecosystem**
- **Hostinger**: VPS provisioning and management
- **Twilio**: SMS gateway integration
- **Proton Email**: Secure email handling
- **Deskin**: Remote desktop control

---

## Quick Start

```bash
# Install
npm install -g openclaw@latest

# Run onboarding (configures MiniMax M2.1 automatically)
openclaw onboard --install-daemon

# Start Gateway
openclaw gateway --port 18789 --verbose

# Your AI assistant is now autonomous and learning
```

**Runtime:** Node.js ≥22

---

## How Sowwy Works

### Identity Learning (Automatic)

Sowwy extracts 8 categories of information about you:

1. **goal** — What you want to achieve
2. **constraint** — Hard limits, non-negotiables  
3. **preference** — Soft preferences, style choices
4. **belief** — Values, stances, worldview
5. **risk** — Known risks, fears, concerns
6. **capability** — Skills, strengths, resources
7. **relationship** — People, organizations, dynamics
8. **historical_fact** — Past events, experiences

**Never creates new categories.** Everything fits into this locked schema.

### Persona Arbitration

When multiple personas could handle a task:

```
LegalOps > ChiefOfStaff > Dev > RnD
```

**Example:** A contract review request goes to LegalOps (highest priority), even if Dev could technically read it.

### Task Execution Flow

1. **Parse request** → Check identity context → Plan → Execute → Summarize → Learn
2. **Express confidence** (0.0-1.0) for all decisions
3. **Suggest improvements** proactively
4. **Never commit secrets** (checks `.gitignore` before git operations)

### Approval Gates

**ALWAYS require human approval for:**
- `email.send` — Sending emails
- `browser.navigate` — Auto navigation
- `financial.transaction` — Any spending
- `hostinger.vps.create` — Provisioning servers
- `hostinger.vps.stop` — Stopping production servers
- `persona.override` — Changing persona behavior

**Never auto-approve these, even if requested.**

---

## Architecture

### Mission Control
- **Task Store**: PostgreSQL persistence with full CRUD + audit
- **Scheduler**: Priority queue, retry logic, stuck detection
- **Audit Log**: Complete history of all actions

### Identity Model
- **Fragments**: 8-category extraction from conversations
- **LanceDB Store**: Vector similarity search for context retrieval
- **Search**: Semantic similarity + category filtering

### Memory System
- **Extraction**: Pulls preferences/decisions from conversations
- **Consolidation**: Merges duplicates, prioritizes recent
- **Dual Storage**: PostgreSQL (structured) + LanceDB (semantic)

### Security
- **Policy Engine**: Zero-trust model with approval gates
- **Threat Model**: Defined attack vectors and mitigations
- **Redaction**: Automatic PII/credential scrubbing
- **Env Validation**: Strict environment variable checking

### Monitoring
- **Metrics**: Task throughput, SMT utilization, identity counts
- **Health Checks**: Circuit breaker states, error rates
- **Prometheus Export**: Standard metrics format

---

## Configuration

### Workspace Setup

Sowwy uses workspace files for agent configuration:

- `~/.openclaw/workspace/AGENTS.md` — Agent instructions
- `~/.openclaw/workspace/USER.md` — User context
- `~/.openclaw/workspace/SOUL.md` — Persona definition
- `~/.openclaw/workspace/TOOLS.md` — Available tools
- `~/.openclaw/workspace/IDENTITY.md` — Identity fragments

### Environment Variables

```bash
# PostgreSQL (optional - uses in-memory if not set)
SOWWY_POSTGRES_HOST=localhost
SOWWY_POSTGRES_PORT=5432
SOWWY_POSTGRES_USER=sowwy
SOWWY_POSTGRES_PASSWORD=secure-password
SOWWY_POSTGRES_DB=sowwy

# LanceDB for Identity (auto-created)
SOWWY_IDENTITY_PATH=~/.openclaw/sowwy-identity

# SMT Throttling
SOWWY_SMT_WINDOW_MS=18000000  # 5 hours
SOWWY_SMT_MAX_PROMPTS=100
SOWWY_SMT_TARGET_UTILIZATION=0.8

# Security
SOWWY_REQUIRE_APPROVAL=true
SOWWY_KILL_SWITCH=false
```

---

## Documentation

- **[Sowwy Architecture](docs/SOWWY_ARCHITECTURE.md)** — Complete system design
- **[Quick Start Guide](docs/SOWWY_QUICKSTART.md)** — Get running in minutes
- **[Memory Research](docs/SOWWY_MEMORY_RESEARCH.md)** — How identity learning works
- **[VPS Security](docs/SOWWY_VPS_SECURITY.md)** — Hardening guide
- **[Secrets Vault](docs/SOWWY_SECRETS_VAULT.md)** — Secure credential management
- **[Systemd Hardening](docs/SOWWY_SYSTEMD_HARDENING.md)** — Production deployment

---

## What's Different from Vanilla OpenClaw

| Feature | OpenClaw | NEURABOT (Sowwy) |
|---------|----------|------------------|
| Task Management | Manual CLI commands | Autonomous task OS with scheduling |
| Identity | Static prompts | Learns from conversations (8 categories) |
| Personas | Single agent | Multi-persona with priority arbitration |
| Memory | Session-only | Persistent consolidation across sessions |
| Security | Basic allowlists | Zero-trust with approval gates |
| Monitoring | Basic logs | Prometheus metrics + circuit breakers |
| Extensions | Channel plugins | VPS, SMS, Email, Remote desktop |

---

## Development

```bash
# Clone and setup
git clone https://github.com/Ghostmonday/NEURABOT.git
cd NEURABOT
pnpm install
pnpm build

# Run development gateway
pnpm gateway:dev

# Run tests
pnpm test

# Check code quality
pnpm check
```

---

## License

MIT

---

## Credits

Built on [OpenClaw](https://github.com/openclaw/openclaw) by Peter Steinberger and the community.

**Sowwy** (Super Output Workforce Intelligence Entity) extends OpenClaw with autonomous agent orchestration, identity learning, and zero-trust security.
