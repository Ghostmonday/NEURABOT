# NEURABOT - Complete Feature List

This document lists **EVERY feature** in the NEURABOT project, organized by category.

## Core Platform Features

### Gateway & Infrastructure

- **Single Gateway Process** - Unified control plane for all channels and agents
- **HTTP/WebSocket Servers** - Multi-protocol communication
- **PM2 Process Management** - Production-ready process orchestration with memory limits
- **Watchdog Heartbeat** - Health monitoring with Healthchecks.io integration
- **Crash-Loop Detection** - Optional sentinel for auto-rollback
- **Auto-Reload** - Safe process restart after code changes
- **Onboarding Wizard** - Interactive setup and configuration
- **Configuration Management** - Environment-based config with validation
- **Daemon Installation** - LaunchAgent (macOS) / systemd (Linux) support
- **Remote Access** - SSH tunnel, VPN, Tailnet support
- **Service Discovery** - Bonjour/mDNS for local network discovery
- **Gateway Authentication** - Auth token management
- **Health Checks** - Status endpoints and monitoring
- **Logging System** - Structured logging with rotation
- **Error Recovery** - Automatic retry and failure handling

### SOWWY Mission Control System

- **Task Scheduler** - Priority-based task queue with polling
- **Task Store** - PostgreSQL or in-memory persistence
- **Persona Routing** - Dev, LegalOps, ChiefOfStaff, RnD personas
- **Approval Workflows** - Centralized approval gates for high-risk actions
- **Retry Logic** - Exponential backoff and stuck detection
- **Audit Trail** - Complete task execution history
- **Decision Store** - Approval decision logging
- **Event Bus** - Task lifecycle events
- **SMT Throttler** - Rate limiting for expensive operations
- **Continuous Self-Modify** - Automated upgrade cycles
- **Roadmap Observer** - Parse and execute roadmap tasks
- **Overseer Extension** - High-level task coordination

### Identity & Memory

- **Identity Store** - LanceDB-backed vector storage
- **8-Category Schema** - goal, constraint, preference, belief, risk, capability, relationship, historical_fact
- **Vector Search** - Semantic similarity search
- **Memory Consolidation** - Daily rollups and deduplication
- **Memory Extraction** - Automatic fragment extraction from conversations
- **Session Memory** - Per-session context retention
- **Hybrid Search** - Vector + keyword search
- **Embedding Providers** - OpenAI, Gemini, local models
- **Memory Citations** - Source attribution for retrieved memories

### Self-Modification System

- **File Allowlist** - Controlled code editing boundaries
- **Diff Thresholds** - Maximum change percentage limits
- **Syntax Validation** - TypeScript/JavaScript parsing
- **Secret Detection** - Prevents credential leaks
- **Boundary Protection** - Prevents editing safety code
- **Reload Mechanism** - Safe process restart
- **Rollback System** - Git-based recovery
- **Validation Checklist** - Multi-step safety checks

### Security & Throttling

- **SMT Throttler** - Self-Modify Throttler for rate limiting
- **Approval Gates** - Human-in-the-loop for dangerous operations
- **Environment Validation** - Required env var checking
- **Secret Redaction** - PII/credential masking in logs
- **Policy Engine** - Tool execution policies
- **Circuit Breaker** - Failure rate protection
- **Resource Monitoring** - CPU/memory tracking

## Communication Channels (30+)

### Messaging Platforms

- **Telegram** - Bot API with DMs and groups (grammY)
- **WhatsApp** - Web protocol via Baileys
- **Discord** - Bot with DMs and guild channels
- **Slack** - Bot integration with workspace support
- **Signal** - Signal protocol integration
- **iMessage** - macOS imsg CLI integration
- **Line** - LINE Bot SDK integration
- **Google Chat** - Google Chat API
- **Microsoft Teams** - Teams bot with Graph API
- **Mattermost** - Plugin-based integration
- **Matrix** - Matrix protocol client
- **Nostr** - Nostr protocol support
- **Twitch** - Twitch chat integration
- **Zalo** - Zalo messaging
- **ZaloUser** - Zalo user accounts
- **Tlon** - Tlon/Urbit integration
- **Nextcloud Talk** - Nextcloud Talk integration
- **BlueBubbles** - BlueBubbles iMessage bridge
- **Lobster** - Lobster chat integration

### Voice & Telephony

- **Voice Call** - Twilio/Plivo/Telnyx telephony integration
- **TTS (Text-to-Speech)** - OpenAI Realtime TTS, node-edge-tts
- **STT (Speech-to-Text)** - OpenAI Realtime STT
- **Voice Wake** - Voice activation on mobile apps
- **Audio Streaming** - Real-time audio processing

