# OpenClaws System Configuration Report

**Date:** 2026-02-04
**Purpose:** Comprehensive analysis of OpenClaws/NEURABOT internal settings and components for maximizing agent capabilities

---

## Executive Summary

OpenClaws (now NEURABOT) is a sophisticated multi-agent AI orchestration platform featuring:

- **3-Tier Agent Architecture**: Sowwy (reasoning), Antigravity (execution), Scout (memory)
- **30+ Communication Plugins**: Matrix, Slack, Discord, WhatsApp, Telegram, iMessage, and more
- **Dual Memory Systems**: LanceDB (identity) + sqlite-vec (file memory)
- **Full-Stack TTS**: ElevenLabs, OpenAI, Edge TTS with auto-fallback
- **Browser Automation**: Playwright-based with CDP support
- **Canvas Rendering**: A2UI for native-like UI experiences

### Priority Configuration Settings

| Priority    | Component       | Setting                 | Recommended Value         |
| ----------- | --------------- | ----------------------- | ------------------------- |
| 🔴 Critical | Model Providers | `models.providers[]`    | OpenAI + Anthropic        |
| 🔴 Critical | TTS Provider    | `messages.tts.provider` | elevenlabs (best quality) |
| 🔴 Critical | Memory Backend  | `memory.backend`        | builtin (sqlite-vec)      |
| 🟠 High     | Cron Service    | `cron.enabled`          | true                      |
| 🟠 High     | Session Store   | `session.store`         | fs (file-system)          |
| 🟡 Medium   | Auto-Reply      | `autoReply.enabled`     | true                      |
| 🟡 Medium   | Hooks           | `hooks.enabled`         | true                      |
| 🟢 Standard | Browser         | `browser.type`          | chrome (default)          |

---

## 1. Text-to-Speech (TTS) Configuration

### Component Location

- **File**: [`src/tts/tts.ts`](src/tts/tts.ts)
- **Config Types**: [`src/config/types.tts.ts`](src/config/types.tts.ts)
- **Default Voice**: Edge TTS (no API key required)

### Providers

| Provider   | Quality    | Latency | API Key Required | Best For             |
| ---------- | ---------- | ------- | ---------------- | -------------------- |
| ElevenLabs | ⭐⭐⭐⭐⭐ | Medium  | Yes              | Premium voice output |
| OpenAI TTS | ⭐⭐⭐⭐   | Low     | Yes              | Fast, reliable       |
| Edge TTS   | ⭐⭐⭐     | Low     | No               | Free, no setup       |

### Configuration Schema

```typescript
// In openclaw.config.json5
{
  messages: {
    tts: {
      auto: "always" | "inbound" | "tagged" | "off",  // Auto-TTS mode
      mode: "final" | "all",                           // Apply to final/all messages
      provider: "elevenlabs" | "openai" | "edge",     // Primary provider
      summaryModel: "gpt-4o-mini",                     // Model for long-text summarization
      maxTextLength: 4096,                              // Hard cap for TTS text
      timeoutMs: 30000,                                // API timeout

      elevenlabs: {
        apiKey: "${ELEVENLABS_API_KEY}",
        voiceId: "pMsXgVXv3BLzUgSXRplE",            // Default voice
        modelId: "eleven_multilingual_v2",
        voiceSettings: {
          stability: 0.5,                              // 0-1, higher = more consistent
          similarityBoost: 0.75,                        // 0-1, higher = more like original
          style: 0.0,                                  // 0-1, ElevenLabs style parameter
          speed: 1.0,                                  // 0.5-2.0
          useSpeakerBoost: true,
        },
      },

      openai: {
        apiKey: "${OPENAI_API_KEY}",
        model: "gpt-4o-mini-tts",                     // Or tts-1, tts-1-hd
        voice: "alloy",                                // alloy, ash, coral, echo, fable, onyx, nova, sage, shimmer
      },

      edge: {
        enabled: true,
        voice: "en-US-MichelleNeural",
        lang: "en-US",
        outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        rate: "+0%",                                   // Speed adjustment
        pitch: "+0Hz",                                // Pitch adjustment
      },
    },
  },
}
```

### TTS Directives (Runtime Control)

Agents can control TTS behavior with inline directives:

```
[[tts:provider=elevenlabs]]
[[tts:voice=onyx]]
[[tts:stability=0.7]]
[[tts:speed=1.1]]
[[tts:text]]Custom spoken text[[/tts:text]]
```

