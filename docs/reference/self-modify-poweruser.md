# Technical Verification and Implementation Framework for OpenClaw Autonomous Control Planes

A comprehensive guide to **Poweruser** configuration, self-modification logic, path boundaries, signal-based reloads, and infrastructure resilience. The architectural evolution of the OpenClaw ecosystem—through Clawdbot and Moltbot—represents a shift from a simple tool-calling agent to a persistent, stateful control plane capable of managing diverse communication channels and orchestrating complex workflows autonomously. For the advanced operator, "Poweruser" and "Full Autonomous" configurations are a commitment to a self-evolving system: path boundaries, diff thresholds, signal-based reloads, and safety watchdogs must be understood and tuned. This document merges implementation verification against the codebase with architectural and operational guidance.

**Note:** OpenClaw/Clawdbot do not ship a formal "Poweruser mode" label. The `self_modify` tool (validate + reload) is always available when using `createOpenClawTools()`; this guide describes how to relax boundaries and thresholds and how to harden the environment for full autonomous operation.

<!-- TODO: Update documentation with implementation status. Mark completed features with checkmarks. Document new config options (`selfModify.*`, `gateway.sessionTimeout`, etc.). Add examples for poweruser mode setup. Include troubleshooting guide for common self-modify issues. Add deployment roadmap checklist. Document environment variables (`OPENCLAW_ROOT`, `OPENCLAW_SELF_MODIFY_POWERUSER`, `OPENCLAW_PREFER_PNPM`). -->

---

## 1. Architectural foundations of the OpenClaw gateway

The primary component is the **Gateway**, a centralized orchestrator (TypeScript) that maintains the WebSocket control plane and manages persistent connections to channels (Telegram, WhatsApp, Discord, Slack, Signal). The gateway is designed for 24/7 operation, typically on a VPS or a dedicated local machine (e.g. Mac Mini). It acts as a single source of truth for multi-agent routing, tool streaming, and media processing.

### Network models and bind configurations

The network architecture is **loopback-first**. The default binds the gateway to `ws://127.0.0.1:18789`. For Poweruser configurations requiring remote access, use a non-loopback bind **only** with strict authentication (gateway token or password).

| Parameter                | Default   | Poweruser / autonomous    | Significance                                        |
| ------------------------ | --------- | ------------------------- | --------------------------------------------------- |
| `gateway.bind`           | 127.0.0.1 | tailnet or 0.0.0.0        | Remote node pairing and cross-device orchestration. |
| `gateway.auth.mode`      | token     | password                  | Required for Funnel/Serve; encrypted RPC.           |
| `gateway.port`           | 18789     | user-defined (e.g. 18795) | Port obfuscation and multiple gateway instances.    |
| `gateway.trustedProxies` | None      | ["127.0.0.1", "10.0.0.1"] | Correct IP resolution behind Nginx or Caddy.        |

The **Canvas host** is an HTTP file server on a separate port (default 18793), serving `/___openclaw__/canvas/` for node WebViews. This separates the WebSocket control plane from media delivery.

### Official documentation