### Web & UI

- **WebChat** - Browser-based chat interface
- **WebSocket Server** - Real-time bidirectional communication
- **Control UI** - Dashboard for monitoring and control
- **Canvas Host** - HTTP file server for Canvas surfaces

## Agent & AI Features

### Agent System

- **Multi-Agent Routing** - Separate agents per channel/account/task
- **Agent Sessions** - Isolated conversation contexts
- **Sub-Agent Registry** - Hierarchical agent management
- **Agent Runner** - LLM execution engine
- **Session Store** - Persistent session management
- **Transcript Management** - Conversation history
- **Context Building** - Dynamic prompt construction
- **Tool Streaming** - Real-time tool execution feedback
- **Pi Integration** - Pi agent protocol bridge
- **Embedded Pi Runner** - Local Pi agent execution

### LLM Providers

- **OpenAI** - ChatGPT, Codex, GPT models
- **Anthropic** - Claude Pro/Max
- **MiniMax** - MiniMax M2.1 and other models
- **Google Gemini** - Gemini models via OAuth
- **Google Antigravity** - Antigravity models
- **OpenRouter** - Multi-provider routing
- **GitHub Copilot** - Copilot API integration
- **AWS Bedrock** - Bedrock models
- **Local Models** - node-llama-cpp support
- **Model Fallback** - Automatic provider switching
- **Model Profiles** - Per-agent model configuration
- **Auth Profiles** - OAuth and API key management

### Reasoning & Thinking

- **Think Levels** - Configurable reasoning depth
- **Reasoning Levels** - Structured reasoning modes
- **System Prompts** - Customizable agent instructions
- **Prompt Engineering** - Dynamic prompt building

## Tools (60+)

### Code & Development

- **Edit Tool** - File editing capabilities
- **Self-Modify Tool** - Controlled code modification
- **Bash Tools** - Shell command execution
- **Sandbox** - Isolated execution environment
- **Docker Sandbox** - Containerized code execution
- **CLI Runner** - Command-line tool execution
- **Git Operations** - Version control integration
- **Workspace Management** - File system operations

### Web & Browser

- **Browser Tool** - Playwright-based browser automation
- **Web Fetch** - HTTP request tool with SSRF protection
- **Web Search** - Search engine integration
- **Web Tools** - Readability, content extraction
- **Navigation** - Page navigation and interaction
- **Form Handling** - Form filling and submission
- **Cookie Management** - Browser state persistence
- **Screenshot** - Page capture
- **PDF Processing** - PDF.js integration

### Communication Tools

- **Message Tool** - Send messages via channels
- **Sessions Send** - Cross-session messaging
- **Sessions Spawn** - Create new sessions
- **Sessions List** - List active sessions
- **Sessions History** - Conversation history retrieval
- **Sessions Announce** - Broadcast to sessions
- **Telegram Actions** - Telegram-specific operations
- **WhatsApp Actions** - WhatsApp-specific operations
- **Discord Actions** - Discord moderation and messaging
- **Slack Actions** - Slack workspace operations

### Media & Content

- **Image Tool** - Image processing and generation
- **Canvas Tool** - Canvas surface manipulation
- **TTS Tool** - Text-to-speech generation
- **Media Understanding** - Image/video analysis
- **Link Understanding** - URL content extraction
- **Markdown Processing** - Markdown rendering

### System & Infrastructure

- **Gateway Tool** - Gateway RPC calls
- **Nodes Tool** - Node device management
- **Cron Tool** - Scheduled task management
- **Memory Tool** - Memory search and storage
- **Watchdog Tool** - Health check management
- **Agent Step** - Step-by-step agent execution
- **Agents List** - List available agents

### Node Devices

- **Camera** - Mobile device camera access
- **Screen** - Screen recording and capture
- **Location** - GPS location services
- **Pairing** - Device pairing and authentication
- **Notification** - Push notifications
- **Status** - Device status reporting
- **Canvas A2UI** - Canvas-to-UI rendering

## Skills (50+)

### Productivity

- **1Password** - Password manager integration
- **Apple Notes** - Notes app integration
- **Apple Reminders** - Reminders app integration
- **Bear Notes** - Bear note-taking app
- **Notion** - Notion workspace integration
- **Obsidian** - Obsidian vault integration
- **Things Mac** - Things task manager
- **Trello** - Trello board management
- **Canvas** - Canvas LMS integration

### Communication & Social

- **Discord** - Discord bot skills
- **Slack** - Slack workspace skills
- **GitHub** - GitHub repository management
- **Bird** - Twitter/X integration
- **Blogwatcher** - Blog monitoring

