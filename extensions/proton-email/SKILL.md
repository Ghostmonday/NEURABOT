---
name: extension-proton-email
description: Proton Mail extension for Sowwy - IMAP polling and email automation
metadata:
  type: extension
  category: EMAIL
  requires_api:
    - proton-imap
---

# Proton Email Extension

IMAP polling, email processing, and automated responses.

## Features
- IMAP polling every 60 seconds
- Email -> Task conversion with auto-categorization
- Draft/send with approval gates
- Immutable archive with checksums

## Configuration
- PROTON_IMAP_HOST: imap.protonmail.com
- PROTON_IMAP_PORT: 993
- PROTON_EMAIL: your@email.com

## Commands
- `proton.poll` - Trigger immediate poll
- `proton.send` - Send email (requires approval)
- `proton.archive` - Archive email

## Approval Gates
- External send requires human approval
- Bulk operations require approval
- Financial emails require LegalOps review
