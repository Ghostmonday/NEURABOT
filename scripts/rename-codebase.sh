#!/usr/bin/env bash
# rename-codebase.sh — Rename sowwy→cash and NEURABOT→CASH across the codebase
#
# Usage:
#   bash scripts/rename-codebase.sh          # dry run (shows what would change)
#   bash scripts/rename-codebase.sh --apply  # actually do it
#
# What it does:
#   1. Renames src/sowwy/ → src/cash/
#   2. Renames neurabot-native/ → cash-native/
#   3. Replaces all string variants in source files
#   4. Updates import paths
#   5. Renames files containing "sowwy" or "neurabot" in their name
#
# Safe to run multiple times. Skips node_modules, dist, .git, target.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DRY=true
[[ "${1:-}" == "--apply" ]] && DRY=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[rename]${NC} $*"; }
warn() { echo -e "${YELLOW}[rename]${NC} $*"; }
dry()  { echo -e "${RED}[dry-run]${NC} $*"; }

SKIP="--exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude-dir=target --exclude-dir=.pnpm-store --exclude-dir=coverage"

# ============================================================================
# Step 1: Show scope
# ============================================================================
log "Scanning for replacements..."

SOWWY_COUNT=$(grep -ri 'sowwy' "$ROOT" --include='*.ts' --include='*.tsx' --include='*.js' --include='*.json' --include='*.md' --include='*.sh' --include='*.yml' --include='*.toml' --include='*.rs' 2>/dev/null | grep -v node_modules | grep -v '/dist/' | grep -v '/.git/' | grep -v '/target/' | wc -l)
NEURABOT_COUNT=$(grep -ri 'neurabot' "$ROOT" --include='*.ts' --include='*.tsx' --include='*.js' --include='*.json' --include='*.md' --include='*.sh' --include='*.yml' --include='*.toml' --include='*.rs' 2>/dev/null | grep -v node_modules | grep -v '/dist/' | grep -v '/.git/' | grep -v '/target/' | wc -l)

log "Found ~$SOWWY_COUNT 'sowwy' occurrences and ~$NEURABOT_COUNT 'neurabot' occurrences"

if $DRY; then
  warn "DRY RUN — no changes will be made. Use --apply to execute."
  echo ""
fi

# ============================================================================
# Step 2: Rename directories (order matters — deepest first for nested)
# ============================================================================
rename_dir() {
  local from="$1" to="$2"
  if [[ -d "$from" ]]; then
    if $DRY; then
      dry "mv $from → $to"
    else
      log "mv $from → $to"
      mv "$from" "$to"
    fi
  fi
}

log "--- Directory renames ---"

# src/sowwy → src/cash
rename_dir "$ROOT/src/sowwy" "$ROOT/src/cash"

# neurabot-native → cash-native
rename_dir "$ROOT/neurabot-native" "$ROOT/cash-native"

# Files with sowwy/neurabot in their name
log "--- File renames ---"
if ! $DRY; then
  # Find and rename files containing 'sowwy' in name (excluding skipped dirs)
  find "$ROOT" -type f -name "*sowwy*" \
    -not -path "*/node_modules/*" \
    -not -path "*/dist/*" \
    -not -path "*/.git/*" \
    -not -path "*/target/*" \
    2>/dev/null | while read -r f; do
    newname="$(echo "$f" | sed 's/sowwy/cash/g; s/Sowwy/Cash/g; s/SOWWY/CASH/g')"
    if [[ "$f" != "$newname" ]]; then
      mkdir -p "$(dirname "$newname")"
      log "rename: $f → $newname"
      mv "$f" "$newname"
    fi
  done

  # Find and rename files containing 'neurabot' in name
  find "$ROOT" -type f -name "*neurabot*" \
    -not -path "*/node_modules/*" \
    -not -path "*/dist/*" \
    -not -path "*/.git/*" \
    -not -path "*/target/*" \
    2>/dev/null | while read -r f; do
    newname="$(echo "$f" | sed 's/neurabot/cash/g; s/NEURABOT/CASH/g; s/Neurabot/Cash/g')"
    if [[ "$f" != "$newname" ]]; then
      mkdir -p "$(dirname "$newname")"
      log "rename: $f → $newname"
      mv "$f" "$newname"
    fi
  done
else
  find "$ROOT" -type f \( -name "*sowwy*" -o -name "*neurabot*" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/dist/*" \
    -not -path "*/.git/*" \
    -not -path "*/target/*" \
    2>/dev/null | while read -r f; do
    dry "would rename: $f"
  done
fi

# ============================================================================
# Step 3: Replace strings in file contents
# ============================================================================
log "--- Content replacements ---"

# Order matters: longest/most-specific first to avoid partial replacements
REPLACEMENTS=(
  # NEURABOT variants
  "NEURABOT:CASH"
  "Neurabot:Cash"
  "neurabot:cash"
  "neurabot-native:cash-native"
  "neurabot-gateway:cash-gateway"
  "neurabot-sentinel:cash-sentinel"
  # Sowwy variants (careful with SOWWY_ env prefix)
  "SOWWY_:CASH_"
  "SOWWY:CASH"
  "Sowwy:Cash"
  "sowwy:cash"
  # Import paths
  "src/sowwy:src/cash"
  "../sowwy:../cash"
  "./sowwy:./cash"
  "/sowwy/:\/cash/"
)

EXTENSIONS="ts,tsx,js,jsx,mjs,cjs,json,md,mdc,yml,yaml,sh,toml,rs,cjs"

for pair in "${REPLACEMENTS[@]}"; do
  from="${pair%%:*}"
  to="${pair##*:}"

  if $DRY; then
    count=$(grep -rFl "$from" "$ROOT" --include='*.ts' --include='*.tsx' --include='*.js' --include='*.json' --include='*.md' --include='*.sh' --include='*.yml' --include='*.toml' --include='*.rs' --include='*.mjs' --include='*.cjs' 2>/dev/null | grep -v node_modules | grep -v '/dist/' | grep -v '/.git/' | grep -v '/target/' | grep -v '.lock' | grep -v BOTCODE.md | wc -l)
    if [[ "$count" -gt 0 ]]; then
      dry "'$from' → '$to' (in $count files)"
    fi
  else
    grep -rFl "$from" "$ROOT" --include='*.ts' --include='*.tsx' --include='*.js' --include='*.json' --include='*.md' --include='*.sh' --include='*.yml' --include='*.toml' --include='*.rs' --include='*.mjs' --include='*.cjs' 2>/dev/null | grep -v node_modules | grep -v '/dist/' | grep -v '/.git/' | grep -v '/target/' | grep -v '.lock' | grep -v BOTCODE.md | while read -r file; do
      sed -i "s|$(printf '%s\n' "$from" | sed 's/[[\.*^$()+?{|]/\\&/g')|$(printf '%s\n' "$to" | sed 's/[[\.*^$()+?{|]/\\&/g; s/\\/\\\\/g')|g" "$file"
    done
    log "replaced: '$from' → '$to'"
  fi
done

# ============================================================================
# Step 4: Summary
# ============================================================================
echo ""
if $DRY; then
  warn "DRY RUN complete. Review above, then run:"
  warn "  bash scripts/rename-codebase.sh --apply"
else
  log "Rename complete. Next steps:"
  log "  1. pnpm install          # update lockfile"
  log "  2. pnpm build            # verify build"
  log "  3. pnpm test             # verify tests"
  log "  4. git add -A && git status   # review changes"
fi
