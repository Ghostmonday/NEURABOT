#!/bin/bash
# Self-Modify Boundary Enforcement
#
# System-level guard that prevents ANY commit from modifying deny-listed files
# unless committed by a human (detected via OPENCLAW_HUMAN_COMMIT=1 env var).
#
# This enforces the same boundaries defined in:
#   src/sowwy/self-modify/boundaries.ts
#
# The bot's self_modify tool checks these boundaries voluntarily.
# This script ensures enforcement even if the bot bypasses self_modify
# and uses raw edit/write tools instead.
#
# Human override: OPENCLAW_HUMAN_COMMIT=1 git commit ...
# Or use:         scripts/committer "msg" file1 file2 ...

set -euo pipefail

# ── Human override ──────────────────────────────────────────────────────────
# Humans can bypass this check. The bot cannot set env vars in a hook.
if [ "${OPENCLAW_HUMAN_COMMIT:-}" = "1" ]; then
  exit 0
fi

# ── Detect if commit is from a human or the bot ────────────────────────────
# Heuristic: if GIT_AUTHOR_NAME contains "openclaw", "sowwy", "neurabot",
# or "bot", treat it as a bot commit. Otherwise, assume human.
AUTHOR_NAME=$(git var GIT_AUTHOR_IDENT 2>/dev/null | sed 's/ <.*//' | tr '[:upper:]' '[:lower:]')

is_bot_commit() {
  case "$AUTHOR_NAME" in
    *openclaw*|*sowwy*|*neurabot*|*bot*|*system*|*agent*) return 0 ;;
    *) return 1 ;;
  esac
}

# If this looks like a human commit, allow it
if ! is_bot_commit; then
  exit 0
fi

# ── Deny patterns (mirrors SELF_MODIFY_DENY in boundaries.ts) ─────────────
# Keep this in sync with src/sowwy/self-modify/boundaries.ts
DENY_PATTERNS=(
  "src/infra/"
  "src/gateway/"
  "src/cli/"
  "src/security/"
  ".env"
  "secrets/"
  "credentials/"
  "render.yaml"
  "Dockerfile"
  ".github/"
  "package.json"
  "pnpm-lock.yaml"
  "src/sowwy/self-modify/boundaries.ts"
)

# ── Check staged files ─────────────────────────────────────────────────────
STAGED=$(git diff --cached --name-only --diff-filter=ACMRD 2>/dev/null)
if [ -z "$STAGED" ]; then
  exit 0
fi

BLOCKED=""
for file in $STAGED; do
  for pattern in "${DENY_PATTERNS[@]}"; do
    case "$file" in
      ${pattern}*)
        BLOCKED="${BLOCKED}\n  - ${file} (blocked by: ${pattern}*)"
        ;;
    esac
  done
done

if [ -n "$BLOCKED" ]; then
  echo ""
  echo "============================================================"
  echo "  SELF-MODIFY BOUNDARY VIOLATION"
  echo "============================================================"
  echo ""
  echo "  Bot commit detected that modifies protected files:"
  echo -e "$BLOCKED"
  echo ""
  echo "  These files are in the deny list and cannot be modified"
  echo "  by the bot, even outside of the self_modify tool."
  echo ""
  echo "  If you are a human, override with:"
  echo "    OPENCLAW_HUMAN_COMMIT=1 git commit ..."
  echo ""
  echo "============================================================"
  exit 1
fi

exit 0
