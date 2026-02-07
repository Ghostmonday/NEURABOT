# NEURABOT / OpenClaw — Full Project Code Audit Report

**Date:** 2026-02-07
**Scope:** `src/`, extensions, config, tests, tooling.
**Method:** Static analysis, typecheck, lint, LOC scan, pattern grep, rule compliance.

---

## 1. Executive Summary

| Area                          | Status          | Notes                                     |
| ----------------------------- | --------------- | ----------------------------------------- |
| **TypeScript**                | ❌ 1 error      | `migrate-embeddings.ts` metadata type     |
| **Lint/Format**               | ⏸ Blocked by TS | `pnpm check` fails on `tsgo` first        |
| **Build**                     | ⏸ Blocked by TS | Same                                      |
| **File size (700 LOC)**       | ⚠️ Many over    | Guideline only; 50+ files >700 LOC        |
| **Skill fitness (mandatory)** | ⚠️ Partial      | Only 1 explicit fitness ref in `src/`     |
| **Error handling**            | ⚠️ Patterns     | Empty `catch {}` in 30+ places            |
| **Secrets / redaction**       | ✅ Addressed    | Audit checks, redact config, env patterns |
| **`any` usage**               | ⚠️ Present      | 40+ files; mix of tests and prod          |

**Critical:** Fix the single TypeScript error so `pnpm check` and CI can run; then address high‑impact findings below.

---

## 2. TypeScript & Build

### 2.1 Blocking error (1)

- **File:** `src/sowwy/identity/migrate-embeddings.ts` (lines 65–67)
- **Error:** `TS2353` — `migratedFromZeroVector` and `migratedAt` are not in `IdentityFragment.metadata` type.
- **Cause:** `IdentityFragment.metadata` in `src/sowwy/identity/fragments.ts` is defined as:
  `{ originalMessage?: string; extractionModel?: string; reviewedByHuman?: boolean }`.
- **Fix options:**
  1. **Extend type (recommended):** In `fragments.ts`, add optional `migratedFromZeroVector?: boolean` and `migratedAt?: string` to the metadata interface.
  2. **Narrow in migration:** In `migrate-embeddings.ts`, pass a typed object that only includes the three known fields and store migration info elsewhere (e.g. a separate migration log), or use a type assertion with a short comment.

### 2.2 Other

- No other TS errors in `src/` for the paths that were in scope.
- Roo’s earlier fixes (deliver, sowwy extensions, server-sowwy, types.openclaw) are in place and type-clean.

---

## 3. Lint, Format, and Tooling

- **`pnpm check`** = `tsgo` → `lint` → `format`. Fails at `tsgo` due to the error above.
- **oxlint / oxfmt:** Not run in isolation here; assume they pass once TS passes.
- **LOC script:** `scripts/check-ts-max-loc.ts --max 500` runs successfully; it reports many files over 500 LOC (and the 700 LOC guideline). No hard guardrail.

**Recommendation:** Resolve the TS error, then run `pnpm check` and fix any new lint/format issues.

---

## 4. Project Standards Compliance

### 4.1 File size (~700 LOC guideline)

- Many files exceed 700 LOC; the rule states this is a guideline, not a hard guardrail.
- Largest in `src/`: `memory/manager.ts` (2364), `agents/bash-tools.exec.ts` (1628), `tts/tts.ts` (1580), `infra/exec-approvals.ts` (1419), etc.
- **Suggestion:** Prioritize splitting only the most changed or highest-risk modules (e.g. `memory/manager.ts`, `agents/bash-tools.exec.ts`) when touching them.

### 4.2 Skill fitness (mandatory firmware)

- **Rule:** All skills/features/extensions must define a fitness function, pass assessment before deployment, and re-assess periodically.
- **Enforcement points:** Scheduler (don’t mark DONE without fitness), Self-Modify, Continuous Self-Modify, Roadmap Observer.
- **Finding:** Only one clear reference in `src/` to fitness/reAssessment (e.g. in `sowwy/mission-control/scheduler.ts`). No widespread “SKILL FITNESS” block in module headers.
- **Recommendation:**
  - Add a fitness block (or pointer to doc) in critical modules: scheduler, self-modify, continuous-self-modify, roadmap-observer, persona executors.
  - Implement or document: “correctness” metric, “reliability” (e.g. consecutive successes), “efficiency” (e.g. max prompts), and `reAssessmentInterval`.

### 4.3 TypeScript standards

