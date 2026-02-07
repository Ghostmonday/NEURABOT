# Evolution Acceleration Guide

**For NEURABOT Agents & Personas**

This guide explains how to manage and optimize the evolution acceleration system. Read this when:

- You're executing SELF_MODIFY or FITNESS_CHECK tasks
- You need to understand why tasks are being throttled
- You want to optimize prompt usage
- You're troubleshooting system slowdowns

---

## System Overview

NEURABOT's evolution loop runs continuously:

1. **Task Creation**: Continuous self-modify extension creates 8 tasks every 2 minutes
2. **Task Execution**: Scheduler runs tasks in parallel (up to 32 concurrent)
3. **Fitness Assessment**: Every task must pass fitness checks before completion
4. **Safety Limits**: System automatically throttles when resources are constrained

---

## Safety Limits (Crash Prevention)

The system has hard limits to prevent crashes. These are enforced automatically:

### Global Limits

- **Max Concurrent Tasks**: 32 tasks across all personas
- **Max Queue Size**: 100 tasks total (BACKLOG + READY + IN_PROGRESS)
- **Memory Throttle**: Starts at 800MB RSS (reduces concurrency by 50%)
- **Memory Hard Limit**: 950MB RSS (only 1 task at a time)
- **Build Concurrency**: Only 1 build can run at a time
- **Self-Modify Concurrency**: Max 2 self-modify operations concurrently

### How Safety Limits Work

When you create or execute tasks, the system checks:

1. **Memory Usage**: If RSS > 800MB, throttling begins
2. **Queue Size**: If > 100 tasks, new tasks are blocked
3. **Concurrent Tasks**: If > 32 active, new tasks wait
4. **Build Status**: If a build is running, new builds wait

**What to do if throttled:**

- Check system status: `sowwy.status` or read metrics
- Wait for current tasks to complete
- Reduce task creation frequency if consistently throttled
- Check memory usage: High memory = fewer concurrent tasks

---

## Prompt Usage Optimization

### Current Configuration

- **SMT Window**: 5 hours
- **Default Max Prompts**: 500 per window (can increase to 1000+)
- **Target Utilization**: 95% (system aims to use 95% of available prompts)
- **Reserve**: 20% reserved for priority categories (LEGAL, EMAIL)

### Task Timeouts (More Prompts Per Task)

- **Dev/Legal/ChiefOfStaff**: 5 minutes per task (was 2 minutes)
- **RnD**: 10 minutes per task (was 3 minutes)
- **Self-Modify**: 5 minutes per task (was 2 minutes)

### Task Creation Rate

- **Frequency**: Every 2 minutes (was 5 minutes)
- **Parallel Tasks**: 8 tasks per cycle (was 4)
- **Total**: ~240 tasks per hour = 1,200 tasks per 5-hour window

### How to Maximize Prompt Usage

1. **Use Full Timeout**: Don't exit early - use the full 5-10 minutes
2. **Make Multiple Tool Calls**: Each tool call uses prompts
3. **Read Multiple Files**: Reading files uses prompts
4. **Write Comprehensive Code**: Longer code generation uses more prompts
5. **Run Tests**: Test execution uses prompts

**Example High-Prompt Task:**

```
1. Read 3-5 files (5 prompts)
2. Analyze and plan changes (3 prompts)
3. Make edits to 2-3 files (6 prompts)
4. Run tests (2 prompts)
5. Validate and reload (2 prompts)
Total: ~18 prompts per task
```

With 8 tasks every 2 minutes, that's ~144 prompts per 2 minutes = ~21,600 prompts per 5 hours (way above 500 limit, so SMT will throttle naturally).

---

## Fitness Assessment System

### Mandatory Checks

Every task MUST pass fitness assessment before being marked DONE:

1. **Correctness**: Task outcome must be COMPLETED
2. **Summary Required**: Task must have a decision summary
3. **Confidence Threshold**: Confidence must be >= 0.7
4. **SELF_MODIFY Tasks**: Must track modified files

### Fitness Re-Assessment

- **Frequency**: Weekly (168 hours) by default
- **Automatic**: System creates FITNESS_CHECK tasks automatically
- **Scope**: All modules are re-assessed periodically

**What to do:**