### Auto-TTS Modes

| Mode      | Behavior                            |
| --------- | ----------------------------------- |
| `off`     | TTS disabled                        |
| `always`  | All responses get TTS               |
| `inbound` | TTS only when user sent audio       |
| `tagged`  | TTS only when `[[tts]]` tag present |

---

## 2. Memory Management

### Component Location

- **Identity Memory**: [`src/sowwy/identity/`](src/sowwy/identity/)
- **File Memory**: [`src/memory/`](src/memory/)
- **Plugin Memory**: [`extensions/memory-lancedb/`](extensions/memory-lancedb/)

### Memory Architecture (Dual-System)

```
┌─────────────────────────────────────────────────────┐
│                    Memory Layer                      │
├─────────────────────────────────────────────────────┤
│  Identity Memory          │     File Memory           │
│  (LanceDB)               │     (sqlite-vec)          │
├─────────────────────────────────────────────────────┤
│  • User preferences      │  • Project documents      │
│  • Communication style   │  • Code context          │
│  • Goals & constraints   │  • Session transcripts   │
│  • Emotional signals     │  • Memory files (.md)    │
└─────────────────────────────────────────────────────┘
```

### Identity Memory Schema (8 Categories)

```typescript
const IdentityCategory = {
  goal: "goal", // What user wants to achieve
  constraint: "constraint", // Hard limits, non-negotiables
  preference: "preference", // Soft preferences, style choices
  belief: "belief", // Values, stances, worldview
  risk: "risk", // Known risks, fears, concerns
  capability: "capability", // Skills, strengths, resources
  relationship: "relationship", // People, organizations
  historical_fact: "historical_fact", // Past events
} as const;
```

### File Memory Configuration

```typescript
// In openclaw.config.json5
{
  memory: {
    backend: "builtin" | "qmd",
    citations: "auto" | "on" | "off",

    qmd: {
      command: "qmd",                    // QMD CLI path
      includeDefaultMemory: true,         // Include ~/.memory
      paths: [
        { path: "/docs", name: "Project Docs" },
        { path: "${agent.workspace}/docs", name: "Agent Docs" },
      ],
      sessions: {
        enabled: true,
        exportDir: "${agent.workspace}/.memory/sessions",
        retentionDays: 30,
      },
      update: {
        interval: "5m",                  // Auto-update interval
        debounceMs: 1000,
        onBoot: true,
        embedInterval: "1h",              // Embedding refresh
      },
      limits: {
        maxResults: 20,
        maxSnippetChars: 700,
        maxInjectedChars: 8000,
        timeoutMs: 30000,
      },
    },
  },
}
```

### Embedding Configuration

```typescript
// Memory embedding providers
{
  embeddings: {
    provider: "openai" | "local" | "gemini" | "auto",
    model: "text-embedding-3-small",     // 1536 dims
    // OR for local
    local: {
      provider: "ollama" | "node-llama-cpp",
      model: "nomic-embed-text",
      endpoint: "http://localhost:11434",
    },
  },
}
```

### Vector Search Configuration

```typescript
{
  memory: {
    // sqlite-vec configuration
    vector: {
      enabled: true,
      extensionPath: "./node_modules/sqlite-vec/sqlite-vec.dylib",
    },
    // FTS (full-text search) for hybrid search
    fts: {
      enabled: true,
    },
    // Embedding cache for performance
    cache: {
      enabled: true,
      maxEntries: 10000,
    },
  },
}
```

---

## 3. Session Management

### Component Location

- **Session Store**: [`src/sessions/store.ts`](src/sessions/store.ts)
- **Session Types**: [`src/config/types.sessions.ts`](src/config/types.sessions.ts)
- **Session Keys**: [`src/sessions/session-key-utils.ts`](src/sessions/session-key-utils.ts)

### Session Types

| Type        | Description              | Use Case         |
| ----------- | ------------------------ | ---------------- |
| `chat`      | Interactive conversation | Primary use      |
| `broadcast` | One-to-many messaging    | Announcements    |
| `system`    | Automated/cron jobs      | Background tasks |

### Session Configuration

