# Where to Go from Here

This section is intended to be merged into the main README. It does **not** duplicate overview, installation, or architecture. It outlines concrete next-step directions in three areas: giving the system (and operators) the ability to **code and ship iOS apps**, **integrate Tuta Mail with live Telegram comms**, and **organize calendar and reminders from email**. The goal is to bring each track to near-completion so that only a few manual clicks remain where human judgment or Apple’s UI is required.

---

## 1. iOS App Development: Desk.in, Xcode, and Cursor

### 1.1 Goal

Enable the agent (and you) to **develop iOS apps** using a remote Mac via Desk.in, with Xcode for building and running, and Cursor for editing—and to **prepare the app for App Store submission** so that the remaining steps are minimal (e.g. final metadata, review submission, and release).

### 1.2 Giving the System “Skills” in iOS Coding

- **Cursor rules / skills**
  - Add a **Cursor rule or Agent Skill** that describes:
    - Repo layout for `apps/ios/` (Swift, SwiftUI, `project.yml` → Xcode project), `apps/shared/`, and how the iOS app talks to the gateway.
  - Include conventions: where new screens go, how to add capabilities (e.g. Keychain, Background Modes), and how to run tests (`xcodebuild test` or Cursor’s test runner).
  - Reference the **existing** iOS app (e.g. gateway connection, chat, voice, screen, camera) so the agent can extend it rather than invent structure.

- **Desk.in remote Mac**
  - Treat the **remote Mac as the canonical build host**: Xcode, simulators, and signing only run there.
  - Document in a short runbook:
    - How to connect to the Mac via Desk.in (URL, auth, any VPN if needed).
    - That **Cursor can run in the browser** (Cursor for Web) or locally with remote SSH/FS; clarify which workflow you use so the agent knows where “the project” lives (e.g. repo cloned on the remote Mac, or mounted from elsewhere).
  - Ensure the agent (and you) know:
    - How to open the workspace on the **remote Mac** (e.g. `apps/ios/` opened in Cursor there, or via “Open Folder” over SSH/Desk.in).
    - That **build, run, and archive** must be executed on that Mac (e.g. `xcodebuild`, Xcode GUI, or fastlane from a terminal on the Mac).

- **Xcode on the remote Mac**
  - One-time setup to document (or automate):
    - Install Xcode (and accepted license) on the remote Mac.
    - Install **fastlane** (`brew install fastlane`) and any Ruby version required.
    - Ensure **Apple ID** is signed in (Xcode → Settings → Accounts) and **development team** is selected for the iOS project.
  - So that “near completion” is possible without your presence:
    - **Signing**: Use Automatic Signing with the correct Team ID, or document where to set it (e.g. `apps/ios/project.yml` or Xcode UI).
    - **Capabilities**: List which capabilities the app uses (e.g. Push, Keychain, Background Modes) and where they’re enabled so the agent (or a script) can verify they’re on.

- **Agent-usable commands**
  - Expose or document commands the agent can suggest (or that you run) on the **remote Mac**:
    - `cd apps/ios && xcodebuild -scheme <Scheme> -destination 'platform=iOS Simulator,name=iPhone 16' build`
    - `cd apps/ios && xcodebuild -scheme <Scheme> -destination 'generic/platform=iOS' archive -archivePath build/OpenClaw.xcarchive`
    - `cd apps/ios && fastlane beta` (or `fastlane release` when you have a lane for TestFlight/App Store).
  - Optional: a small **script or skill** that “builds and archives for TestFlight” so the agent can say “run `./scripts/ios-archive-for-testflight.sh` on the Mac” and you (or automation) only need to run it.

### 1.3 Prepping for App Store Submission (Near Completion)

The aim is **not** to perform the final “Submit for Review” click for you, but to get the project to a state where **only a few steps** remain (metadata, screenshots, review submission).

- **Code signing and provisioning**
  - **Development**: Ensure the app builds and runs on a real device and simulator from the remote Mac.
  - **Distribution**: Use a **Distribution** certificate and an **App Store** provisioning profile (or let Xcode/fastlane manage them). Document where they’re configured (e.g. `fastlane/.env` with `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_PATH`, `IOS_DEVELOPMENT_TEAM` as in `apps/ios/fastlane/SETUP.md`).
  - So that “near completion” is clear: add a **checklist** (in docs or in a small `docs/ios-appstore-prep.md`) that includes:
    - [ ] App Store Connect API key created and paths in `fastlane/.env`
    - [ ] Version and build number bumped (e.g. in `Info.plist` / `project.yml` and/or fastlane)
    - [ ] Archive produced and validated (e.g. `xcodebuild -exportArchive` or fastlane)
    - [ ] Upload to App Store Connect (e.g. `fastlane deliver` or Transporter / Xcode Organizer)

