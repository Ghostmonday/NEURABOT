#!/usr/bin/env bash
# TODO: Create deployment helper script for poweruser setup. Script should: 1) Verify VPS
# environment (Ubuntu 24.04, 8GB RAM, Node 22+, pnpm), 2) Configure hardened Docker for
# gateway and sandboxes, 3) Set gateway password/token and bind to Tailscale, 4) Adjust
# boundaries.ts for poweruser mode, 5) Install watchdog, 6) Verify CI/CD gating (prek).
# Add `openclaw deploy poweruser` command.
#
# Usage: ./scripts/deploy-poweruser.sh
exit 0
