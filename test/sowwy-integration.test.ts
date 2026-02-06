/**
 * SOWWY Integration Tests
 *
 * Tests the full scheduler loop: task creation -> dispatch -> execution -> completion.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Task } from "../src/sowwy/mission-control/schema.js";
import { createStubIdentityStore } from "../src/sowwy/identity/store-stub.js";
import { TaskScheduler } from "../src/sowwy/mission-control/scheduler.js";
import { createInMemoryStores } from "../src/sowwy/mission-control/store.js";
import { SMTThrottler } from "../src/sowwy/smt/throttler.js";

describe("SOWWY Integration", () => {
  let stores: ReturnType<typeof createInMemoryStores>;
  let scheduler: TaskScheduler;
  let identityStore: ReturnType<typeof createStubIdentityStore>;
  let smt: SMTThrottler;

  beforeEach(() => {
    stores = createInMemoryStores();
    identityStore = createStubIdentityStore();
    smt = new SMTThrottler({
      windowMs: 60000,
      maxPrompts: 100,
      targetUtilization: 0.8,
      reservePercent: 0.1,
    });
    scheduler = new TaskScheduler(stores.tasks, identityStore, smt, {
      pollIntervalMs: 100,
      maxRetries: 3,
      stuckTaskThresholdMs: 1000,
      maxConcurrentPerPersona: 1,
    });
  });

  it("should execute task through full lifecycle", async () => {
    // Create a task
    const task = await stores.tasks.create({
      title: "Test task",
      description: "Test description",
      category: "DEV",
      personaOwner: "Dev",
      urgency: 5,
      importance: 5,
      risk: 1,
      stressCost: 1,
      requiresApproval: false,
      maxRetries: 1,
      dependencies: [],
      contextLinks: {},
      createdBy: "test",
    });

    expect(task.status).toBe("BACKLOG");

    // Register a mock executor
    const mockExecutor = vi.fn().mockResolvedValue({
      success: true,
      outcome: "COMPLETED",
      summary: "Task completed",
      confidence: 0.9,
    });

    scheduler.registerPersona("Dev", mockExecutor);

    // Start scheduler
    await scheduler.start();

    // Wait for task to be processed
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify executor was called
    expect(mockExecutor).toHaveBeenCalled();

    // Verify task status
    const updatedTask = await stores.tasks.get(task.taskId);
    expect(updatedTask?.status).toBe("DONE");
    expect(updatedTask?.outcome).toBe("COMPLETED");

    await scheduler.stop();
  });

  it("should handle task state transitions correctly", async () => {
    const task = await stores.tasks.create({
      title: "State transition test",
      description: "Test",
      category: "DEV",
      personaOwner: "Dev",
      urgency: 5,
      importance: 5,
      risk: 1,
      stressCost: 1,
      requiresApproval: false,
      maxRetries: 1,
      dependencies: [],
      contextLinks: {},
      createdBy: "test",
    });

    // Initial state: BACKLOG
    expect(task.status).toBe("BACKLOG");

    // Promote to READY
    await stores.tasks.update(task.taskId, { status: "READY" });
    const readyTask = await stores.tasks.get(task.taskId);
    expect(readyTask?.status).toBe("READY");

    // Execute (scheduler will move to IN_PROGRESS then DONE)
    const mockExecutor = vi.fn().mockResolvedValue({
      success: true,
      outcome: "COMPLETED",
      summary: "Done",
      confidence: 1.0,
    });

    scheduler.registerPersona("Dev", mockExecutor);
    await scheduler.start();

    await new Promise((resolve) => setTimeout(resolve, 500));

    const finalTask = await stores.tasks.get(task.taskId);
    expect(finalTask?.status).toBe("DONE");

    await scheduler.stop();
  });
});
