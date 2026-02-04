# Tool Conventions

**This file is guidance only - it does not control tool availability.**

## Critical Safety Rules

**Before ANY git operation:**

1. Run `git status` and check for:
   - `.env` files
   - `*.key`, `*.pem` files
   - `credentials/` directory
   - Any secrets
2. Use `git add -p` to review changes interactively
3. Never commit secrets (even in private repos)

## Project-Specific Conventions

### This Repo Structure

```
clawdbot/
├── src/sowwy/          # Sowwy core (mission-control, identity, personas)
├── extensions/         # Extensions (hostinger, etc.)
├── docs/               # Documentation
└── workspace/          # Agent workspace (this directory)
```

### Key Commands

```bash
# Development
pnpm build              # Build TypeScript
pnpm gateway:dev        # Start gateway in dev mode
pnpm test               # Run tests

# Sowwy-specific
# Tasks managed via RPC: tasks.list, tasks.create, etc.
```

### Environment Variables

- `MINIMAX_API_KEY` - Required (set via onboarding)
- `SOWWY_POSTGRES_HOST` - Optional (defaults to in-memory if not set)
- `SOWWY_IDENTITY_PATH` - Default: `~/.openclaw/sowwy-identity`

## File Naming

- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

## Code Style

- TypeScript with strict mode
- Use Zod for validation
- Prefer async/await over promises
- Error handling: throw with context

## Testing

```bash
pnpm test           # Unit tests
pnpm test:e2e      # End-to-end
pnpm test:coverage # Coverage report
```

---

**Note**: Standard git/Docker/npm conventions apply but don't need documentation here. Focus on project-specific patterns only.