```typescript
// In openclaw.config.json5
{
  session: {
    store: "fs" | "sqlite" | "postgres",  // Session storage backend
    sendPolicy: {
      default: "allow" | "deny",
      rules: [
        {
          match: {
            channel: "discord",
            chatType: "group",
          },
          action: "allow" | "deny",
        },
        {
          match: {
            keyPrefix: "system:",
          },
          action: "deny",  // Prevent system sessions from sending
        },
      ],
    },
    transcript: {
      enabled: true,
      dir: "${dataDir}/transcripts",
      retentionDays: 90,
    },
  },
}
```

### Session Key Format

```
{channel}:{chatType}:{accountId}:{targetId}

Examples:
  discord:channel:my-account:general
  whatsapp:chat:my-account:+1234567890
  telegram:group:my-bot:my-group-id
  matrix:room:my-account:!roomid:matrix.org
```

### Send Policy Evaluation

```typescript
// Policy resolution order (highest to lowest priority):
1. Session-level override (per session config)
2. Channel-specific rule
3. Chat-type rule (group vs channel)
4. Key prefix rule
5. Global default
```

---

## 4. Cron Scheduling

### Component Location

- **Cron Service**: [`src/cron/service.ts`](src/cron/service.ts)
- **Cron Types**: [`src/config/types.cron.ts`](src/config/types.cron.ts)

### Cron Configuration

```typescript
// In openclaw.config.json5
{
  cron: {
    enabled: true,
    store: "${dataDir}/cron.json",      // Cron job storage
    maxConcurrentRuns: 4,               // Parallel job limit
  },
}
```

### Cron Job Definition

```typescript
interface CronJob {
  id: string;
  name: string;
  schedule: string; // Standard cron format
  enabled: boolean;
  agent: string; // Agent to invoke
  input?: {
    text?: string;
    attachments?: string[];
  };
  conditions?: {
    channels?: string[]; // Only run for these channels
    sessions?: string[]; // Only run for these sessions
  };
  action?: "send" | "invoke"; // Default: send
}
```

### Cron Schedule Format

| Format         | Example       | Description     |
| -------------- | ------------- | --------------- |
| Standard cron  | `0 9 * * 1-5` | 9 AM weekdays   |
| Interval       | `every 5m`    | Every 5 minutes |
| Human-readable | `at 9:00`     | Daily at 9 AM   |

### Cron Operations

```typescript
// Via gateway API or CLI
const cron = gateway.getCronService();

// List jobs
await cron.list({ includeDisabled: true });

// Add job
await cron.add({
  name: "Daily summary",
  schedule: "0 9 * * *",
  agent: "sowwy",
  input: { text: "Give me a summary of yesterday's conversations" },
});

// Run immediately
await cron.run("job-id", "force");

// Disable/Enable
await cron.update("job-id", { enabled: false });
```

---

## 5. Media Handling

### Component Location

- **Media Fetch**: [`src/media/fetch.ts`](src/media/fetch.ts)
- **Audio**: [`src/media/audio.ts`](src/media/audio.ts)
- **Image Ops**: [`src/media/image-ops.ts`](src/media/image-ops.ts)
- **MIME Types**: [`src/media/mime.ts`](src/media/mime.ts)

### Media Configuration

```typescript
// In openclaw.config.json5
{
  media: {
    fetch: {
      maxBytes: 50 * 1024 * 1024,    // 50MB max
      maxRedirects: 5,
      ssrfPolicy: "strict" | "relaxed",  // SSRF protection
      allowedDomains: [                 // For strict mode
        "api.example.com",
        "cdn.example.com",
      ],
    },
    image: {
      maxWidth: 4096,
      maxHeight: 4096,
      quality: 0.85,
      format: "webp" | "png" | "jpeg",
    },
    audio: {
      voiceExtensions: [".oga", ".ogg", ".opus"],
      maxDuration: 300,                  // Seconds
    },
  },
}
```

### Voice-Compatible Formats

```typescript
// Telegram voice notes
const VOICE_AUDIO_EXTENSIONS = new Set([".oga", ".ogg", ".opus"]);

// Detection
isVoiceCompatibleAudio({
  contentType: "audio/ogg; codecs=opus",
  fileName: "voice-message.ogg",
}); // Returns true
```

### Media Fetch with SSRF Protection