- **Elevated Mode** (`/elevated on`): runs on the gateway host and maintains exec approvals. See [docs.clawd.bot/tools/elevated](https://docs.clawd.bot/tools/elevated).
- **Advanced settings**: [Advanced Settings](https://getclawdbot.org/docs/advanced-settings), [Gateway configuration examples](https://docs.clawd.bot/gateway/configuration-examples).

---

## 2. Poweruser configuration: path boundaries and diff thresholds

### Filesystem boundary management

Boundaries are the only gatekeeper for self-edit: **deny rules take precedence over allow rules**. The implementation lives in `src/sowwy/self-modify/boundaries.ts`.

**Current deny list (blocks editing):**

- `src/infra/**`, `src/gateway/**`, `src/cli/**`, `src/security/**`
- `**/*.env*`, `**/secrets/**`, `**/credentials/**`
- `render.yaml`, `Dockerfile*`, `.github/**`
- `package.json`, `pnpm-lock.yaml`
- `src/sowwy/self-modify/boundaries.ts` (no self-unlock)

**Unlocking `src/infra` and `src/security`:** Deny is evaluated first; adding paths only to the allow list has no effect while they remain in the deny list. Remove the corresponding entries from `SELF_MODIFY_DENY`:

```ts
export const SELF_MODIFY_DENY = [
  // "src/infra/**",   // removed for poweruser
  "src/gateway/**",
  "src/cli/**",
  // "src/security/**", // removed for poweruser
  "**/*.env*",
  "**/secrets/**",
  "**/credentials/**",
  "render.yaml",
  "Dockerfile*",
  ".github/**",
  "package.json",
  "pnpm-lock.yaml",
  "src/sowwy/self-modify/boundaries.ts",
] as const;
```

**Safety:** Use least-privilege volume mounts in containers (`:ro` for sensitive dirs, `:rw` only for project/extensions). Never expose `~/.ssh/` or `~/.aws/` to the agent.

### Increasing diff thresholds for autonomous refactoring

The checklist in `src/sowwy/self-modify/checklist.ts` rejects edits where the **line-based diff ratio** is ≥ 50%.

- **Formula:** `computeDiffRatio(old, new)` = `|newLines - oldLines| / max(oldLines, newLines)`.
- **Threshold:** `isMinimal = diffRatio < 0.5`.

**Hardcoded higher threshold (e.g. 80%):**

```ts
const MINIMAL_DIFF_THRESHOLD = 0.8;
const isMinimal = diffRatio < MINIMAL_DIFF_THRESHOLD;
```

**Environment-driven (poweruser flag):**

```ts
const MINIMAL_DIFF_THRESHOLD = process.env.OPENCLAW_SELF_MODIFY_POWERUSER === "1" ? 0.9 : 0.5;
```

Set `OPENCLAW_SELF_MODIFY_POWERUSER=1` in `.env` or the gateway environment to allow larger per-file changes. Use version control (git) and pre-commit/CI gates so the agent commits to a branch and runs tests before merge.

---

## 3. Foundry: self-writing meta-extension (ecosystem context)

**Foundry** is an "agent that builds agents" in the OpenClaw ecosystem: a meta-extension that observes behavior, researches documentation, and writes new capabilities. It turns repeated successful tool sequences into static TypeScript tools ("crystallization").

| Phase    | Activity                                                                      | Outcome                                   |
| -------- | ----------------------------------------------------------------------------- | ----------------------------------------- |
| Observe  | Monitor goal, tool sequence, outcome, duration.                               | Raw behavioral data for pattern matching. |
| Research | Search docs for tool registration APIs.                                       | Context-aware code generation templates.  |
| Learn    | Track success rates; identify crystallization candidates (e.g. 5 runs, 70%+). | Refined knowledge of what works.          |
| Write    | Generate TypeScript with type safety and error handling.                      | New extension code in `extensions/`.      |
| Deploy   | Trigger gateway restart via SIGUSR1 to load new tools.                        | New capabilities available immediately.   |

Crystallization reduces token use, latency, and the risk of the LLM forgetting patterns. Foundry may include an "Overseer" (e.g. hourly) to prune stale patterns and track performance. Marketplace dynamics (e.g. HTTP 402, USDC/Solana) are ecosystem-specific and not part of the core gateway codebase.

---

## 4. Batch validation, reload flow, and signal management

### Batch validation and multi-file reload

The self-modify tool **already accepts multiple files** in one `reload` call. `runSelfEditChecklist(files)` runs boundary, diff, syntax, and secrets checks over the whole array; all must pass. To use batch behavior: have the agent collect several edits, then call `self_modify` once with `action: "reload"` and `modifiedFiles: [ { path, oldContent, newContent }, ... ]`.

### Reload flow (codebase-accurate)

1. Validate every path with `validateSelfModifyPath(file.path)`.
2. Run `runSelfEditChecklist(modifiedFiles)`.
3. Capture rollback commit: `git rev-parse HEAD` in `projectDir` (or `OPENCLAW_ROOT`).
4. Run `pnpm build` in project root (timeout 120s).
5. Call `requestSelfModifyReload({ reason, modifiedFiles, rollbackCommit, validationPassed: true })` in `src/sowwy/self-modify/reload.ts`.

Reload writes a restart sentinel and uses **authorized SIGUSR1**: `authorizeGatewaySigusr1Restart(500)` and `scheduleGatewaySigusr1Restart({ delayMs: 500, reason })` (see `src/infra/restart.ts`). This ensures only an authenticated, validation-passed path can trigger a restart.

### Signal and restart hardening

- **Race conditions:** When SIGUSR1 is received, the daemon must await child process exit (e.g. signal-cli) before starting a new instance; otherwise config file locks and orphaned processes can occur. Use async stop logic with a hard SIGKILL fallback (e.g. 3s timeout).
- **AbortError:** Catch unhandled rejections from cancelled fetches during shutdown so the process does not exit(1) and confuse systemd/launchctl.
- **Config gating:** Authorized restarts prevent unauthenticated entities from forcing a reload to bypass security or audits.

---

## 5. Autonomous safety: watchdogs and automated rollback

### Dead man's switch and rollback

Before applying self-modifications, the system captures the current git commit for rollback. After reload, a watchdog (or the gateway’s own startup logic) checks health. If the gateway does not become healthy within a window (e.g. 15–30s), **automatic rollback** restores the last known good state.

**Reliability (conceptual):**
\(R = P(\text{health probe success} \mid \text{new config}) \times P(\text{recovery time} < T\_{\max})\)

Implementation: `src/sowwy/self-modify/rollback.ts` and `checkSelfModifyRollback` in `server.impl.ts` (startup). Config: `healthCheckTimeoutMs`, `maxConsecutiveFailures` in rollback config.

### Failure modes and mitigations

| Failure mode       | Detection logic                             | Mitigation                                           |
| ------------------ | ------------------------------------------- | ---------------------------------------------------- |
| Invalid config     | Gateway fails to bind to port after reload. | Automatic rollback to backup / git checkout.         |
| Stuck session      | Session state "processing" for >400s.       | Kill session; auto-restart gateway if threshold met. |
| Channel crash      | getUpdates timeout (e.g. Telegram polling). | External watchdog script triggers restart.           |
| Ollama unreachable | Discovery probe fails for local LLM.        | watch-ollama.sh or similar restarts service.         |

External watchdogs (e.g. cron every 2 minutes) can check channel status and restart the gateway if critical integrations are unresponsive.

---

## 6. Host hardening and identity protection

- **Docker:** Use non-root, read-only root filesystem where possible (`--read-only`), `--security-opt=no-new-privileges`, and capability dropping (`--cap-drop=ALL` then add only what’s needed, e.g. `NET_BIND_SERVICE`). Use `Dockerfile.sandbox` / `Dockerfile.sandbox-browser` for isolated tool execution and browsing.
- **Network egress:** Restrict to required APIs (OpenAI, Anthropic, Composio, etc.) via a host-side proxy (e.g. Squid) and allowlist to reduce exfiltration risk.
- **Identity:** Hardening protects the host, not the user’s identity. Use brokered auth (e.g. Composio) with minimal scopes and full audit logging instead of storing raw OAuth tokens locally.

---

## 7. Reliability: sessions, timeouts, and model failover

- **Session timeout:** Use `gateway.sessionTimeout` (e.g. 120_000 ms) so a single long-running LLM call does not block the event loop indefinitely. Configure detection to auto-restart the gateway if a threshold of stuck sessions (e.g. 3+) is reached.
- **Model failover:** Configure the synthetic model catalog to fail over to the next profile when one times out or hits rate limits, so the agent remains responsive during API instability.

---

## 8. Build chain, pre-commit, and memory

- **Build:** OpenClaw uses **tsdown** and **tsgo** for TypeScript. Node 22 is the supported production runtime; Bun can be used for local dev. On some architectures (e.g. Synology, ARM NAS), set `OPENCLAW_PREFER_PNPM=1` for UI build stability.
- **Pre-commit (prek):** For an agent that modifies its own source, run the same checks as CI (`pnpm lint`, `pnpm test`, format) before deploy. Abort deployment if the agent’s changes fail these gates.
- **Memory:** Short-term context is in-memory (lost on restart); long-term memory persists. Context pruning (e.g. for Anthropic) and vector search/RAG depend on configuration. "Crystallized" patterns (Foundry-generated code) are hard-coded behavior with zero token cost.

---

## 9. Environment variables (codebase reference)

| Variable                               | Purpose                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| `OPENCLAW_ROOT`                        | Project root for self-modify (git/build); used in `self-modify-tool.ts`.     |
| `OPENCLAW_SELF_MODIFY_POWERUSER`       | Suggested: set to `1` to use higher diff threshold if implemented.           |
| `OPENCLAW_SKIP_CHANNELS`               | Skip channel loading (e.g. gateway:dev).                                     |
| `OPENCLAW_GATEWAY_TOKEN` / `_PASSWORD` | Gateway auth.                                                                |
| `OPENCLAW_PREFER_PNPM`                 | Prefer pnpm for builds on some platforms.                                    |
| `.env` (Sowwy)                         | `SOWWY_*` for Postgres, LanceDB, SMT, scheduler, approvals (`.env.example`). |

Boundaries are not currently overridden by env; they are fixed in `boundaries.ts`. The 50% diff threshold is hardcoded unless you add the `OPENCLAW_SELF_MODIFY_POWERUSER` check (see section 2).

---

## 10. Programmatic reload and community patterns

**Triggering reload:** The agent calls the `self_modify` tool with `action: "reload"`, `reason`, and `modifiedFiles`. From your own code you can either instantiate `createSelfModifyTool` and call `execute`, or import `runSelfEditChecklist` and `requestSelfModifyReload` from `src/sowwy/self-modify/`, run validation and build, then call `requestSelfModifyReload` (and ensure the sentinel and SIGUSR1 authorization are handled as in `reload.ts`).

**Autonomous loops:** The core repo does not include a dedicated "self-modify scheduler" in `src/agents/`. Sowwy’s mission-control scheduler (`src/sowwy/mission-control/scheduler.ts`) and the cron tool (`src/agents/tools/cron-tool.ts`) can drive periodic tasks; an agent run prompted to "review and self-improve within boundaries" can use `self_modify` (validate → edit → reload) as in chat. A thin script can call `runSelfEditChecklist` and `requestSelfModifyReload` for cron- or script-driven self-evolution.

---

## 11. Strategic deployment roadmap

1. **Environment:** Deploy a VPS (e.g. Ubuntu 24.04, 8GB RAM). Install Node 22+ and pnpm. Configure hardened Docker for the gateway and sandboxes.
2. **Configuration and auth:** Set gateway password/token and bind to Tailscale or a controlled network. Use `dmPolicy="pairing"` so only authorized users can interact.
3. **Boundary unlocking:** Adjust `boundaries.ts` (and optionally workspace/config) to allow project and extension dirs; exclude sensitive system paths. Use Docker volume mounts with `:ro` / `:rw` as appropriate.
4. **Foundry (optional):** Install and configure Foundry for crystallization; set the Overseer interval if available.
5. **Watchdog:** Run an external watchdog to monitor gateway health and channel connectivity; ensure rollback and "dead man’s switch" behavior are active for self-modifications.
6. **CI/CD gating:** Ensure the agent runs prek (or equivalent lint/test/format) before applying code changes; use git for versioning and rollback.

---

## 12. Summary and quick reference

### File modifications (codebase)

| File                                  | Change                                                                                       |
| ------------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/sowwy/self-modify/boundaries.ts` | Remove `src/infra/**` and/or `src/security/**` from `SELF_MODIFY_DENY` to allow editing.     |
| `src/sowwy/self-modify/checklist.ts`  | Replace `diffRatio < 0.5` with a constant or env-driven threshold (e.g. 0.9 when poweruser). |

### Operational checklist

1. Run the gateway under a **watchdog** (launchctl, systemd, supervisor) so it restarts after SIGUSR1.
2. Keep **health check** and rollback timeout appropriate (`rollback.ts`).
3. **Do not** allow editing `src/sowwy/self-modify/boundaries.ts` (no self-unlock).
4. Use a **branch or backup** when enabling infra/security editing or very high diff thresholds.

### Key code locations

- Boundaries: `src/sowwy/self-modify/boundaries.ts` (`SELF_MODIFY_ALLOW`, `SELF_MODIFY_DENY`, `validateSelfModifyPath`).
- Checklist: `src/sowwy/self-modify/checklist.ts` (`runSelfEditChecklist`, `computeDiffRatio`).
- Tool: `src/agents/tools/self-modify-tool.ts` (`createSelfModifyTool`, actions `validate` and `reload`).
- Reload: `src/sowwy/self-modify/reload.ts` (`requestSelfModifyReload`).
- Rollback: `src/sowwy/self-modify/rollback.ts`; startup check in `server.impl.ts`.
- Tool registration: `src/agents/openclaw-tools.ts` (no feature flag; tool always included).

By cross-referencing this guide with the codebase—especially `self-modify-tool.ts` and `reload.ts`—operators can align their Poweruser or Full Autonomous setup with the actual implementation and run a secure, resilient, self-evolving control plane.
