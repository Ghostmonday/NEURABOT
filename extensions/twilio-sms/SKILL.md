---
name: extension-twilio-sms
description: Twilio SMS extension for Sowwy - SMS channel integration
metadata:
  type: extension
  category: SMS
  requires_api:
    - twilio
---

# Twilio SMS Extension

SMS channel integration for Sowwy.

## Features
- SMS ingress via webhook
- Intent detection (command, approval, context update)
- Human-style responses
- "Second Brain" quick replies

## Configuration
- TWILIO_ACCOUNT_SID: your account sid
- TWILIO_AUTH_TOKEN: your auth token
- TWILIO_PHONE_NUMBER: your twilio number

## Commands
- `sms.send` - Send SMS (requires approval)
- `sms.reply` - Reply to SMS
- `sms.intent` - Detect intent from message

## Intent Types
- `COMMAND` - Direct command
- `APPROVAL` - Approval request
- `CONTEXT` - Context update
- `CHAT` - General chat

## Approval Gates
- All outbound SMS requires approval
- International numbers require explicit allowlist
