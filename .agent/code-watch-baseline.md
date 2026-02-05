# Code watch baseline

Snapshot used to detect and document changes to the codebase. Compare current state to this baseline when asked "what changed?"

## Baseline snapshot

- **Date:** 2025-02-05
- **Git commit:** `a5be229b4062ec9e317442b2fdc20fb4e36fe51d`
- **Git message:** feat: implement Foundry Overseer scheduler
- **Branch:** main (tracking origin/main)
- **Package version:** 2026.2.1 (openclaw)

### Uncommitted at baseline

- Modified (not staged): `.gateway-watchdog.log`, `.gateway.pid`, `scripts/.gateway-watchdog.log`, `scripts/.gateway.pid`

### Key areas

- **Source:** `src/` (TypeScript)
- **Apps:** `apps/android`, `apps/ios`, `apps/macos`, `apps/shared`
- **Extensions:** `extensions/*`
- **Skills:** `skills/*`
- **UI:** `ui/`
- **Scripts:** `scripts/`
- **Docs:** `docs/`

---

To see what changed since this baseline: run `git diff a5be229b4062ec9e317442b2fdc20fb4e36fe51d` and `git status`, or ask the agent to "check what changed" / "what's new in the code".