```typescript
// SSRF Policy options
const ssrfPolicy = {
  // Strict: Only allow specific domains
  allowedDomains: ["api.example.com"],

  // Relaxed: Block private IP ranges
  blockPrivate: true,
  blockLoopback: true,

  // Custom lookup function
  lookupFn: async (url) => {
    const resolved = await dns.lookup(url.hostname);
    return !isPrivateIP(resolved.address);
  },
};
```

---

## 6. Canvas Rendering (A2UI)

### Component Location

- **Canvas Host**: [`src/canvas-host/`](src/canvas-host/)
- **A2UI Bundle**: [`src/canvas-host/a2ui/`](src/canvas-host/a2ui/)

### Canvas Endpoints

| Path                   | Method | Purpose               |
| ---------------------- | ------ | --------------------- |
| `/__openclaw__/canvas` | GET    | Canvas UI root        |
| `/__openclaw__/a2ui`   | GET    | A2UI assets           |
| `/__openclaw__/ws`     | WS     | Live reload WebSocket |

### Canvas Configuration

```typescript
// In openclaw.config.json5
{
  canvas: {
    enabled: true,
    port: 3979,                        // Default canvas port
    host: "0.0.0.0",                 // Bind address
    corsOrigins: ["http://localhost:*"],
    a2ui: {
      bundlePath: "./dist/canvas-host/a2ui",
      liveReload: true,
    },
  },
}
```

### A2UI Cross-Platform Bridge

```typescript
// Canvas can communicate with native host apps
globalThis.OpenClaw = {
  postMessage: (payload) => {
    // iOS: webkit.messageHandlers.openclawCanvasA2UIAction.postMessage
    // Android: window.openclawCanvasA2UIAction.postMessage
    // Web: postMessage to parent
  },
  sendUserAction: (action) => {
    // Send user interaction events
  },
};
```

---

## 7. Browser Automation

### Component Location

- **Browser Core**: [`src/browser/`](src/browser/)
- **Playwright Tools**: [`src/browser/pw-tools-core.ts`](src/browser/pw-tools-core.ts)
- **CDP Helpers**: [`src/browser/cdp.helpers.ts`](src/browser/cdp.helpers.ts)

### Browser Configuration

```typescript
// In openclaw.config.json5
{
  browser: {
    type: "chrome" | "firefox" | "edge",
    executablePath: null,             // Auto-detect if null
    headless: false,
    viewport: {
      width: 1280,
      height: 800,
    },
    userDataDir: "${dataDir}/browser-profiles",
    extensions: [],                   // Load browser extensions
    downloads: {
      dir: "${dataDir}/downloads",
      promptForPath: false,
    },
    proxies: [],                      // HTTP/SOCKS proxies
    launchArgs: [
      "--no-sandbox",
      "--disable-dev-shm-usage",
    ],
  },
}
```

### Browser Tools Available

| Tool                 | Purpose            | Example                                               |
| -------------------- | ------------------ | ----------------------------------------------------- |
| `browser_navigate`   | Go to URL          | `browser_navigate({ url: "https://..." })`            |
| `browser_click`      | Click element      | `browser_click({ selector: "#submit" })`              |
| `browser_type`       | Input text         | `browser_type({ selector: "#input", text: "hello" })` |
| `browser_screenshot` | Take screenshot    | `browser_screenshot({ fullPage: true })`              |
| `browser_evaluate`   | Run JS             | `browser_evaluate({ expression: "document.title" })`  |
| `browser_wait`       | Wait for condition | `browser_wait({ selector: "#loaded" })`               |

### Playwright Configuration

```typescript
{
  playwright: {
    channel: "chrome" | "msedge" | "chromium" | "firefox" | "webkit",
    launchOptions: {
      args: ["--no-sandbox"],
    },
    connectOptions: {
      wsEndpoint: "ws://localhost:3000",  // Connect to existing browser
    },
    trace: "on" | "off" | "retain-on-failure",
    screenshot: "on" | "off" | "only-on-failure",
  },
}
```

---

## 8. Approval Workflows

### Component Location

- **Approval Types**: [`src/config/types.approvals.ts`](src/config/types.approvals.ts)
- **Exec Approval Manager**: [`src/gateway/exec-approval-manager.ts`](src/gateway/exec-approval-manager.ts)

### Approval Configuration

```typescript
// In openclaw.config.json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session" | "targets" | "both",
      agentFilter: ["*"],              // Apply to all agents
      sessionFilter: [],               // No session restrictions
      targets: [
        {
          channel: "discord",
          to: "agent-approvals",
          accountId: "main",
        },
      ],
    },
  },
}
```

