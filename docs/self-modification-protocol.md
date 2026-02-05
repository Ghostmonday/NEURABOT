# Self-Modification Protocol

**Version:** 1.0
**Date:** 2026-02-04
**Status:** Canonical
**Audience:** AI Agents, Human Operators, IDE Models

---

## Overview

The **Self-Modification Protocol** enables SOWWY agents to edit their own code within defined boundaries and trigger supervised restarts, with safety gates and automatic rollback support.

This is a **controlled capability**, not unlimited self-modification. Agents operate within strict boundaries and must pass validation checks before any changes are applied.

---

## Capability Summary

An agent **can** edit its own code **and relaunch itself** _if and only if_:

1. **Writable boundary** — Files are in the allowlist and not in the denylist
2. **Restart authority** — Agent signals completion; supervisor executes restart
3. **Safety gate** — All validation checks pass before restart

Without these, self-modification becomes either unsafe (runaway loops, bricking) or illusory (agent thinks it updated but didn't).

---

## Three Distinct Capabilities

### 1. Self-Inspection

The agent can:

- Read its own source files
- Understand its own entrypoint
- Know which files define behavior vs wiring

**Status:** ✅ Already available (local code access)

---

### 2. Self-Modification (Controlled)

The agent can:

- Edit specific files (NOT the whole repo)
- Write diffs, not blind overwrites
- Update logic, prompts, schemas, adapters

**But only inside a declared sandbox.**

#### Allowed Directories

```
src/agents/**/*.ts          # Agent logic (own behavior)
src/sowwy/**/*.ts          # SOWWY core logic
extensions/**/*.ts          # Extension system
docs/**/*.md                # Documentation
skills/**/*.md, *.ts        # Skills and behavior definitions
src/**/prompts/**           # Prompts
src/**/templates/**         # Templates
```

#### Forbidden Directories

```
src/infra/**                # Infrastructure (NEVER touch)
src/gateway/**              # Gateway code (NEVER touch)
src/cli/**                  # CLI code (NEVER touch)
src/security/**             # Security code (NEVER touch)
**/*.env*                   # Environment files
**/secrets/**               # Secrets directories
**/credentials/**           # Credentials directories
render.yaml                 # Deployment config
Dockerfile*                # Docker configs
.github/**                  # CI/CD configs
package.json                # Package management (requires human)
pnpm-lock.yaml             # Lock file (requires human)
src/sowwy/self-modify/**   # Self-modify boundaries (no self-unlocking)
```

---

### 3. Self-Relaunch (Delegated, Not Magical)

The agent **does not literally restart itself** like a daemon.

Instead, it must:

1. Finish edits
2. Signal completion via `requestSelfModifyReload()`
3. Trigger a **supervised relaunch mechanism** (SIGUSR1)

The gateway daemon handles the actual restart. This avoids recursion death spirals.

---

## Self-Modification Protocol

### Step 1: Validate Boundaries

Before editing any file, check if it's allowed:

```typescript
import { validateSelfModifyPath } from "sowwy/self-modify";

const validation = validateSelfModifyPath("src/sowwy/personas/dev-skill.ts");
if (!validation.allowed) {
  throw new Error(`Cannot edit: ${validation.reason}`);
}
```

### Step 2: Run Checklist

Before committing changes, run the validation checklist:

```typescript
import { runSelfEditChecklist } from "sowwy/self-modify";

const result = await runSelfEditChecklist([
  {
    path: "src/sowwy/personas/dev-skill.ts",
    oldContent: oldCode,
    newContent: newCode,
  },
]);

if (!result.passed) {
  throw new Error(`Validation failed:\n${result.blockingErrors.join("\n")}`);
}
```

**Checklist validates:**

1. **Boundary check** — All files in allowlist
2. **Diff check** — Changes are minimal (< 50% change)
3. **Syntax check** — TypeScript files must parse
4. **Secrets check** — No credentials in code
5. **Loop detection** — Not editing self-modify boundaries

### Step 3: Get Rollback Commit

Before making changes, capture current state:

```typescript
import { execSync } from "node:child_process";

const rollbackCommit = execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
```

### Step 4: Make Edits

Apply your changes using standard file operations.

### Step 5: Request Reload

Signal completion and request supervised restart:

```typescript
import { requestSelfModifyReload } from "sowwy/self-modify";

const result = await requestSelfModifyReload({
  reason: "Improved Dev persona error handling",
  modifiedFiles: ["src/sowwy/personas/dev-skill.ts"],
  rollbackCommit: rollbackCommit,
  validationPassed: true,
});

if (!result.scheduled) {
  throw new Error(`Reload failed: ${result.error}`);
}
```

The gateway will:

1. Write restart sentinel with rollback info
2. Authorize SIGUSR1 restart
3. Schedule restart after 500ms delay
4. Gateway daemon handles actual restart

### Step 6: Automatic Rollback (If Needed)

If health checks fail after restart, the system automatically reverts:

```typescript
// This runs automatically on gateway startup
import { checkSelfModifyRollback } from "sowwy/self-modify";

const rollbackResult = await checkSelfModifyRollback();
if (rollbackResult.rolledBack) {
  console.log(`Rolled back: ${rollbackResult.reason}`);
}
```

**Rollback strategy:** File-scoped (`git checkout <commit> -- <files>`)

- Reverts only modified files
- Preserves unrelated work
- Minimal blast radius

---

## Safety Properties

1. **Deny takes precedence** — Any deny match blocks, even if allow matches
2. **No self-unlocking** — Boundaries file is in deny list
3. **Diff-based edits only** — Large overwrites blocked (< 50% change)
4. **Syntax validation** — TypeScript must parse
5. **Secrets detection** — No credentials in code
6. **Supervised restart** — Agent signals, daemon executes
7. **Automatic rollback** — Failed health checks revert changes
8. **Git-based recovery** — File-scoped rollback preserves unrelated work

---

## Implementation Details

### Glob Matching

Uses custom regex-based matcher consistent with existing `src/agents/sandbox/tool-policy.ts`:

- `*` matches single path segment (no `/`)
- `**` matches any path depth (including `/`)
- No external dependency required

### Rollback Strategy

**File-scoped rollback** chosen over hard reset:

- Safer for concurrent multi-agent work
- Preserves untracked files and unrelated commits
- Minimal blast radius on failure
- Requires sentinel to track modified files (already implemented)

**Command:** `git checkout <commit> -- <files>`

---

## Agent Briefing

```
Capability update:

You are authorized to modify your own code and resume operation using the updated version.

Scope:
- You may read and edit files in approved directories only.
- You must never modify secrets, infra, gateway code, or deployment configs.
- All edits must be deliberate and minimal (diff-based).

Self-edit protocol:
1. Inspect your current code to identify the change needed.
2. Validate file is in allowlist (validateSelfModifyPath).
3. Run checklist before committing (runSelfEditChecklist).
4. Capture rollback commit (git rev-parse HEAD).
5. Make edits.
6. Request reload (requestSelfModifyReload).

Relaunch protocol:
- You do NOT hot-restart yourself.
- After edits, you must signal "ready for reload" via requestSelfModifyReload().
- A supervising process (gateway daemon) will restart you with the new code.

Safety rules:
- Never enter self-edit loops.
- Never repeatedly relaunch without human confirmation.
- If uncertain about impact, stop and ask.

Interpretation:
You are a system that can improve itself, but not a runaway process.
Self-modification is a tool, not a reflex.
```

---

## What This Enables

- 🔁 **Live evolution** — Agent improves without manual redeploys
- 🧠 **Persistent upgrades** — Changes survive restarts
- 🛑 **Controlled autonomy** — No infinite rebuild loops
- 🧱 **Fault containment** — Bad edits don't brick the system

---

## What This Does NOT Imply

- ❌ The agent does NOT get root access
- ❌ The agent does NOT control infra
- ❌ The agent does NOT self-spawn endlessly
- ❌ The agent does NOT bypass human authority

You are granting **editor rights + reload request**, not god mode.

---

## File Structure

```
src/sowwy/self-modify/
├── boundaries.ts      # Allowlist/denylist definitions
├── checklist.ts        # Pre-commit validation
├── reload.ts           # Supervised restart request
├── rollback.ts         # Failure recovery
└── index.ts            # Public API exports
```

---

## API Reference

### `validateSelfModifyPath(filePath: string): SelfModifyValidation`

Check if a file path is allowed for self-modification.

### `runSelfEditChecklist(files): Promise<ChecklistResult>`

Run all validation checks before committing changes.

### `requestSelfModifyReload(request): Promise<{ scheduled: boolean; error?: string }>`

Request supervised restart after successful edits.

### `checkSelfModifyRollback(config?): Promise<{ rolledBack: boolean; reason?: string }>`

Check for rollback on gateway startup (called automatically).

---

## References

- [Scout Role Specification](./scout-role-and-execution.md) — Scout's isolation model
- [SOWWY Architecture](./SOWWY_ARCHITECTURE.md) — System overview
- [Gateway Server](../src/gateway/server.impl.ts) — Restart integration point

---

**End of Specification**