- **App Store Connect metadata (one-time / per-version)**
  - List what **must** be filled in App Store Connect before submission (so the agent or you can prep copy and assets):
    - App name, subtitle, description, keywords, support URL, privacy policy URL.
    - **Screenshots** per device size (e.g. 6.7", 6.5", 5.5") and locale if needed.
    - **App icon** (already in the app; confirm 1024×1024 in Connect).
    - **Age rating**, **Export Compliance**, **Content Rights**, **Advertising Identifier** (if used).
  - Optional: a **template or script** that generates placeholder screenshots from the simulator (e.g. fastlane `snapshot` or a simple script) so “screenshots” are one command away.

- **What’s left as “a few clicks”**
  - After the above: **upload build** (if not automated by fastlane), then in App Store Connect: select the build for the version, complete any remaining fields, and press **Submit for Review**. The “where to go from here” doc should state exactly that so the path is clear.

---

## 2. Tuta Mail: Archive, Respond, and Live Alerts via Telegram

### 2.1 Goal

Give the system **Tuta Mail** (Tutanota) access to **read** the archive, **respond** to emails (with appropriate safeguards), and **inform the user of important emails** in real time via **Telegram** for direct, live communication—without replacing the main README’s description of the gateway or channels.

### 2.2 Read and Archive Access

- **Access method**
  - Tuta does not offer a classic IMAP/SMTP by default; they provide a **Tuta Mail API** and/or **IMAP bridge** (depending on plan). Document which method you use:
    - If **IMAP bridge**: configure host/port/user/password (or app password) and store them securely (e.g. env or credentials store, same as other gateway secrets). The system can then “read archive” by polling an IMAP folder (e.g. `INBOX`, `Archive`, or a label equivalent).
    - If **API**: use Tuta’s official API for listing/reading messages and implement a small **adapter** (e.g. in `extensions/` or `src/`) that fetches recent or important emails and normalizes them into a format the rest of the pipeline expects (e.g. task payloads or “important email” events).

- **Scope of “read”**
  - Define what “read archive” means operationally: e.g. “last N days” or “all accessible folders,” and whether the agent is allowed to **search** (by sender, subject, date) so it can answer “what did X send about Y?”

### 2.3 Responding to Emails

- **Safety**
  - **Approval gates**: All outbound email (especially to external addresses) should require explicit approval (same idea as the existing Proton extension’s `proton.send` and approval gates). Document: “sending email is gated; the agent proposes drafts and the user approves.”
  - **Scopes**: Only allow sending from a designated address/label and with rate limits so the system cannot blast mail.

- **Implementation**
  - Either extend an existing **email extension** (e.g. adapt the Proton extension’s pattern) to a **Tuta** backend (IMAP/SMTP bridge or API), or add a new `extensions/tuta-email` that:
    - Uses the same SOWWY task categories (e.g. EMAIL) and approval flow.
    - Exposes commands like `tuta.poll`, `tuta.send` (draft + approve), `tuta.archive`.
  - Store drafts and sent items in a way that avoids duplicate sends (e.g. idempotency keys or “last action” per thread).

### 2.4 Informing the User of Important Emails via Telegram

- **Importance**
  - Define “important” in a way the system can implement: e.g. certain senders (allowlist), keywords in subject/body, or a simple classifier (e.g. “invoice,” “meeting,” “urgent”). This can start as a **configurable list** (sender domains, keywords) and later use a small model or rules.

- **Live comms**
  - Use the **existing Telegram channel** in the gateway to push **real-time notifications** to the user:
    - Format: short message (e.g. “Important: [Subject] from [Sender] – [link or summary]”) with optional “Reply” / “Archive” quick actions (if you add Telegram buttons or commands that trigger `tuta.reply` / `tuta.archive`).
  - Ensure the Telegram channel is the one the user uses for “direct” comms so they see these alerts immediately.

- **Flow**
  - On poll (or webhook if Tuta supports it): fetch new mail → run importance logic → for important items, enqueue a **notification task** that sends a message via the Telegram channel to the user. Optionally, add a **digest** mode (e.g. “3 important emails in the last hour”) so the user can choose between instant alerts and batched updates.

### 2.5 Optional: Calendar and Appointments from Email

- **Parsing**
  - From emails that the system reads, **extract** date/time and event-like content (e.g. “Meeting Tuesday 3pm,” “Call with John next week”). This can be done with simple patterns or an LLM call that returns structured data (title, start, end, attendees if present).

- **Calendar**
  - Feed extracted events into a **calendar** (e.g. Google Calendar API, CalDAV, or Apple Calendar). Document which calendar backend you use and how the system is allowed to create/update events (e.g. a dedicated “NEURABOT” calendar with write access).

- **Reminders**
  - Optionally turn some of these into **reminders** (in-app, or via the same Telegram channel: “Reminder: Meeting with X in 1 hour”) so the user gets a nudge in the same live channel they use for important email alerts.

---

## 3. Calendar, Reminders, and Appointments from Email

### 3.1 Goal

Use the system to **organize calendar and reminders** and to **add important appointments** parsed from emails (e.g. Tuta), so the user has a single place (calendar + Telegram) for schedule and follow-ups.

### 3.2 Calendar Backend

- **Choice**
  - Pick one primary calendar (e.g. Google Calendar, CalDAV, or Apple) and document:
    - How the system authenticates (OAuth, app password, or API key).
    - Which calendar(s) it can read and write (e.g. a dedicated “NEURABOT” calendar to avoid cluttering the main one).

- **Operations**
  - Define what the agent can do: **create** event, **update** (reschedule/cancel), **list** (e.g. “what’s on today?”). Expose these as **tools** or **extension commands** (e.g. `calendar.create`, `calendar.list`, `calendar.update`) with clear parameters (title, start, end, description).

### 3.3 Reminders

- **Source**
  - Reminders can come from:
    - **User** (e.g. “remind me to X at Y” via Telegram or chat).
    - **Email** (e.g. “this email needs a follow-up in 2 days” → create reminder).
    - **Calendar** (e.g. “notify me 1 hour before each meeting”).
  - Implement a small **reminder store** (in-memory, DB, or a third-party like Apple Reminders / Google Tasks) and a **scheduler** that checks due reminders and sends a **Telegram message** (or other channel) to the user at the right time.

### 3.4 Adding Appointments from Email

- **Pipeline**
  - When the system **reads** an email (e.g. from Tuta):
    1. Run **extraction** (regex or LLM) for event-like content.
    2. Map to structured fields: title, start, end, location, attendees.
    3. Optionally **confirm with the user** via Telegram (“Add event: X on Y at Z? Yes/No”) to avoid wrong imports.
    4. Call **calendar.create** (and optionally create a **reminder** for 15 minutes before).
  - This ties together the **Tuta** integration (read) and the **calendar** integration (write), with Telegram as the **live** channel for confirmation and reminders.

### 3.5 Where This Lives in the Repo

- **Extensions**
  - Consider an extension (e.g. `extensions/calendar` or `extensions/tuta-calendar`) that:
    - Depends on the email adapter (Tuta) for reading.
    - Depends on the calendar backend for writing.
    - Uses the task scheduler or a dedicated cron to run “process inbox for events” and “send due reminders.”
  - Reuse **approval gates** for creating calendar events from email if you want the user to approve each one; otherwise document that “auto-add from email” is opt-in and scoped (e.g. only from certain senders or labels).

---

## 4. Merging This into the Main README

- **Placement**
  - Add a new top-level section, e.g. **“Where to Go from Here,”** after the main architecture and quick start (e.g. after §10 in the current README).
- **Content**
  - Copy the sections above (or link to this file) so that the README remains the single entry point: architecture + quick start + **next steps** (iOS, Tuta + Telegram, calendar/reminders).
- **Tone**
  - Keep it as a **roadmap and runbook**: what to configure, what to build, and what remains “a few clicks” so that anyone (or the agent) can follow it without guessing.

---

_This document is written to be merged into the main README and to avoid duplicating overview, install, or architecture. It focuses on three tracks: iOS app development and App Store prep, Tuta Mail with Telegram alerts, and calendar/reminders from email._