### Approval Flow Modes

| Mode      | Behavior                            |
| --------- | ----------------------------------- |
| `session` | Forward to origin chat session      |
| `targets` | Forward to configured targets only  |
| `both`    | Forward to both session and targets |

### Approval Request Example

````markdown
🤖 **Execution Approval Required**

**Agent:** sowwy
**Session:** discord:channel:main:general
**Tool:** exec_command

```bash
rm -rf node_modules
```
````

**Reason:** Need to clean and reinstall dependencies

[Approve] [Deny] [Approve with changes: `rm -rf dist && rm -rf node_modules`]

````

---

## 9. Available Plugins (Extensions)

### Component Location
- **Extensions**: [`extensions/`](extensions/)
- **Plugin SDK**: [`src/plugin-sdk/`](src/plugin-sdk/)

### Communication Plugins (30+)

| Plugin | Status | Description |
|--------|--------|-------------|
| **Matrix** | ✅ Stable | Enterprise messaging |
| **Discord** | ✅ Stable | Gaming/community chat |
| **Slack** | ✅ Stable | Team collaboration |
| **Telegram** | ✅ Stable | Bot API messaging |
| **WhatsApp** | ✅ Stable | Baileys-based client |
| **iMessage** | ✅ Stable | Apple ecosystem |
| **Signal** | ✅ Stable | Privacy-focused messaging |
| **MSTeams** | ✅ Stable | Microsoft Teams |
| **Google Chat** | ✅ Stable | G-Suite messaging |
| **Email (IMAP)** | ✅ Stable | Gmail, Proton, etc. |

### Utility Plugins

| Plugin | Purpose |
|--------|---------|
| `memory-lancedb` | Vector memory storage |
| `memory-core` | Memory management |
| `copilot-proxy` | GitHub Copilot integration |
| `llm-task` | Task orchestration |
| `twilio-sms` | SMS/call notifications |
| `voice-call` | Voice functionality |
| `diagnostics-otel** | Observability/tracing |
| `bluebubbles` | iMessage via BlueBubbles server |
| `deskin** | Desktop integration |

### Plugin Configuration Schema

