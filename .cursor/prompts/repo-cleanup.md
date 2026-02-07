# Repo Cleanup — READ-ONLY AUDIT THEN SAFE DELETIONS ONLY

## CARDINAL RULES — VIOLATE NONE OF THESE

1. **NEVER delete or modify any `.ts` source file** in `src/`, `ui/`, `extensions/`, or `apps/`.
2. **NEVER delete or modify** `package.json`, `tsconfig.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.env`, `.env.example`, `ecosystem.config.cjs`, `README.md`, or any config file.
3. **NEVER touch** `node_modules/`, `.git/`, `.cursor/`, `.openclaw/`, `.openclaw-dev/`, `.clawdbot/`, `dist/`, `build/`.
4. **NEVER run** `git stash`, `git checkout`, `git reset`, `git clean`, or any destructive git command.
5. **NEVER remove any npm dependency or modify any lock file.**
6. If uncertain whether something is safe to delete, **SKIP IT**.

## WHAT TO CLEAN (safe targets only)

Run each category as a **dry-run list first** (`find ... -print`), show me the list, then delete only after confirmation.

### 1. Stale log files (older than 7 days)

```bash
find ~/.npm/_logs -name "*.log" -mtime +7 -print
find ~/.config/Cursor/logs -name "*.log" -mtime +7 -print
find ~/.pm2/logs -name "*.log" -size +10M -print
find ~/.config/Cursor/process-monitor -name "*.log" -mtime +7 -print
```

### 2. Editor swap/temp files inside the project

```bash
find ~/Projects/NEURABOT -maxdepth 5 -type f \( -name "*.swp" -o -name "*~" -o -name ".DS_Store" -o -name "*.kate-swp" -o -name "Thumbs.db" \) -not -path "*/node_modules/*" -print
```

### 3. Old Cursor temp project directories (NOT the current session)

```bash
find ~/.cursor/projects/tmp-* -maxdepth 0 -type d -mtime +1 -print
```

Keep any directory that is currently in use (check terminal files).

### 4. Duplicate plan files

List all files in `~/.cursor/plans/`. If two files have the same `name:` in frontmatter, keep the newer one and delete the older duplicate. **Ask before deleting.**

### 5. Empty directories inside `src/`

```bash
find ~/Projects/NEURABOT/src -type d -empty -print
```

### 6. Orphaned test snapshots (`.snap` files with no matching test)

```bash
find ~/Projects/NEURABOT -name "*.snap" -not -path "*/node_modules/*" -print
```

For each, check if a corresponding `.test.ts` exists. If not, it is orphaned.

## WORKFLOW

1. Run all dry-run commands above.
2. Present results as a single list grouped by category.
3. Wait for my approval before deleting anything.
4. Delete approved items only.
5. Run `pnpm build` to confirm nothing is broken.

## WHAT NOT TO DO

- Do not "refactor" or "improve" any code.
- Do not suggest removing features, extensions, or platform integrations.
- Do not edit any source file for any reason.
- Do not create new files (other than this prompt).
- Do not run `pnpm test` (too slow for cleanup).
