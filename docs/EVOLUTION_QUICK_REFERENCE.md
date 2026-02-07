# Evolution Acceleration Quick Reference

**For NEURABOT Agents - Quick Decision Guide**

## Safety Limits (Hard Stops)

- **Max Concurrent Tasks**: 32 total
- **Max Queue Size**: 100 tasks
- **Memory Throttle**: 800MB RSS (reduces concurrency 50%)
- **Memory Hard Limit**: 950MB RSS (only 1 task)
- **Build Concurrency**: 1 build at a time
- **Self-Modify Concurrency**: 2 max

## When Tasks Are Blocked

Check in order:

1. **SMT exhausted?** → Wait for 5-hour window reset
2. **Memory > 800MB?** → System auto-throttles, wait
3. **Queue > 100?** → Wait for tasks to complete
4. **Concurrent > 32?** → Wait for slots to free
5. **Build active?** → Wait for build to finish

## Maximizing Prompt Usage

- **Use full timeout**: 5 minutes (Dev/Legal/COS), 10 minutes (RnD)
- **Make multiple tool calls**: Read, edit, test, validate
- **Don't exit early**: Use the full time allocated
- **Target specific files**: Use `payload.targetFile` if provided

## Self-Modify Workflow

```
1. self_modify(action=validate, filePath=...)  ← Check first
2. read(filePath)                              ← Read file
3. edit/write(...)                             ← Make changes
4. self_modify(action=reload, modifiedFiles=[...]) ← Apply
```

**Before reload:**

- Check if build is active (only 1 at a time)
- Ensure tests pass (if test files exist)
- Verify diff ratio < 50% (90% in poweruser mode)

## Fitness Assessment

Every task MUST:

- Have outcome = COMPLETED
- Have a decision summary
- Have confidence >= 0.7
- Track modified files (if SELF_MODIFY)

## Common Issues

| Issue             | Check             | Solution               |
| ----------------- | ----------------- | ---------------------- |
| Tasks not running | SMT utilization   | Wait for window reset  |
| Build failing     | Build concurrency | Wait for current build |
| Low prompts       | Task timeouts     | Use full 5-10 minutes  |
| Memory pressure   | RSS > 800MB       | System auto-throttles  |

## Full Guide

For detailed information, read: `docs/EVOLUTION_ACCELERATION_GUIDE.md`