```typescript
{
  plugins: {
    enabled: true,
    // Plugin-specific configs
    matrix: {
      homeserver: "https://matrix.example.com",
      accessToken: "${MATRIX_TOKEN}",
    },
    discord: {
      token: "${DISCORD_BOT_TOKEN}",
      intents: ["guilds", "messages"],
    },
  },
}
````

### Plugin Development

```typescript
// Plugin structure
export default {
  id: "my-plugin",
  name: "My Plugin",
  description: "Description of functionality",
  kind: "channel" | "memory" | "utility",
  configSchema: {
    // TypeBox schema
  },
  register(api: OpenClawPluginApi) {
    // Register tools
    api.registerTool({ ... });
    // Register hooks
    api.on("session:start", (event) => { ... });
    // Register CLI commands
    api.registerCli(({ program }) => { ... });
  },
};
```

---

## 10. Gateway & Server Configuration

### Component Location

- **Gateway Server**: [`src/gateway/server.ts`](src/gateway/server.ts)
- **Server Methods**: [`src/gateway/server-methods/`](src/gateway/server-methods/)

### Gateway Configuration

```typescript
// In openclaw.config.json5
{
  gateway: {
    port: 3978,
    host: "0.0.0.0",
    cors: {
      enabled: true,
      origins: ["http://localhost:*"],
    },
    auth: {
      enabled: true,
      apiKeys: ["${GATEWAY_API_KEY}"],
      tokenExpiry: "24h",
    },
    rateLimit: {
      windowMs: 60000,
      maxRequests: 100,
    },
    logging: {
      level: "info" | "debug" | "warn" | "error",
      requests: true,
      responses: false,
    },
  },
}
```

### Server Methods API

| Method                  | Purpose                 |
| ----------------------- | ----------------------- |
| `gateway.sessions.list` | List active sessions    |
| `gateway.sessions.send` | Send message to session |
| `gateway.cron.*`        | Cron job management     |
| `gateway.hooks.*`       | Hook management         |
| `gateway.nodes.*`       | Node registration       |
| `gateway.models.*`      | Model catalog           |

---

## 11. Model Provider Configuration

### Component Location

- **Model Selection**: [`src/agents/model-selection.ts`](src/agents/model-selection.ts)
- **Model Auth**: [`src/agents/model-auth.ts`](src/agents/model-auth.ts)

### Model Providers

```typescript
// In openclaw.config.json5
{
  models: {
    providers: [
      {
        id: "openai",
        provider: "openai",
        apiKey: "${OPENAI_API_KEY}",
        models: ["gpt-4o", "gpt-4o-mini", "o1", "o1-mini"],
        default: "gpt-4o-mini",
      },
      {
        id: "anthropic",
        provider: "anthropic",
        apiKey: "${ANTHROPIC_API_KEY}",
        models: ["claude-sonnet-4-20250514", "claude-opus-4-20250514"],
        default: "claude-sonnet-4-20250514",
      },
      {
        id: "gemini",
        provider: "gemini",
        apiKey: "${GEMINI_API_KEY}",
        models: ["gemini-2.0-flash-exp"],
        default: "gemini-2.0-flash-exp",
      },
      {
        id: "ollama",
        provider: "ollama",
        baseUrl: "http://localhost:11434/v1",
        models: ["llama3.2", "mistral"],
        default: "llama3.2",
      },
    ],
    embeddingProvider: "openai",
    embeddingModel: "text-embedding-3-small",
  },
}
```

### Model Selection Strategies

```typescript
{
  models: {
    selection: {
      defaultAgent: "sowwy",
      agents: {
        sowwy: {
          primary: "openai/gpt-4o",
          fallback: ["anthropic/claude-sonnet-4-20250514"],
        },
        antigravity: {
          primary: "anthropic/claude-sonnet-4-20250514",
          fallback: ["openai/gpt-4o"],
        },
      },
      routing: {
        preferLocal: false,
        maxCostPerRun: 10.0,
      },
    },
  },
}
```

---

## 12. Hook System

### Component Location

- **Hooks Core**: [`src/hooks/hooks.ts`](src/hooks/hooks.ts)
- **Hook Types**: [`src/hooks/types.ts`](src/hooks/types.ts)
- **Internal Hooks**: [`src/hooks/internal-hooks.ts`](src/hooks/internal-hooks.ts)

### Hook Configuration

```typescript
// In openclaw.config.json5
{
  hooks: {
    enabled: true,
    dir: "${configDir}/hooks",
    bundled: true,              // Include built-in hooks
  },
}
```

### Available Hook Events

| Event              | Trigger                     |
| ------------------ | --------------------------- |
| `session:start`    | New conversation begins     |
| `session:end`      | Conversation ends           |
| `message:send`     | Message is about to be sent |
| `message:received` | Message received            |
| `agent:invoke`     | Agent is invoked            |
| `agent:complete`   | Agent finishes              |
| `tool:invoke`      | Tool is called              |
| `tool:complete`    | Tool finishes               |
| `error`            | Error occurs                |
| `cron:due`         | Cron job is due             |

### Hook Metadata Schema

```typescript
interface HookMetadata {
  always?: boolean; // Run even if previous hook failed
  hookKey?: string; // Unique identifier
  emoji?: string; // Display emoji
  homepage?: string;
  events: string[]; // Events this hook handles
  requires?: {
    bins?: string[]; // Required CLI tools
    anyBins?: string[]; // At least one of these
    env?: string[]; // Required env vars
    config?: string[]; // Required config keys
  };
  install?: HookInstallSpec[]; // Installation instructions
}
```

### Hook Example

````markdown
---
hookKey: slack-notify
emoji: 📢
events:
  - session:end
always: true
---

# Slack Notifications

Sends session summaries to Slack when conversations end.

## Configuration

```json
{
  "SLACK_WEBHOOK_URL": "https://hooks.slack.com/services/..."
}
```
````

## Usage

No configuration needed beyond webhook URL.

```

---

## 13. Configuration Precedence

Settings are resolved in this order (highest to lowest priority):