- Always provide clear summaries
- Set confidence >= 0.7
- Track what files you modified
- Don't skip fitness checks

---

## Self-Modification Protocol

### Workflow

1. **Validate**: Call `self_modify(action=validate, filePath=...)` before editing
2. **Edit**: Use `write` or `edit` tools to make changes
3. **Reload**: Call `self_modify(action=reload, modifiedFiles=[...])` to apply

### Safety Checks (Automatic)

- **Boundary Check**: File must be in allowlist
- **Diff Ratio**: Changes must be < 50% (90% in poweruser mode)
- **Syntax Check**: TypeScript must parse correctly
- **Secrets Check**: No API keys/passwords allowed
- **Build Check**: Build must succeed (only 1 build at a time)
- **Test Check**: Tests for modified files must pass

### Build Optimization

- **Non-compilable files**: Build is skipped (docs, json, markdown)
- **TypeScript files**: Fast type-check first (`tsgo --noEmit`)
- **Build timeout**: 90 seconds (reduced from 120s)

**What to do:**

- Check if build is already running before requesting reload
- Wait if build concurrency limit reached
- Fix test failures before reload
- Use `OPENCLAW_SELF_MODIFY_SKIP_TESTS=1` only for development

---

## Monitoring & Diagnostics

### Check System Status

```typescript
// Via RPC (if available)
sowwy.status(); // Returns scheduler state, SMT metrics, resource status

// Check metrics
const metrics = getMetrics(smt);
// Returns: utilization, remaining, windowEnd, etc.
```

### Key Metrics to Track

1. **SMT Utilization**: Should be 80-95% (below = underutilized, above = throttled)
2. **Memory RSS**: Should be < 800MB (800-950MB = throttled, >950MB = hard limit)
3. **Queue Size**: Should be < 50 (50-100 = warning, >100 = blocked)
4. **Concurrent Tasks**: Should be < 20 (20-32 = warning, >32 = blocked)
5. **Active Builds**: Should be 0-1 (2+ = error, should never happen)

### Common Issues & Solutions

**Issue: Tasks not executing**

- Check: SMT utilization (might be throttled)
- Check: Queue size (might be full)
- Check: Memory usage (might be throttled)
- Solution: Wait for window reset or reduce task creation

**Issue: Builds failing**

- Check: Build concurrency (only 1 build at a time)
- Check: Type errors (run `tsgo --noEmit` first)
- Check: Test failures (fix tests before reload)
- Solution: Wait for current build to complete

**Issue: Low prompt usage**

- Check: Task timeouts (use full 5-10 minutes)
- Check: Task frequency (should be every 2 minutes)
- Check: Parallel tasks (should be 8 per cycle)
- Solution: Increase task complexity, use more tool calls

**Issue: Memory pressure**

- Check: Concurrent tasks (reduce if > 20)
- Check: Task timeouts (reduce if tasks run too long)
- Check: Build frequency (builds are memory-intensive)
- Solution: System auto-throttles, but you can reduce task creation

---

## Best Practices

### For SELF_MODIFY Tasks

1. **Target Specific Files**: Use `payload.targetFile` if provided
2. **Fix TODOs First**: Prioritize files with TODO/FIXME comments
3. **One File Per Task**: Don't modify multiple files in one task
4. **Validate Before Reload**: Always call validate first
5. **Use Full Timeout**: Don't exit early - use all 5 minutes

### For FITNESS_CHECK Tasks

1. **Verify Outcomes**: Check that tasks actually completed successfully
2. **Check Metrics**: Review correctness, reliability, efficiency
3. **Re-Assess Modules**: Focus on recently modified modules
4. **Report Findings**: Provide clear summary of assessment results

### For Task Creation

1. **Check Safety Limits**: Verify system can handle more tasks
2. **Respect Queue Size**: Don't create tasks if queue is full
3. **Monitor Memory**: Reduce creation rate if memory is high
4. **Spread Across Personas**: Use all 4 personas (Dev, RnD, ChiefOfStaff, LegalOps)

---

## Configuration Reference

### Environment Variables