### Development

- **Coding Agent** - Code generation and review
- **iOS Dev** - iOS development tools
- **Model Usage** - LLM usage tracking
- **Session Logs** - Log management

### Media & Content

- **OpenAI Image Gen** - DALL-E image generation
- **OpenAI Whisper** - Speech transcription
- **OpenAI Whisper API** - API-based transcription
- **Sherpa ONNX TTS** - Text-to-speech
- **Video Frames** - Video frame extraction
- **GIF Grep** - GIF search and retrieval
- **Songsee** - Music identification
- **Spotify Player** - Spotify control

### Home Automation

- **OpenHue** - Philips Hue control
- **Sonos CLI** - Sonos speaker control
- **EightCtl** - Eight Sleep control

### Utilities

- **Weather** - Weather information
- **Local Places** - Location-based search
- **Go Places** - Place recommendations
- **Food Order** - Food delivery integration
- **Order CLI** - Order management
- **Healthcheck** - Health monitoring
- **Summarize** - Content summarization
- **Nano Banana Pro** - Hardware integration
- **Nano PDF** - PDF processing
- **MC Porter** - Data porting
- **Peekaboo** - Privacy tool
- **GOG** - GOG game platform
- **BluCLI** - Bluetooth control
- **WACLI** - Web Audio CLI
- **Tmux** - Terminal multiplexer
- **Himalaya** - Email client
- **Oracle** - Database integration
- **Persona COS** - Chief of Staff persona
- **Persona Dev** - Developer persona
- **Persona Legal** - Legal operations persona
- **Persona RND** - Research & Development persona
- **Skill Creator** - Skill development tool

## CLI Commands

### Configuration

- **onboard** - Initial setup wizard
- **configure** - Configuration management
- **doctor** - System diagnostics and health checks
- **reset** - Reset configuration
- **status** - System status reporting

### Channel Management

- **channels** - Channel configuration and management
- **channels login** - Authenticate channels
- **channels add** - Add new channels
- **channels list** - List configured channels

### Agent Management

- **agents** - Agent configuration
- **agents add** - Create new agents
- **agents list** - List agents
- **agents identity** - Agent identity management

### Gateway Operations

- **gateway** - Start gateway server
- **gateway dev** - Development mode
- **gateway call** - RPC calls
- **gateway discover** - Network discovery
- **gateway status** - Gateway health

### Memory & Sessions

- **memory** - Memory management
- **sessions** - Session management
- **sessions list** - List active sessions
- **sessions history** - View history

### Models & Providers

- **models** - Model configuration
- **models list** - List available models
- **models set** - Set default models
- **auth** - Authentication management

### Node Devices

- **nodes** - Node device management
- **nodes camera** - Camera operations
- **nodes screen** - Screen capture
- **nodes canvas** - Canvas operations
- **nodes location** - Location services
- **nodes pairing** - Device pairing
- **nodes notify** - Send notifications
- **nodes status** - Device status

### Development Tools

- **sandbox** - Sandbox execution
- **browser** - Browser automation CLI
- **cron** - Cron job management
- **hooks** - Hook management
- **plugins** - Plugin management
- **skills** - Skill management
- **docs** - Documentation tools
- **logs** - Log viewing
- **update** - Update management
- **security** - Security utilities

### System

- **daemon** - Daemon lifecycle management
- **daemon install** - Install daemon service
- **daemon status** - Daemon health
- **tui** - Terminal UI
- **completion** - Shell completion
- **webhooks** - Webhook management
- **dns** - DNS utilities
- **devices** - Device management
- **directory** - Directory operations

## Mobile Applications

### iOS App

- **Chat Interface** - Native chat UI
- **Voice Wake** - Voice activation
- **Camera Integration** - Camera access
- **Screen Recording** - Screen capture
- **Location Services** - GPS integration
- **Canvas Surface** - Canvas rendering
- **Gateway Connection** - WebSocket connection
- **Settings Management** - App configuration
- **Status Display** - Connection status
- **Voice Tab** - Voice interaction UI
- **Talk Mode** - Voice conversation mode

### Android App

- **Chat Interface** - Native chat UI
- **Canvas Surface** - Canvas rendering
- **Camera Integration** - Camera access
- **Gateway Connection** - WebSocket connection
- **Settings** - App configuration

### macOS App

- **Menu Bar App** - System tray integration
- **Voice Wake** - Voice activation
- **Chat Interface** - Native chat UI
- **Canvas Host** - Canvas server
- **Gateway Management** - Gateway control
- **Settings** - App configuration

## Extensions & Plugins

### Communication Extensions

