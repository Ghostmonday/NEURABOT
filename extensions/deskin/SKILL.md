---
name: extension-deskin
description: DeskIn extension for Mac automation
metadata:
  type: extension
  category: AUTOMATION
  requires_api:
    - deskin
---

# DeskIn Extension

Mac automation via DeskIn remote control.

## Features

- Establish remote session
- Screen capture
- Mouse/keyboard automation
- App launching

## Configuration

- DESKIN_API_URL: DeskIn API endpoint
- DESKIN_DEVICE_ID: Target device ID

## Commands

- `deskin.connect` - Establish session
- `deskin.screenshot` - Capture screen
- `deskin.click` - Mouse action
- `deskin.type` - Keyboard input
- `deskin.app.open` - Launch app
- `deskin.terminate` - End session

## Hard Gates (Always Blocked)

- App Store submissions
- System preferences changes
- Financial app operations
- Delete operations

## Safety

- All operations logged
- Session timeout: 30 minutes
- Require explicit opt-in per session
