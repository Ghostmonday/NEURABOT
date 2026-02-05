# 🧠 NEURABOT — The Ultimate Autonomous AI Orchestration Platform

> **Super Output Workforce Intelligence Entity (SOWWY)** — An AI that learns who you are, understands your context, and executes tasks autonomously with zero-trust security. This isn't just a fork—it's a complete transformation of OpenClaw into a self-managing AI workforce.

---

## 🎯 What Makes NEURABOT Special

This repository represents a **complete reimagining** of what an AI assistant can be. Starting from the excellent foundation of [OpenClaw](https://github.com/openclaw/openclaw), NEURABOT adds **SOWWY** — a sophisticated autonomous agent orchestration system that transforms a simple chatbot into a **self-managing AI workforce** that learns, adapts, and operates with enterprise-grade security.

### The Vision

Imagine an AI that:

- **Learns who you are** from every conversation, building a comprehensive identity model
- **Routes tasks intelligently** across specialized personas (LegalOps, ChiefOfStaff, Dev, RnD)
- **Manages itself** with a full task OS, scheduling, retry logic, and failure recovery
- **Protects you** with zero-trust security, approval gates, and automatic threat detection
- **Remembers everything** with persistent memory consolidation across all sessions
- **Operates autonomously** while always asking permission for critical actions

**That's NEURABOT.**

---

## 🚀 What You Get That Others Don't

### 1. **Identity Learning System** 🧬

**The Problem:** Traditional AI assistants treat every conversation as isolated. They don't learn who you are, what you care about, or how you work.

**The Solution:** SOWWY extracts and stores **8 categories of identity information** from every conversation:

1. **goal** — What you want to achieve (short-term and long-term)
2. **constraint** — Hard limits, non-negotiables, boundaries
3. **preference** — Soft preferences, style choices, how you like things done
4. **belief** — Values, stances, worldview, principles
5. **risk** — Known risks, fears, concerns, what you avoid
6. **capability** — Skills, strengths, resources, what you can do
7. **relationship** — People, organizations, dynamics, connections
8. **historical_fact** — Past events, experiences, context

**How It Works:**

- Automatically extracts identity fragments from conversations using LLM analysis
- Stores in **LanceDB** for semantic similarity search (vector database)
- Never creates new categories — everything fits into the locked 8-category schema
- Retrieves relevant identity context before every task execution
- Improves over time as more conversations happen

**Example:**

```
User: "I prefer Python over JavaScript for backend work"
→ Extracted: preference: "Prefers Python over JavaScript for backend development"
→ Stored in LanceDB with semantic embedding
→ Retrieved automatically when discussing backend architecture
```

### 2. **Persona-Based Task Routing** 🎭

**The Problem:** One-size-fits-all AI assistants can't specialize. A coding task and a legal review need different expertise.

**The Solution:** SOWWY uses **4 specialized personas** with automatic priority-based arbitration:

```
LegalOps (Priority 1) > ChiefOfStaff (Priority 2) > Dev (Priority 3) > RnD (Priority 4)
```

**Persona Breakdown:**

- **LegalOps** (Highest Priority)
  - Compliance, contracts, legal documents
  - Sensitive decisions requiring legal review
  - Risk assessment and mitigation
  - Privacy and data protection

- **ChiefOfStaff** (High Priority)
  - Email management and synthesis
  - Scheduling and coordination
  - Information synthesis and summarization
  - Cross-functional communication

- **Dev** (Medium Priority)
  - Coding, debugging, architecture
  - Technical problem-solving
  - Code reviews and refactoring
  - Development workflows

- **RnD** (Lowest Priority)
  - Research and experimentation
  - Prototyping and exploration
  - Learning new technologies
  - Non-critical investigations

**Arbitration Logic:**

- When multiple personas could handle a task, the highest priority persona wins
- Example: A contract review goes to LegalOps even if Dev could technically read it
- Prevents task duplication and ensures proper expertise

### 3. **Mission Control Task OS** 🎮

**The Problem:** Traditional assistants have no task management. Everything is ad-hoc, no scheduling, no retry logic, no audit trail.

**The Solution:** SOWWY includes a **complete task operating system** built on PostgreSQL:

**Features:**

- **Priority Queue**: Tasks sorted by priority, persona, and timestamp
- **Automatic Scheduling**: Polls every 5 seconds for ready tasks
- **Retry Logic**: Up to 3 automatic retries with exponential backoff
- **Stuck Task Detection**: Identifies tasks stuck for >1 hour and recovers
- **Full Audit Logging**: Every action logged with timestamps, user, and context
- **PostgreSQL Persistence**: Tasks survive restarts and crashes

**Task Lifecycle:**

```
1. Task Created → Queued (pending)
2. Scheduler Picks Up → In Progress
3. Execution → Success/Failure
4. On Failure → Retry (up to 3 times)
5. On Stuck → Recovery Action
6. Completion → Audit Log Entry
```

**Example Task:**

```json
{
  "id": "task-123",
  "persona": "ChiefOfStaff",
  "priority": 5,
  "status": "pending",
  "created_at": "2026-02-04T20:00:00Z",
  "payload": {
    "action": "email.synthesize",
    "thread_id": "thread-456"
  },
  "retry_count": 0,
  "max_retries": 3
}
```

### 4. **Zero-Trust Security Model** 🔒

**The Problem:** AI assistants can be dangerous. They might send emails, make purchases, or access sensitive systems without proper safeguards.

**The Solution:** SOWWY implements **zero-trust security** with mandatory approval gates:

**Approval Gates (ALWAYS Required):**

- `email.send` — Sending emails (prevents accidental sends)
- `browser.navigate` — Auto navigation (prevents malicious redirects)
- `financial.transaction` — Any spending (prevents unauthorized purchases)
- `hostinger.vps.create` — Provisioning servers (prevents resource waste)
- `hostinger.vps.stop` — Stopping production servers (prevents downtime)
- `persona.override` — Changing persona behavior (prevents hijacking)

**Security Features:**

- **SMT Throttling**: Rate limiting (100 prompts per 5-hour window, 80% target utilization)
- **Emergency Kill Switch**: `SOWWY_KILL_SWITCH=true` immediately stops all operations
- **Automatic PII Redaction**: Scrubs phone numbers, emails, credentials from logs
- **Environment Validation**: Strict checking of all environment variables
- **Circuit Breakers**: Automatic failure detection and recovery

**Threat Model:**

- **Attack Vector**: Malicious prompt injection
- **Mitigation**: Approval gates, input validation, persona restrictions
- **Attack Vector**: Unauthorized resource access
- **Mitigation**: Zero-trust model, explicit permissions, audit logging

### 5. **Memory Consolidation System** 🧠

**The Problem:** Traditional assistants lose context between sessions. They don't remember preferences or learn from past decisions.

**The Solution:** SOWWY includes **persistent memory consolidation**:

**How It Works:**

1. **Extraction**: Pulls preferences and decisions from conversations
2. **Consolidation**: Merges duplicates, prioritizes recent information
3. **Dual Storage**: PostgreSQL (structured) + LanceDB (semantic)
4. **Retrieval**: Semantic similarity search for relevant memories

**Memory Types:**

- **Preferences**: "User prefers dark mode", "User likes concise responses"
- **Decisions**: "User chose option A over option B", "User rejected feature X"
- **Context**: "User is working on project Y", "User's current focus is Z"

**Example:**

```
Conversation 1: "I prefer Python"
Conversation 2: "Python is my favorite language"
→ Consolidated: Single memory: "User strongly prefers Python"
→ Retrieved automatically in future coding discussions
```

### 6. **Extension Ecosystem** 🔌

**The Problem:** Limited integrations. Need to connect to various services manually.

**The Solution:** SOWWY includes **custom extensions** for seamless integration:

**Available Extensions:**

- **Hostinger VPS Management**
  - Provision and manage VPS instances
  - Start/stop servers programmatically
  - Monitor resource usage
  - Automatic approval gates for destructive actions

- **Twilio SMS Gateway**
  - Send and receive SMS messages
  - Two-way communication via phone
  - Integration with task system for SMS-based commands

- **Proton Email Integration**
  - Secure email handling via ProtonMail
  - Email synthesis and summarization
  - Thread management and organization

- **Tuta Mail Support**
  - Privacy-focused email integration
  - End-to-end encrypted communication
  - Secure email workflows

- **DeskIn Mac Control**
  - Remote desktop control
  - Screen sharing and management
  - Cross-platform device control

**Configuration:**
All extensions configured via `.env` file with secure credential storage.

---

## 🛠️ Customizations & Enhancements

### Model Configuration: MiniMax M2.1

**Why MiniMax M2.1?**

- **Cost-Effective**: Competitive pricing compared to OpenAI/Anthropic
- **High Quality**: Excellent reasoning and code generation
- **Anthropic-Compatible API**: Easy integration with existing code
- **Global & CN Endpoints**: Flexible deployment options

**Configuration:**

- Primary model: `minimax/MiniMax-M2.1`
- Base URL: `https://api.minimax.io/anthropic`
- API Type: `anthropic-messages` (compatible with Claude API)
- Context Window: 192,000 tokens
- Max Tokens: 65,536

**Setup Process:**

1. Added MiniMax API key to `.env` file
2. Configured provider in `models.providers.minimax`
3. Set as primary model: `agents.defaults.model.primary = "minimax/MiniMax-M2.1"`
4. Created auth profile: `~/.openclaw/agents/main/agent/auth-profiles.json`

### Browser Support: Firefox Integration

**The Enhancement:**
Added support for Firefox as the default browser (instead of Chrome/Chromium).

**Implementation:**

- Modified `src/commands/onboard-helpers.ts`
- Added `BROWSER` and `OPENCLAW_BROWSER` environment variable support
- Linux: Uses `BROWSER` env var to override `xdg-open` default
- macOS: Uses `open -a <browser>` when `BROWSER` is set
- Respects user preference for privacy-focused browsers

**Usage:**

```bash
BROWSER=firefox pnpm openclaw dashboard
```

### Environment Configuration

**Comprehensive `.env` Setup:**

- **MiniMax API**: Primary model configuration
- **PostgreSQL**: Mission Control task storage
- **LanceDB**: Identity vector storage
- **SMT Throttling**: Rate limiting configuration
- **Scheduler**: Task polling and retry settings
- **Security**: Kill switch and approval gates
- **Extensions**: Twilio, Proton, Tuta Mail, DeskIn credentials

**Security Notes:**

- `.env` file is gitignored (never committed)
- `.env.example` provided as template
- All sensitive values use secure storage
- Automatic redaction in logs

### Gateway Configuration

**Custom Gateway Setup:**

- Port: `18789` (default)
- Auth Mode: `token` (secure token-based authentication)
- Bind Mode: `local` (loopback only, secure by default)
- Control UI: Enabled with tokenized URLs
- WebSocket: Full support for real-time communication

**Token Management:**

- Auto-generated secure tokens
- Stored in config: `gateway.auth.token`
- Tokenized dashboard URLs for easy access
- Environment variable support: `OPENCLAW_GATEWAY_TOKEN`

---

## 📋 Complete Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    SOWWY MISSION CONTROL                    │
│  • PostgreSQL Task Store (persistent queue)               │
│  • Priority-based Scheduler (5s polling)                  │
│  • Retry Logic (3 attempts, exponential backoff)          │
│  • Stuck Task Detection (1 hour threshold)                │
│  • Full Audit Logging (every action tracked)              │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌──────────────────┐
│ IDENTITY MODEL│  │ MEMORY SYSTEM │  │ SECURITY LAYER   │
│ • 8 Categories│  │ • Extraction  │  │ • Zero-trust     │
│ • LanceDB     │  │ • Consolidation│  │ • Approval gates │
│ • Semantic    │  │ • Dual Storage │  │ • SMT Throttling │
│   Search      │  │ • Retrieval   │  │ • Circuit Breaker│
└───────────────┘  └───────────────┘  └──────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌──────────────────┐
│   PERSONAS    │  │   EXTENSIONS   │  │   MONITORING    │
│ • LegalOps    │  │ • Hostinger    │  │ • Prometheus     │
│ • ChiefOfStaff│  │ • Twilio       │  │ • Health Checks  │
│ • Dev         │  │ • Proton/Tuta  │  │ • Metrics Export │
│ • RnD         │  │ • DeskIn       │  │ • Error Tracking │
└───────────────┘  └───────────────┘  └──────────────────┘
```

### Data Flow

```
User Message
    ↓
Gateway (WebSocket/HTTP)
    ↓
Session Management
    ↓
Identity Context Retrieval (LanceDB)
    ↓
Persona Selection (Priority Arbitration)
    ↓
Task Creation (PostgreSQL)
    ↓
Scheduler Picks Up Task
    ↓
Execution (with Approval Gates)
    ↓
Memory Extraction & Consolidation
    ↓
Response Generation (MiniMax M2.1)
    ↓
Audit Logging
    ↓
User Response
```

### Security Flow

```
Task Request
    ↓
Security Check (Approval Gate?)
    ↓
YES → Require Human Approval → User Approves? → Execute
    ↓
NO → Execute Directly
    ↓
SMT Throttle Check (Rate Limit?)
    ↓
Circuit Breaker Check (System Healthy?)
    ↓
Execute with Audit Logging
    ↓
PII Redaction in Logs
    ↓
Response
```

---

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js**: ≥22 (check with `node --version`)
- **PostgreSQL**: Optional but recommended for Mission Control
- **pnpm**: Package manager (install with `npm install -g pnpm`)

### Installation

```bash
# Clone the repository
git clone https://github.com/Ghostmonday/NEURABOT.git
cd NEURABOT

# Install dependencies
pnpm install

# Build the project
pnpm build

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env  # or your preferred editor
```

### Configuration

**1. Set MiniMax API Key:**

```bash
# In .env file
MINIMAX_API_KEY=sk-cp-your-key-here
```

**2. Configure PostgreSQL (Optional):**

```bash
# In .env file
SOWWY_POSTGRES_HOST=localhost
SOWWY_POSTGRES_PORT=5432
SOWWY_POSTGRES_USER=sowwy
SOWWY_POSTGRES_PASSWORD=your-secure-password
SOWWY_POSTGRES_DB=sowwy
```

**3. Set Up Identity Storage:**

```bash
# In .env file (auto-created if not exists)
SOWWY_IDENTITY_PATH=./data/identity
```

**4. Configure Extensions (Optional):**

```bash
# Twilio SMS
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Proton Email
PROTON_EMAIL=your@email.com
PROTON_PASSWORD=your-password

# Tuta Mail
TUTA_EMAIL=your@tuta.com
TUTA_PASSWORD=your-password
```

### Running NEURABOT

**Start the Gateway:**

```bash
# Development mode
pnpm gateway:dev

# Production mode
pnpm openclaw gateway --port 18789

# With custom browser (Firefox)
BROWSER=firefox pnpm openclaw dashboard
```

**Access the Dashboard:**

```bash
# Opens browser automatically
pnpm openclaw dashboard

# Or manually visit
http://127.0.0.1:18789/?token=YOUR_TOKEN
```

**Build UI Assets:**

```bash
# Required for Control UI
pnpm ui:build
```

### First-Time Setup

```bash
# Run onboarding wizard
pnpm openclaw onboard

# Or configure manually
pnpm openclaw configure

# Set primary model
pnpm openclaw models set minimax/MiniMax-M2.1

# Check status
pnpm openclaw status --deep
```

---

## 🔧 Development

### Project Structure

```
NEURABOT/
├── src/                    # Main source code
│   ├── sowwy/             # SOWWY core modules
│   │   ├── identity/      # Identity learning system
│   │   ├── memory/        # Memory consolidation
│   │   ├── mission/       # Mission Control task OS
│   │   ├── security/      # Security layer
│   │   └── integrations/  # Extension integrations
│   ├── commands/          # CLI commands
│   ├── gateway/           # Gateway server
│   └── agents/            # Agent orchestration
├── extensions/            # Plugin extensions
├── skills/                # Agent skills
├── docs/                  # Documentation
├── scripts/               # Build and utility scripts
└── ui/                    # Control UI (React/Vite)
```

### Key Files Modified/Created

**Core SOWWY Modules:**

- `src/sowwy/identity/` — Identity learning and storage
- `src/sowwy/memory/` — Memory consolidation system
- `src/sowwy/mission/` — Task OS and scheduler
- `src/sowwy/security/` — Zero-trust security layer

**Configuration:**

- `.env` — Environment variables (gitignored)
- `.env.example` — Template for environment setup
- `~/.openclaw/openclaw.json` — Main configuration file
- `~/.openclaw/agents/main/agent/auth-profiles.json` — Auth credentials

**Customizations:**

- `src/commands/onboard-helpers.ts` — Added Firefox browser support
- `src/commands/onboard-auth.config-minimax.ts` — MiniMax configuration
- Various extension integrations in `src/sowwy/integrations/`

### Building

```bash
# Type check
pnpm check

# Build TypeScript
pnpm build

# Build UI
pnpm ui:build

# Watch mode (development)
pnpm watch-node
```

### Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run live tests (requires API keys)
pnpm test:live
```

### Code Quality

```bash
# Lint and format
pnpm check

# Type check only
pnpm typecheck

# Format only
pnpm format
```

---

## 📊 Monitoring & Observability

### Metrics

SOWWY exports Prometheus-compatible metrics:

- **Task Throughput**: Tasks processed per second
- **SMT Utilization**: Rate limit usage percentage
- **Identity Counts**: Fragments stored per category
- **Circuit Breaker States**: Health status of components
- **Error Rates**: Failures per component

### Health Checks

```bash
# Check gateway health
pnpm openclaw health

# Deep status check
pnpm openclaw status --deep

# Security audit
pnpm openclaw security audit --deep
```

### Logging

- **Gateway Logs**: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`
- **Task Audit**: PostgreSQL `tasks` table
- **Identity Logs**: LanceDB transaction logs
- **Security Events**: Redacted and stored securely

---

## 🔐 Security Best Practices

### Environment Variables

- **Never commit `.env`** — Always gitignored
- **Use `.env.example`** — Template for others
- **Rotate credentials** — Regularly update API keys
- **Use secrets vault** — For production deployments

### Approval Gates

**Always require approval for:**

- Email sending
- Browser navigation
- Financial transactions
- VPS provisioning/stopping
- Persona overrides

**Never auto-approve these actions**, even if requested.

### Network Security

- **Gateway bind**: Use `loopback` for local-only access
- **Token auth**: Always enable token-based authentication
- **HTTPS**: Use reverse proxy (nginx/traefik) for production
- **Firewall**: Restrict access to gateway port

### Data Protection

- **PII Redaction**: Automatic scrubbing in logs
- **Credential Storage**: Secure auth profile storage
- **Audit Logging**: Complete action history
- **Encryption**: Use encrypted storage for sensitive data

---

## 🎓 How SOWWY Works (Deep Dive)

### Identity Learning Process

1. **Extraction Phase:**
   - LLM analyzes conversation for identity-relevant information
   - Categorizes into 8 predefined categories
   - Extracts structured fragments with confidence scores

2. **Storage Phase:**
   - Fragments stored in LanceDB with semantic embeddings
   - Enables similarity search for context retrieval
   - Timestamped for recency prioritization

3. **Retrieval Phase:**
   - Before task execution, queries LanceDB for relevant identity
   - Uses semantic similarity (cosine distance)
   - Filters by category if needed
   - Injects into system prompt for context-aware execution

### Persona Arbitration Algorithm

```python
def select_persona(task):
    candidates = []

    # Check each persona's capabilities
    for persona in [LegalOps, ChiefOfStaff, Dev, RnD]:
        if persona.can_handle(task):
            candidates.append(persona)

    # Return highest priority persona
    return max(candidates, key=lambda p: p.priority)
```

**Priority Order:**

1. LegalOps (Priority 1) — Legal, compliance, sensitive
2. ChiefOfStaff (Priority 2) — Email, coordination, synthesis
3. Dev (Priority 3) — Coding, technical, development
4. RnD (Priority 4) — Research, experimentation, exploration

### Task Scheduling Algorithm

```python
def schedule_tasks():
    while True:
        # Get ready tasks (priority-ordered)
        ready_tasks = db.get_ready_tasks()

        for task in ready_tasks:
            # Check if stuck (>1 hour)
            if task.age > STUCK_THRESHOLD:
                handle_stuck_task(task)
                continue

            # Execute task
            try:
                execute_task(task)
                task.status = "completed"
            except Exception as e:
                # Retry logic
                if task.retry_count < MAX_RETRIES:
                    task.retry_count += 1
                    schedule_retry(task, exponential_backoff(task.retry_count))
                else:
                    task.status = "failed"
                    log_error(task, e)

        sleep(POLL_INTERVAL)
```

### Memory Consolidation Process

1. **Extraction**: Pull preferences/decisions from conversations
2. **Deduplication**: Merge similar memories
3. **Prioritization**: Recent information weighted higher
4. **Storage**: Dual storage (PostgreSQL + LanceDB)
5. **Retrieval**: Semantic search for relevant memories

---

## 📚 Documentation

### Core Documentation

- **[Sowwy Architecture](docs/SOWWY_ARCHITECTURE.md)** — Complete system design
- **[Quick Start Guide](docs/SOWWY_QUICKSTART.md)** — Get running in minutes
- **[Memory Research](docs/SOWWY_MEMORY_RESEARCH.md)** — How identity learning works
- **[VPS Security](docs/SOWWY_VPS_SECURITY.md)** — Hardening guide
- **[Secrets Vault](docs/SOWWY_SECRETS_VAULT.md)** — Secure credential management
- **[Systemd Hardening](docs/SOWWY_SYSTEMD_HARDENING.md)** — Production deployment

### OpenClaw Documentation

- **[OpenClaw Docs](https://docs.openclaw.ai)** — Original OpenClaw documentation
- **[Gateway Configuration](docs/gateway/configuration.md)** — Gateway setup
- **[Model Providers](docs/concepts/model-providers.md)** — Model configuration
- **[Channels](docs/channels/index.md)** — Messaging platform integration

---

## 🆚 Comparison: OpenClaw vs NEURABOT

| Feature             | OpenClaw            | NEURABOT (Sowwy)                         |
| ------------------- | ------------------- | ---------------------------------------- |
| **Task Management** | Manual CLI commands | Autonomous task OS with PostgreSQL       |
| **Identity**        | Static prompts      | Learns from conversations (8 categories) |
| **Personas**        | Single agent        | Multi-persona with priority arbitration  |
| **Memory**          | Session-only        | Persistent consolidation across sessions |
| **Security**        | Basic allowlists    | Zero-trust with approval gates           |
| **Monitoring**      | Basic logs          | Prometheus metrics + circuit breakers    |
| **Extensions**      | Channel plugins     | VPS, SMS, Email, Remote desktop          |
| **Model**           | Configurable        | Optimized for MiniMax M2.1               |
| **Browser**         | Chrome/Chromium     | Firefox support added                    |
| **Task Scheduling** | None                | Full scheduler with retry logic          |
| **Audit Logging**   | Basic               | Complete PostgreSQL audit trail          |

---

## 🎯 Use Cases

### Personal Assistant

- **Email Management**: ChiefOfStaff persona synthesizes and organizes emails
- **Task Scheduling**: Mission Control manages your todo list autonomously
- **Information Retrieval**: Identity system remembers your preferences

### Development Workflow

- **Code Reviews**: Dev persona analyzes and suggests improvements
- **Architecture Decisions**: LegalOps persona ensures compliance
- **Research**: RnD persona explores new technologies

### Business Operations

- **Contract Review**: LegalOps persona analyzes legal documents
- **Resource Management**: Hostinger extension manages VPS infrastructure
- **Communication**: Twilio/Email extensions handle multi-channel messaging

---

## 🤝 Contributing

This is a personal fork with specific customizations. However, if you find this useful:

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

### Code Standards

- **TypeScript**: Strict typing, no `any`
- **Formatting**: oxfmt and oxlint
- **Testing**: Vitest with 70% coverage threshold
- **Documentation**: Update README and docs for new features

---

## 📝 Changelog

### Recent Changes

- **Firefox Browser Support**: Added `BROWSER` env var support for Firefox
- **MiniMax Configuration**: Complete setup for MiniMax M2.1 as primary model
- **Gateway Token Auth**: Secure token-based authentication configured
- **UI Assets**: Built Control UI for dashboard access
- **Environment Setup**: Comprehensive `.env` configuration

### Major Features

- **SOWWY Identity Learning**: 8-category identity extraction system
- **Persona Arbitration**: Multi-persona task routing with priorities
- **Mission Control**: PostgreSQL-based task OS with scheduling
- **Zero-Trust Security**: Approval gates and threat detection
- **Memory Consolidation**: Persistent memory across sessions
- **Extension Ecosystem**: Hostinger, Twilio, Proton, Tuta, DeskIn

---

## 🐛 Troubleshooting

### Gateway Won't Start

```bash
# Check if port is in use
lsof -i :18789

# Check configuration
pnpm openclaw config get gateway

# Check logs
tail -f /tmp/gateway.log
```

### Model Not Responding

```bash
# Check model status
pnpm openclaw models status

# Verify API key
echo $MINIMAX_API_KEY

# Check auth profile
cat ~/.openclaw/agents/main/agent/auth-profiles.json
```

### Tasks Not Executing

```bash
# Check PostgreSQL connection
psql -h localhost -U sowwy -d sowwy

# Check scheduler status
pnpm openclaw status --deep

# Check task queue
# (Query PostgreSQL tasks table)
```

### Identity Not Learning

```bash
# Check LanceDB path
ls -la ./data/identity

# Verify identity extraction
# (Check gateway logs for identity extraction messages)

# Check identity fragments
# (Query LanceDB or check identity store)
```

---

## 📄 License

MIT License — See LICENSE file for details.

---

## 🙏 Credits & Acknowledgments

**Built on [OpenClaw](https://github.com/openclaw/openclaw)** by Peter Steinberger and the amazing OpenClaw community.

**SOWWY (Super Output Workforce Intelligence Entity)** extends OpenClaw with:

- Autonomous agent orchestration
- Identity learning system
- Zero-trust security model
- Persistent memory consolidation
- Multi-persona task routing
- Enterprise-grade task management

**Special Thanks:**

- OpenClaw team for the excellent foundation
- MiniMax for providing the M2.1 model
- All extension providers (Hostinger, Twilio, Proton, Tuta, DeskIn)
- The open-source community for inspiration and tools

---

## 🌟 Why NEURABOT?

This isn't just another AI assistant. This is **your AI workforce** — a system that learns who you are, understands your context, and operates autonomously while always respecting your boundaries.

**NEURABOT** = **OpenClaw** + **SOWWY** + **Your Vision**

Welcome to the future of autonomous AI orchestration. 🚀

---

**Made with ❤️ by Ghostmonday**

_"Building the AI workforce of tomorrow, today."_