- **Twilio SMS** - SMS via Twilio
- **Voice Call** - Telephony integration
- **Proton Email** - Email integration
- **Tuta Email** - Tuta Mail integration

### Infrastructure Extensions

- **Hostinger** - VPS management
- **Diagnostics OTEL** - OpenTelemetry diagnostics
- **Copilot Proxy** - GitHub Copilot proxy
- **LLM Task** - Task-based LLM execution

### Memory Extensions

- **Memory Core** - Core memory functionality
- **Memory LanceDB** - LanceDB memory backend

### Authentication Extensions

- **Google Gemini CLI Auth** - Gemini OAuth
- **Google Antigravity Auth** - Antigravity OAuth
- **Minimax Portal Auth** - MiniMax authentication
- **Qwen Portal Auth** - Qwen authentication

### Special Extensions

- **Open Prose** - Prose document processing
- **Desk.in** - Remote Mac access

## SOWWY Extensions

### Persona Executors

- **Persona Dev** - Developer persona executor
- **Persona COS** - Chief of Staff executor
- **Persona Legal** - Legal operations executor
- **Persona RND** - Research & Development executor

### Task Management

- **Roadmap Observer** - Parse and execute roadmap tasks
- **Continuous Self-Modify** - Automated self-improvement
- **Overseer** - High-level task coordination
- **Twilio SMS** - SMS task integration
- **Tuta Email** - Email task integration

## Infrastructure Features

### Process Management

- **PM2 Integration** - Process orchestration
- **Memory Limits** - Configurable memory constraints
- **Log Rotation** - Automatic log management
- **Auto-Restart** - Crash recovery
- **Startup Scripts** - Boot-time initialization

### Monitoring & Observability

- **Health Checks** - System health endpoints
- **Metrics Collection** - Performance metrics
- **Resource Monitoring** - CPU/memory tracking
- **Event Logging** - Structured event logs
- **Audit Trails** - Complete action history

### Security Features

- **Secret Management** - Credential storage
- **Environment Validation** - Config validation
- **Redaction** - PII masking
- **Policy Engine** - Access control
- **Circuit Breaker** - Failure protection

### Data Persistence

- **PostgreSQL** - Task and audit storage
- **LanceDB** - Vector storage for identity/memory
- **SQLite** - Local database option
- **File System** - Session and workspace storage
- **Session Files** - Conversation persistence

### Network & Discovery

- **Bonjour/mDNS** - Local network discovery
- **WebSocket** - Real-time communication
- **HTTP Server** - REST API
- **RPC System** - Remote procedure calls
- **Gateway Discovery** - Automatic gateway finding

## Development & Build Features

### Build System

- **TypeScript Compilation** - Type-safe builds
- **Canvas A2UI Bundling** - Canvas asset bundling
- **Protocol Generation** - Auto-generated protocol code
- **Swift Code Generation** - iOS/macOS code generation

### Testing

- **Unit Tests** - Vitest test suite
- **E2E Tests** - End-to-end testing
- **Live Tests** - Integration with real services
- **Docker Tests** - Containerized testing
- **Coverage Reports** - Code coverage tracking

### Code Quality

- **Linting** - oxlint integration
- **Formatting** - oxfmt code formatting
- **Type Checking** - Strict TypeScript
- **File Size Checks** - LOC limits
- **Pre-commit Hooks** - Quality gates

### Documentation

- **Markdown Docs** - Comprehensive documentation
- **API Documentation** - Auto-generated API docs
- **Skill Documentation** - Skill guides
- **Architecture Docs** - System design docs
- **i18n Support** - Internationalization

## Advanced Features

### High-Throughput Architecture

- **Parallel Execution Lanes** - Concurrent task execution
- **Per-Persona Concurrency** - Multiple tasks per persona
- **SMT-Scalable Limits** - Configurable rate limits
- **Concurrent Agent Sessions** - Parallel LLM calls
- **Queue Management** - Priority-based queuing

### Autonomous Operations

- **Task Automation** - Automated task execution
- **Self-Improvement** - Continuous self-modification
- **Roadmap Execution** - Automated roadmap tracking
- **Identity Learning** - Automatic identity extraction
- **Memory Consolidation** - Automatic memory management

### Integration Capabilities

- **Webhook Support** - Incoming webhooks
- **REST API** - HTTP API endpoints
- **RPC Interface** - Remote procedure calls
- **Plugin System** - Extensible architecture
- **Extension Loader** - Dynamic extension loading

---

**Total Feature Count: 300+ individual features**

This list represents every major feature, tool, channel, skill, command, and capability in the NEURABOT project as determined from the codebase structure and documentation.
