# Code watch

The codebase is being **watched** for changes. A baseline snapshot is kept in `code-watch-baseline.md`.

## What is tracked

- **All code changes:** additions, updates, deletions in `src/`, `apps/`, `extensions/`, `ui/`, `scripts/`, `skills/`, etc.
- **Dependency changes:** `package.json`, lockfile, extension `package.json`s
- **Config and tooling:** config files, CI, version bumps
- **Docs:** changes under `docs/`

## How to use

- **"What changed?"** / **"Check what changed"** — Agent will compare current state to the baseline (git diff, status, new commits) and summarize.
- **"Note the current state"** — Agent can update the baseline to “now” so future comparisons use the new snapshot.

Baseline commit: see `code-watch-baseline.md`.
