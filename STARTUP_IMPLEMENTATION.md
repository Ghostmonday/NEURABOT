# SOWWY Startup Health Check - Implementation Summary

## What Was Implemented

### 1. Health Check and Startup Prompt System

**File:** `src/sowwy/startup/health-prompt.ts`

A comprehensive startup system that:
- Runs health checks on all SOWWY subsystems (Task Store, Identity Store, SMT Throttler, Watchdog)
- Displays an interactive terminal UI showing system status
- Prompts user: **"System health is optimal. Shall I proceed with autonomous operations now?"**
- Creates the initial Roadmap Observer task if approved
- Respects Constitution §0 (Safety Net)

### 2. Gateway Integration

**Modified:** `src/gateway/server.impl.ts` (lines 509-548)

The gateway now:
1. Runs health check after SOWWY bootstrap
2. Displays health status with colored output (✓/✗ for each component)
3. Shows warnings and errors
4. Prompts for user approval
5. Creates Roadmap Observer task if approved
6. Starts scheduler regardless (processes existing tasks)

### 3. Environment Variables

**Added to:** `.env.example`

```bash
# Startup Behavior
SOWWY_AUTO_APPROVE=false  # Auto-approve without prompt (automated deployments)
SOWWY_SKIP_PROMPT=false   # Skip prompt entirely (manual control)
```

### 4. README Documentation

**Updated:** Multiple sections with incremental test validation guidance

#### Self-Modification Section
Added **"CRITICAL: Incremental Test Validation"** explaining:
- Validation happens at each step (not just at the end)
- Checklist runs per-edit before any changes apply
- TypeScript syntax validation after each file edit
- Final aggregate validation before reload

#### SOWWY Section  
Added **"Validation checkpoints at each step"** showing:
- Verify TypeScript compilation after schema changes
- Test persona executor is called after registration
- Check tasks.list RPC returns created tasks
- Verify task state transitions work correctly

## How It Works

### Startup Flow

```
Gateway Start
    ↓
Bootstrap SOWWY (stores, identity, SMT, scheduler)
    ↓
Run Health Check
    ├─ Task Store: Can list tasks?
    ├─ Identity Store: Can search?
    ├─ SMT Throttler: Can proceed?
    └─ Watchdog: Is HEALTHCHECKS_URL set?
    ↓
Display Health Status (with colors)
    ├─ ✓ Components working
    ├─ ⚠ Warnings (optional)
    └─ ✗ Errors (if any)
    ↓
Prompt User
    ├─ "Shall I proceed with autonomous operations now? (yes/no)"
    └─ Explains safety constraints (approval gates, SMT, watchdog)
    ↓
If YES:
    ├─ Check for existing MISSION_CONTROL tasks
    ├─ Create Roadmap Observer task if not exists
    └─ Log task ID
    ↓
If NO:
    └─ Show command: "openclaw roadmap:activate" (for later)
    ↓
Start Scheduler (always runs)
```

### Visual Output Example

```
╔═══════════════════════════════════════════════════════════════╗
║          SOWWY Mission Control - Startup Health Check         ║
╚═══════════════════════════════════════════════════════════════╝

System Components:
  ✓ Task Store
  ✓ Identity Store
  ✓ SMT Throttler
  ✓ Watchdog Monitor

⚠ Warnings:
  ⚠ Watchdog monitoring disabled (no HEALTHCHECKS_URL). Consider enabling for production.

✓ System health: OPTIMAL

The Roadmap Observer (README §12) can autonomously create and manage tasks
to drive completion of Track 1 (iOS), Track 2 (Tuta Mail), and Track 3 (Calendar).

This respects all safety constraints from the Ratified Constitution (README §0):
  • Approval gates for high-risk actions
  • SMT throttling (100 prompts per 5 hours)
  • Watchdog monitoring and crash recovery
  • Self-modification boundaries and checklist

Shall I proceed with autonomous operations now? (yes/no): _
```

## Test Validations Throughout Implementation

### README Now Documents Incremental Validation

Every major implementation section now includes **"Validation checkpoints"** or **"Verify"** steps:

1. **SOWWY / Mission Control** (§6)
   - Verify TypeScript compilation after schema changes
   - Test executor registration and invocation
   - Check RPC responses for created tasks
   - Verify task state transitions

2. **Self-Modification** (§9)
   - Validation during checklist execution (per-edit)
   - TypeScript syntax check after each file change
   - Secret detection on new content
   - Diff ratio enforcement
   - Final aggregate validation before reload

3. **Process & Runtime** (§4)
   - Verify PM2 list shows gateway running
   - Check logs for startup errors
   - Test restart and recovery

4. **Troubleshooting** (§13)
   - Check Node version, dependencies, environment
   - Verify ports available
   - Test connections (PostgreSQL, LanceDB, etc.)

## Usage

### Normal Startup (Interactive)

```bash
openclaw gateway run
```

User will see health check and be prompted to approve autonomous operations.

### Automated Deployment (Auto-Approve)

```bash
SOWWY_AUTO_APPROVE=true openclaw gateway run
```

Skips prompt, automatically creates Roadmap Observer task if health check passes.

### Manual Control (Skip Prompt)

```bash
SOWWY_SKIP_PROMPT=true openclaw gateway run
```

No prompt; user can activate later with `openclaw roadmap:activate`.

## Constitution Compliance

This implementation aligns with the **Ratified Constitution** (README §0):

| Role | Section | Implementation |
|------|---------|----------------|
| **The Goal** | §12 Where to Go from Here | Roadmap Observer reads Section 12 tracks |
| **The Brain** | §6 SOWWY / Mission Control | Scheduler breaks tracks into sub-tasks |
| **The Hands** | §5 Data Flow | Agent Runner executes tools and code |
| **The Safety Net** | §9 Self-Modification, §4 Process & Runtime | Health check + approval gates + SMT throttle + Watchdog |

## Safety Constraints Enforced

1. **Health Check First**: System doesn't proceed without healthy subsystems
2. **User Approval**: Explicit yes/no prompt (unless auto-approve enabled)
3. **Informative Display**: User sees exactly what components are checked
4. **Constitutional Reference**: Prompt explains all safety mechanisms
5. **Graceful Degradation**: Scheduler starts even if user declines (processes existing tasks)
6. **Manual Recovery**: Shows `openclaw roadmap:activate` command if user declines

## Next Steps

The Roadmap Observer extension (from the earlier plan) still needs implementation:
1. Add MISSION_CONTROL category to schema
2. Create roadmap-observer extension with README parser
3. Implement RoadmapObserverExecutor
4. Register in extension loader

But the **startup flow is now complete**: SOWWY asks permission before going into autonomous mode.

## Summary

✅ **Health check on startup** - Validates all subsystems before proceeding  
✅ **Interactive prompt** - "Shall I proceed with autonomous operations now?"  
✅ **Incremental test validations documented** - README shows validation steps throughout  
✅ **Constitution compliance** - Safety Net (§0, §4, §8, §9) enforced  
✅ **Environment controls** - AUTO_APPROVE and SKIP_PROMPT options  
✅ **User-friendly output** - Colored terminal UI with clear status  

The system now **asks for permission** and explains **what it will do** before enabling autonomous operations. Test validations are **documented at every step** in the README, not just at the end.
