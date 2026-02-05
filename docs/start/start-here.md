---
summary: "Start here: onboarding wizard and fastest path to first chat"
read_when:
  - First time with OpenClaw
  - You want the recommended setup path
title: "Start Here"
---

# Start Here

## Onboarding Wizard

The onboarding wizard is the **recommended** way to set up OpenClaw on macOS, Linux, or Windows (via WSL2; strongly recommended). It configures a local Gateway or a remote Gateway connection, plus channels, skills, and workspace defaults in one guided flow.

**Primary entrypoint:**

```bash
openclaw onboard
```

**Fastest first chat:** open the Control UI (no channel setup needed). Run `openclaw dashboard` and chat in the browser. Docs: [Dashboard](/web/dashboard).

**Follow‑up reconfiguration:**

```bash
openclaw configure
```

**Recommended:** set up a Brave Search API key so the agent can use `web_search` (`web_fetch` works without a key). Easiest path: `openclaw configure --section web` which stores `tools.web.search.apiKey`. Docs: [Web tools](/tools/web).

## QuickStart vs Advanced

The wizard starts with **QuickStart** (defaults) vs **Advanced** (full control).

**QuickStart** keeps the defaults:

- Local gateway (loopback)
- Workspace default (or existing workspace)
- Gateway port **18789**
- Gateway auth **Token** (auto‑generated, even on loopback)
- Tailscale exposure **Off**
- Telegram + WhatsApp DMs default to **allowlist** (you’ll be prompted for your phone number)

**Advanced** exposes every step (mode, workspace, gateway, channels, daemon, skills).

## What the wizard does

**Local mode (default)** walks you through:

- **Model/auth** — OpenAI Code (Codex) subscription OAuth, Anthropic API key (recommended) or setup-token (paste), plus MiniMax/GLM/Moonshot/AI Gateway options
- **Workspace** — location + bootstrap files
- **Gateway** — port, bind, auth, tailscale
- **Providers** — Telegram, WhatsApp, Discord, Google Chat, Mattermost (plugin), Signal
- **Daemon install** — LaunchAgent / systemd user unit
- **Health check**
- **Skills** (recommended)

**Remote mode** only configures the local client to connect to a Gateway elsewhere. It does **not** install or change anything on the remote host.

To add more isolated agents (separate workspace + sessions + auth):

```bash
openclaw agents add <name>
```

**Tip:** `--json` does **not** imply non-interactive mode. Use `--non-interactive` (and `--workspace`) for scripts.

Full flow details (existing config detection, model/auth options, workspace, gateway, channels, daemon, health, skills, what gets written): [Onboarding Wizard (CLI)](/start/wizard).

## Remote mode

- **Remote Gateway URL** (`ws://...`)
- **Token** if the remote Gateway requires auth (recommended)

No remote installs or daemon changes are performed. If the Gateway is loopback‑only, use SSH tunneling or a tailnet.

## Add another agent

Use `openclaw agents add <name>` to create a separate agent with its own workspace, sessions, and auth profiles. Running without `--workspace` launches the wizard. It sets `agents.list[].name`, `agents.list[].workspace`, `agents.list[].agentDir`. Default workspaces follow `~/.openclaw/workspace-<agentId>`. Add bindings to route inbound messages (the wizard can do this). Non-interactive flags: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Non‑interactive mode

Use `--non-interactive` to automate or script onboarding:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Add `--json` for a machine‑readable summary.

**MiniMax example:**

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice minimax-api \
  --minimax-api-key "$MINIMAX_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```

More examples (Gemini, Z.AI, Vercel AI Gateway, Moonshot, Synthetic, OpenCode Zen, add agent): [Onboarding Wizard — Non‑interactive mode](/start/wizard#non-interactive-mode).

## Gateway wizard RPC

The Gateway exposes the wizard flow over RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`). Clients (macOS app, Control UI) can render steps without re‑implementing onboarding logic.

## Related docs

- [Getting Started](/start/getting-started) — from zero to first message
- [Onboarding Wizard (full reference)](/start/wizard) — flow details, Signal setup, what the wizard writes
- [macOS app onboarding](/start/onboarding)
- [Gateway configuration](/gateway/configuration)
- [Channels](/channels) — WhatsApp, Telegram, Discord, Google Chat, Signal, iMessage
- [Skills](/tools/skills), [Skills config](/tools/skills-config)