```bash
# SMT Configuration
SOWWY_SMT_MAX_PROMPTS=500        # Max prompts per window (default: 500)
SOWWY_SMT_WINDOW_MS=18000000     # Window size: 5 hours
SOWWY_SMT_TARGET_UTILIZATION=0.95 # Target: 95% utilization
SOWWY_SMT_RESERVE_PERCENT=0.20   # Reserve: 20% for priority

# Scheduler Configuration
SOWWY_SCHEDULER_POLL_MS=5000     # Poll every 5 seconds
SOWWY_MAX_CONCURRENT_PER_PERSONA=2 # Concurrent tasks per persona
SOWWY_FAST_MODE=true             # Fast mode: shorter intervals

# Continuous Self-Modify
SOWWY_CONTINUOUS_SELF_MODIFY=true # Enable continuous cycles
```

### Safety Limits (Code Defaults)

```typescript
maxGlobalConcurrent: 32; // Hard limit
maxQueueSize: 100; // Hard limit
memoryThrottleMB: 800; // Start throttling
memoryHardLimitMB: 950; // Hard stop
maxConcurrentBuilds: 1; // Hard limit
maxConcurrentSelfModify: 2; // Hard limit
```

---

## Troubleshooting Checklist

When tasks aren't executing or system seems slow:

- [ ] Check SMT utilization: `getMetrics(smt).utilization`
- [ ] Check memory RSS: `checkResources().memory.rssMB`
- [ ] Check queue size: `taskStore.count({})`
- [ ] Check concurrent tasks: `taskStore.count({ status: "IN_PROGRESS" })`
- [ ] Check active builds: `getSafetyLimits().getStatus().activeBuilds`
- [ ] Check SMT window: Is it reset? (`getMetrics(smt).windowEnd`)
- [ ] Check task creation rate: Is continuous-self-modify enabled?
- [ ] Check resource constraints: `checkResources().shouldPause`

---

## Evolution Metrics

The system tracks evolution speed metrics (when implemented):

- **Self-modifications attempted**: Total attempts
- **Self-modifications succeeded**: Successful completions
- **Self-modifications rolled back**: Failed and rolled back
- **Average build time**: Time spent building
- **Average validation time**: Time spent validating
- **Fitness pass rate**: % of tasks passing fitness checks
- **TODOs resolved**: TODOs fixed
- **TODOs introduced**: New TODOs added

**Goal**: Maximize success rate while maintaining quality.

---

## Quick Reference

### Task Lifecycle

```
BACKLOG → READY → IN_PROGRESS → DONE
                ↓
            BLOCKED / WAITING_ON_HUMAN
```

### Safety Check Order

1. SMT throttle check
2. Resource constraints (memory/disk)
3. Safety limits (queue/concurrent)
4. Build concurrency (if building)
5. Self-modify concurrency (if self-modifying)

### Priority Order

1. **Safety** (never bypass safety limits)
2. **Fitness** (always verify outcomes)
3. **Speed** (optimize after safety/fitness)

---

## For Agents Reading This

When executing tasks:

1. **Read this guide** if you're unsure why tasks are blocked
2. **Check safety limits** before creating many tasks
3. **Use full timeouts** to maximize prompt usage
4. **Provide clear summaries** for fitness assessment
5. **Respect build concurrency** - only 1 build at a time
6. **Monitor memory** - system auto-throttles, but be aware

The system is designed to **automatically** manage safety. Your job is to:

- Execute tasks efficiently
- Use prompts effectively
- Provide quality outcomes
- Let the safety system handle throttling

---

## Emergency Procedures

### If System is Overloaded

1. **Check memory**: If > 950MB, system will auto-throttle to 1 task
2. **Check queue**: If > 100 tasks, new tasks are blocked
3. **Wait**: System will recover automatically as tasks complete
4. **Reduce load**: If persistent, reduce task creation frequency

### If Builds are Failing

1. **Check concurrency**: Only 1 build can run at a time
2. **Wait**: If build is active, wait for it to complete
3. **Check errors**: Fix type errors or test failures
4. **Retry**: After fixing errors, retry the build

### If SMT is Exhausted

1. **Check window**: Window resets every 5 hours
2. **Wait**: Tasks will execute when window resets
3. **Check utilization**: Should be 80-95% normally
4. **Optimize**: If consistently exhausted, tasks may be using too many prompts

---

**Last Updated**: 2026-02-07
**Version**: 1.0
**For**: NEURABOT Agents & Personas