```

1. CLI flags (--config, --port, etc.)
2. Environment variables (OPENCLAW\_\*)
3. Runtime config API (gateway.patchConfig)
4. Session config (per-session overrides)
5. User config (~/.config/openclaw/config.json5)
6. Project config (./openclaw.config.json5)
7. Default values

````

### Environment Variable Mapping

| Config Path | Environment Variable |
|-------------|---------------------|
| `gateway.port` | `OPENCLAW_GATEWAY_PORT` |
| `models.providers[].apiKey` | `{PROVIDER}_API_KEY` |
| `tts.elevenlabs.apiKey` | `ELEVENLABS_API_KEY` |
| `plugins.matrix.accessToken` | `MATRIX_TOKEN` |

---

## 14. Recommended Production Configuration

```json5
{
  // === CORE SETTINGS ===
  gateway: {
    port: 3978,
    host: "0.0.0.0",
    auth: {
      enabled: true,
      apiKeys: ["${GATEWAY_API_KEY}"],
    },
  },

  // === MODEL PROVIDERS ===
  models: {
    providers: [
      {
        id: "openai",
        provider: "openai",
        apiKey: "${OPENAI_API_KEY}",
        models: ["gpt-4o", "gpt-4o-mini"],
      },
      {
        id: "anthropic",
        provider: "anthropic",
        apiKey: "${ANTHROPIC_API_KEY}",
        models: ["claude-sonnet-4-20250514"],
      },
    ],
    selection: {
      defaultAgent: "sowwy",
      agents: {
        sowwy: { primary: "anthropic/claude-sonnet-4-20250514" },
        antigravity: { primary: "openai/gpt-4o" },
      },
    },
    embeddingProvider: "openai",
    embeddingModel: "text-embedding-3-small",
  },

  // === TTS ===
  messages: {
    tts: {
      auto: "tagged",
      provider: "elevenlabs",
      elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}" },
    },
  },

  // === MEMORY ===
  memory: {
    backend: "builtin",
    citations: "auto",
  },

  // === SESSIONS ===
  session: {
    store: "fs",
    sendPolicy: {
      default: "allow",
      rules: [
        { match: { keyPrefix: "system:" }, action: "deny" },
      ],
    },
  },

  // === CRON ===
  cron: {
    enabled: true,
    maxConcurrentRuns: 4,
  },

  // === APPROVALS ===
  approvals: {
    exec: {
      enabled: true,
      mode: "both",
    },
  },

  // === BROWSER ===
  browser: {
    type: "chrome",
    headless: true,
  },

  // === MEDIA ===
  media: {
    fetch: {
      maxBytes: 50 * 1024 * 1024,
      ssrfPolicy: "strict",
    },
  },
}
````

---

## 15. Quick Reference: Critical File Locations

| Component    | Key Files                                                                |
| ------------ | ------------------------------------------------------------------------ |
| **TTS**      | `src/tts/tts.ts`, `src/config/types.tts.ts`                              |
| **Memory**   | `src/memory/manager.ts`, `src/memory/memory-schema.ts`                   |
| **Identity** | `src/sowwy/identity/lancedb-store.ts`, `src/sowwy/identity/fragments.ts` |
| **Sessions** | `src/sessions/store.ts`, `src/sessions/schedule.ts`                      |
| **Cron**     | `src/cron/service.ts`, `src/cron/types.ts`                               |
| **Media**    | `src/media/fetch.ts`, `src/media/audio.ts`                               |
| **Canvas**   | `src/canvas-host/server.ts`, `src/canvas-host/a2ui.ts`                   |
| **Browser**  | `src/browser/server.ts`, `src/browser/pw-tools-core.ts`                  |
| **Gateway**  | `src/gateway/server.ts`, `src/gateway/server-methods.ts`                 |
| **Plugins**  | `extensions/*/index.ts`, `src/plugin-sdk/index.ts`                       |
| **Hooks**    | `src/hooks/hooks.ts`, `src/hooks/internal-hooks.ts`                      |
| **Config**   | `src/config/config.ts`, `src/config/validation.ts`                       |

---

## Conclusion

This report documents all major system components of OpenClaws/NEURABOT. The most critical settings for maximizing agent capabilities are:

1. **Model Provider Setup** - Ensure both OpenAI and Anthropic are configured with API keys
2. **TTS Configuration** - ElevenLabs provides best quality; Edge TTS is free fallback
3. **Memory Backend** - Builtin (sqlite-vec) with embeddings enabled
4. **Cron Service** - Enable for scheduled tasks and automation
5. **Approvals** - Configure for security-sensitive operations

All components are designed to be configured via the JSON5 config file, environment variables, or runtime API calls.