- **Strict typing / no `any`:** oxlint config sets `typescript/no-explicit-any` to error. There are still 40+ files with `: any` or `as any`, many in tests and a few in production (e.g. `imap-adapter`, `gateway/rpc-methods`, `security/audit`, `agents/pi-embedded-messaging`, etc.).
- **Recommendation:** Leave test `any` for speed if acceptable; replace production `any` with proper types or bounded unknowns.

### 4.4 Error handling

- **Empty or minimal `catch`:** 30+ instances of `catch {}` or `catch () {}` (e.g. `memory/manager.ts`, `memory/internal.ts`, `media-understanding/runner.ts`, `media/fetch.ts`, `agents/model-auth.ts`, `canvas-host/a2ui.ts`, etc.).
- **Rule:** Avoid silent failures; log and/or rethrow with context.
- **Recommendation:** Replace empty catches with at least a debug/trace log and a comment (e.g. “INTENTIONAL: …”) where ignoring is by design; otherwise log and rethrow or return a structured error.

### 4.5 Security & secrets

- **Config:** Security audit checks for gateway password and hooks token in config; recommends env for secrets.
- **Logging:** `logging.redactSensitive` is checked; “off” is flagged and auto-fix suggests `"tools"`.
- **Secrets resolution:** API keys and channel secrets are resolved via env/config in a consistent way (`model-auth`, `onboard-non-interactive`, channel adapters, etc.); no obvious hardcoded secrets in the audited paths.
- **Recommendation:** Keep `redactSensitive` default at `"tools"` and ensure no secrets in default configs or docs.

---

## 5. Architecture & Critical Paths

### 5.1 Core areas (sampled)

- **Config:** `config/io.ts`, `config/types.openclaw.ts` — load, validate, env substitution; `outbound.failover` typed.
- **Agents:** Large surface (bash, PI embedded, tools, model-auth); error handling and tool boundaries are the main risk.
- **Infra / outbound:** `deliver.ts` — failover and reply/thread params are correct after Roo’s fixes.
- **Sowwy:** Gateway context (scheduler, stores, identity), extensions (continuous-self-modify, tuta-email, twilio), mission-control (store, scheduler) — types and integration are aligned after recent fixes.
- **Security:** Audit, fix, and redaction logic are present and tested.

### 5.2 Dependencies

- **package.json:** Node >=22.12, pnpm; many dependencies with overrides/patches. Carbon dependency is not to be updated (per rules).
- **Plugins/extensions:** Live under `extensions/`; plugin-only deps should stay in extension `package.json`; avoid `workspace:*` in dependencies.

---

## 6. Test & CI

- **Vitest:** Unit tests colocated (`*.test.ts`); e2e in `*.e2e.test.ts`; coverage thresholds 70% (lines/branches/functions/statements).
- **Test run:** Full `pnpm test --run` was not completed in this audit (timeout); at least typecheck was run.
- **Recommendation:** After fixing the TS error, run `pnpm test` and `pnpm test:coverage` and fix any regressions.

---

## 7. Findings Summary

| Priority | Finding                                               | Action                                                                                     |
| -------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **P0**   | 1 TS error in `migrate-embeddings.ts` (metadata type) | Extend `IdentityFragment.metadata` in `fragments.ts` or adjust migration type/assertion.   |
| **P1**   | `pnpm check` / CI blocked by TS                       | Resolve P0, then run check and fix lint/format.                                            |
| **P1**   | Skill fitness not implemented per module              | Add fitness blocks and metrics for scheduler, self-modify, roadmap-observer, key personas. |
| **P2**   | Empty `catch` in 30+ places                           | Add logging or “INTENTIONAL” comments; avoid silent swallow.                               |
| **P2**   | Production `any` in several files                     | Replace with proper types in imap-adapter, rpc-methods, audit, agents where feasible.      |
| **P3**   | Many files >700 LOC                                   | Refactor when touching; prioritize memory/manager and bash-tools.exec.                     |

---

## 8. Recommended Next Steps

1. **Immediate:** Fix `src/sowwy/identity/migrate-embeddings.ts` (extend `IdentityFragment.metadata` in `src/sowwy/identity/fragments.ts` with `migratedFromZeroVector?: boolean` and `migratedAt?: string`).
2. Run `pnpm check` and fix any lint/format issues.
3. Run `pnpm test` and `pnpm test:coverage`; address failures and coverage drops.
4. Add fitness function documentation (or headers) and enforcement for scheduler, self-modify, and roadmap observer.
5. Triage empty `catch` blocks: add logs or explicit “INTENTIONAL” comments.
6. Plan incremental removal of production `any` in the files listed in section 4.3.

---

_End of audit report._
