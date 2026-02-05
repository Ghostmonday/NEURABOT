# Self-Modify Poweruser & Full Autonomous Configuration

This guide synthesizes how to unlock **Poweruser**-style behavior for self-modification: broader edit boundaries, larger diffs, optional batch validation, and environment-driven overrides. OpenClaw/Clawdbot do not ship a formal "Poweruser mode" label; this document describes the existing self-modify stack and the file/env changes needed for full autonomous operation.

---

## 1. Official documentation and "Poweruser" / Full Autonomous

- **OpenClaw/Clawdbot** do not define a named "Poweruser" or "Full Autonomous" mode in official docs.
- **Elevated Mode** (`/elevated on`) is the closest built-in: it runs on the gateway host and maintains exec approvals. See [docs.clawd.bot/tools/elevated](https://docs.clawd.bot/tools/elevated).
- **Advanced settings** (automation rules, resource allocation, model customization) are documented under [Advanced Settings](https://getclawdbot.org/docs/advanced-settings) and [Gateway configuration examples](https://docs.clawd.bot/gateway/configuration-examples).
- Self-modify is **agent-tool driven**: the `self_modify` tool (validate + reload) is always available when using `createOpenClawTools()`; there is no separate "poweruser" feature flag in the core repo.

---

## 2. Modifying path boundaries (`src/sowwy/self-modify/boundaries.ts`)

Boundaries are the only gatekeeper for self-edit: **deny rules win over allow rules**.

### Current deny list (blocks editing)

- `src/infra/**` — infrastructure
- `src/gateway/**` — gateway
- `src/cli/**` — CLI
- `src/security/**` — security
- `**/*.env*`, `**/secrets/**`, `**/credentials/**`
- `render.yaml`, `Dockerfile*`, `.github/**`
- `package.json`, `pnpm-lock.yaml`
- `src/sowwy/self-modify/boundaries.ts` (no self-unlock)

### Unlocking `src/infra` and `src/security` for autonomous editing

**Option A – Remove from deny list (maximum autonomy, higher risk)**

Edit `src/sowwy/self-modify/boundaries.ts`:

```ts
export const SELF_MODIFY_DENY = [
  // Optional: keep infra/gateway/cli if you want to restrict
  // "src/infra/**",
  // "src/gateway/**",
  // "src/cli/**",
  // "src/security/**",
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

**Option B – Remove only the deny entries you want to unlock**

In the current implementation **deny is evaluated first**; allow is checked only if no deny rule matched. So to allow `src/infra` or `src/security` you must **remove** those patterns from `SELF_MODIFY_DENY`. Adding them only to `SELF_MODIFY_ALLOW` does nothing while they are still in the deny list.

Minimal change to unlock both `src/infra` and `src/security`:

```ts
export const SELF_MODIFY_DENY = [
  // "src/infra/**",   // removed for poweruser
  "src/gateway/**",
  "src/cli/**",
  // "src/security/**", // removed for poweruser
  "**/*.env*",
  // ... rest unchanged
] as const;
```

---

## 3. Increasing minimal-diff ratio (`src/sowwy/self-modify/checklist.ts`)

The checklist rejects edits where the **line-based diff ratio** is ≥ 50%.

- **Location:** `runSelfEditChecklist` → per-file diff check.
- **Formula:** `computeDiffRatio(old, new)` = `|newLines - oldLines| / max(oldLines, newLines)`.
- **Threshold:** `isMinimal = diffRatio < 0.5` (i.e. &lt; 50%).

### Hardcoding a higher threshold (e.g. 80%)

In `src/sowwy/self-modify/checklist.ts`:

```ts
// 2. Diff check (changes are minimal, not full overwrites)
const MINIMAL_DIFF_THRESHOLD = 0.8; // Allow up to 80% change (poweruser)
for (const file of files) {
  const diffRatio = computeDiffRatio(file.oldContent, file.newContent);
  const isMinimal = diffRatio < MINIMAL_DIFF_THRESHOLD;
  // ...
}
```

### Making it environment-driven (poweruser flag)

At top of file:

```ts
const MINIMAL_DIFF_THRESHOLD = process.env.OPENCLAW_SELF_MODIFY_POWERUSER === "1" ? 0.9 : 0.5;
```

Then in the loop use `diffRatio < MINIMAL_DIFF_THRESHOLD` instead of `< 0.5`. Set `OPENCLAW_SELF_MODIFY_POWERUSER=1` in `.env` or the gateway environment to allow up to 90% change per file.

---

## 4. Batch validation and multi-file reload

- **Current behavior:** The self-modify tool already accepts **multiple files** in one `reload` call. `runSelfEditChecklist(files)` runs boundary, diff, syntax, and secrets checks **over the whole array**; all must pass for the reload to proceed. So validation is already batch at the checklist level.
- **"One file at a time"** in practice usually means either:
  - The agent edits one file per turn and then calls reload with one entry, or
  - The 50% per-file diff limit forces smaller, incremental edits per file.

To get **batch behavior** without code changes:

1. Have the agent collect several edits (e.g. from multiple write/edit tool calls).
2. Call `self_modify` once with `action: "reload"` and `modifiedFiles: [ { path, oldContent, newContent }, ... ]` for all modified files.

No change is required in `checklist.ts` or `self-modify-tool.ts` for multi-file validation; the only change that might be desired is **reporting** (e.g. returning which file failed which check in a structured way), which is already present via `checklistResult.checks` and `blockingErrors`.

---

## 5. Environment variables and hidden flags

### Existing env vars relevant to self-modify and gateway

| Variable                                               | Purpose                                                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_ROOT`                                        | Project root for self-modify tool (git/build); used in `resolveProjectRoot()` in `self-modify-tool.ts`. |
| `OPENCLAW_SKIP_CHANNELS`                               | Skip channel loading (e.g. `gateway:dev`).                                                              |
| `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` | Gateway auth.                                                                                           |
| `OPENCLAW_SKIP_CRON`                                   | Disable cron (tests).                                                                                   |
| `.env` (Sowwy)                                         | `SOWWY_*` for Postgres, LanceDB, SMT, scheduler, kill switch, approvals (see `.env.example`).           |

### Not present today (suggested for Poweruser)

- **Boundaries:** No env var currently overrides allow/deny lists; they are fixed in `boundaries.ts`.
- **Checklist threshold:** The 50% diff threshold is hardcoded; see section 3 for adding e.g. `OPENCLAW_SELF_MODIFY_POWERUSER`.
- **Bypass manual coordination:** Reload is already autonomous from the agent’s perspective (validate → build → request SIGUSR1 restart). Human "coordination" is only implied by tool policy (who can call `self_modify`) and approval flows (e.g. exec approvals), not by a flag in the self-modify module.

To add a simple poweruser bypass (e.g. skip diff check when env is set), you could in `checklist.ts`:

```ts
const skipDiffCheck = process.env.OPENCLAW_SELF_MODIFY_POWERUSER === "1";
// In the diff check loop:
const isMinimal = skipDiffCheck || diffRatio < 0.5;
```

(Use only in trusted environments.)

---

## 6. Community scripts and autonomous loops in `src/agents/`

- There are **no** community-contributed scripts in this repo that implement a dedicated "task scheduler for self-modification" or an "autonomous self-modify loop" inside `src/agents/`.
- **Sowwy** provides a mission-control **scheduler** (`src/sowwy/mission-control/scheduler.ts`) and task store for persona/task execution; it does not drive the `self_modify` tool directly.
- **Cron** (`src/agents/tools/cron-tool.ts`) can run recurring tasks; an agent could in principle run a cron job that invokes code calling the same validation/reload logic, but that would require a small integration layer (e.g. a script that uses the gateway RPC or the same checklist/reload functions).

A minimal "self-evolution loop" could be implemented as:

1. A scheduled task (cron or Sowwy task) that triggers an agent run with a prompt like "review and self-improve within boundaries."
2. The agent uses `self_modify` (validate + edit + reload) as it does in chat; no change to `self-modify-tool.ts` is required for that.
3. Optionally, a thin script in `scripts/` or a small module in `src/agents/` that calls `runSelfEditChecklist` and `requestSelfModifyReload` (from `src/sowwy/self-modify/`) with a list of file changes, for use from cron or another runner.

---

## 7. Programmatically triggering reload (`self-modify-tool.ts`)

The reload action is triggered by the **agent** calling the `self_modify` tool with:

- `action: "reload"`
- `reason: string`
- `modifiedFiles: Array<{ path, oldContent, newContent }>`

Flow inside the tool:

1. Validate every path with `validateSelfModifyPath(file.path)`.
2. Run `runSelfEditChecklist(modifiedFiles)` (boundary, diff, syntax, secrets, no self-boundary edit).
3. Capture rollback commit: `git rev-parse HEAD` in `projectDir` (or `OPENCLAW_ROOT`).
4. Run `pnpm build` in project root (timeout 120s).
5. Call `requestSelfModifyReload({ reason, modifiedFiles: paths, rollbackCommit, validationPassed: true })`.

To trigger reload **programmatically** from your own code (e.g. a script or another service):

- **Option A – Use the tool:** Instantiate the tool and call `execute` with the same schema (e.g. from a Node script that imports `createSelfModifyTool` and runs in the same process as the gateway). This reuses all validation and build logic.
- **Option B – Call the protocol directly:** Import `runSelfEditChecklist` and `requestSelfModifyReload` from `src/sowwy/self-modify/`, run your own validation and build, then call `requestSelfModifyReload`. You must still write the restart sentinel and authorize SIGUSR1 (as in `reload.ts`).

Example (pseudo-code) for Option B:

```ts
import { runSelfEditChecklist } from "./sowwy/self-modify/checklist.js";
import { requestSelfModifyReload } from "./sowwy/self-modify/reload.js";
// ... after building and capturing rollbackCommit:
const result = await runSelfEditChecklist(modifiedFiles);
if (result.passed) {
  await requestSelfModifyReload({
    reason: "automated overhaul",
    modifiedFiles: modifiedFiles.map((f) => f.path),
    rollbackCommit,
    validationPassed: true,
  });
}
```

The watchdog (or launchctl/systemd) restarts the gateway after SIGUSR1; on startup, `checkSelfModifyRollback` in `server.impl.ts` runs and performs rollback if health checks fail.

---

## 8. Poweruser configuration guide – summary

### File modifications

| File                                  | Change                                                                                                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/sowwy/self-modify/boundaries.ts` | Remove `src/infra/**` and/or `src/security/**` from `SELF_MODIFY_DENY` to allow editing those trees (see section 2).                                                     |
| `src/sowwy/self-modify/checklist.ts`  | Replace `diffRatio < 0.5` with a constant or env-driven threshold (e.g. `OPENCLAW_SELF_MODIFY_POWERUSER=1` → 0.9). Optionally add `skipDiffCheck` when poweruser is set. |

### Environment setup

- **Project root:** Set `OPENCLAW_ROOT` to the repo root so self-modify and build run in the correct directory (especially when the process cwd is not the repo).
- **Poweruser diff threshold (if implemented):** In `.env` or gateway env:
  `OPENCLAW_SELF_MODIFY_POWERUSER=1`
- **Sowwy (optional):** Use `.env` for `SOWWY_*` (Postgres, SMT, scheduler). For less human coordination, set `SOWWY_REQUIRE_APPROVAL=false` and `SOWWY_KILL_SWITCH=false` only in dev/trusted environments.

### Operational checklist

1. Ensure the gateway runs with a **watchdog** (launchctl, systemd, or supervisor) so that after SIGUSR1 the process restarts.
2. Ensure **health checks** and rollback timeout are acceptable (see `rollback.ts`: `healthCheckTimeoutMs`, `maxConsecutiveFailures`).
3. Do not remove the protection that blocks editing `src/sowwy/self-modify/boundaries.ts` (no self-unlock).
4. Use a **branch or backup** when enabling infra/security editing or very high diff thresholds so you can revert if needed.

### Quick reference – key locations

- Boundaries: `src/sowwy/self-modify/boundaries.ts` (`SELF_MODIFY_ALLOW`, `SELF_MODIFY_DENY`, `validateSelfModifyPath`).
- Checklist: `src/sowwy/self-modify/checklist.ts` (`runSelfEditChecklist`, `computeDiffRatio`, 50% threshold).
- Tool: `src/agents/tools/self-modify-tool.ts` (`createSelfModifyTool`, actions `validate` and `reload`).
- Reload protocol: `src/sowwy/self-modify/reload.ts` (`requestSelfModifyReload`).
- Rollback: `src/sowwy/self-modify/rollback.ts` and `server.impl.ts` (startup rollback check).
- Tool registration: `src/agents/openclaw-tools.ts` (`createSelfModifyTool` in the tools array); no feature flag—always included.

With these changes and env settings, you get a Poweruser-style setup: broader paths, larger per-file diffs, and optional env-driven bypasses, while keeping rollback and checklist safety in place.
