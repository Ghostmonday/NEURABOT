/**
 * Persona Dispatch Tests
 *
 * Tests that tasks are routed to the correct persona executors.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createStubIdentityStore } from "../src/sowwy/identity/store-stub.js";
import { TaskScheduler } from "../src/sowwy/mission-control/scheduler.js";
import { createInMemoryStores } from "../src/sowwy/mission-control/store.js";
import { SMTThrottler } from "../src/sowwy/smt/throttler.js";

describe("Persona Dispatch", () => {
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

  it("should route DEV tasks to Dev executor", async () => {
    const task = await stores.tasks.create({
      title: "Dev task",
      description: "Code task",
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

    const devExecutor = vi.fn().mockResolvedValue({
      success: true,
      outcome: "COMPLETED",
      summary: "Dev work done",
      confidence: 0.9,
    });

    scheduler.registerPersona("Dev", devExecutor);
    await scheduler.start();

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(devExecutor).toHaveBeenCalled();
    await scheduler.stop();
  });

  it("should route EMAIL tasks to ChiefOfStaff executor", async () => {
    const task = await stores.tasks.create({
      title: "Email task",
      description: "Send email",
      category: "EMAIL",
      personaOwner: "ChiefOfStaff",
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

    const cosExecutor = vi.fn().mockResolvedValue({
      success: true,
      outcome: "COMPLETED",
      summary: "Email sent",
      confidence: 0.8,
    });

    scheduler.registerPersona("ChiefOfStaff", cosExecutor);
    await scheduler.start();

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(cosExecutor).toHaveBeenCalled();
    await scheduler.stop();
  });

  it("should inject identity context into executor", async () => {
    const task = await stores.tasks.create({
      title: "Task with context",
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

    const executor = vi.fn().mockResolvedValue({
      success: true,
      outcome: "COMPLETED",
      summary: "Done",
      confidence: 1.0,
    });

    scheduler.registerPersona("Dev", executor);
    await scheduler.start();

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Verify executor was called with identity context (as string)
    expect(executor).toHaveBeenCalled();
    const callArgs = executor.mock.calls[0];
    expect(callArgs[1]).toBeDefined(); // identity context string

    await scheduler.stop();
  });

  it("should track SMT usage", async () => {
    const task = await stores.tasks.create({
      title: "SMT test",
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

    const executor = vi.fn().mockResolvedValue({
      success: true,
      outcome: "COMPLETED",
      summary: "Done",
      confidence: 1.0,
    });

    scheduler.registerPersona("Dev", executor);
    await scheduler.start();

    await new Promise((resolve) => setTimeout(resolve, 500));

    // SMT should have recorded usage
    const utilization = smt.getUtilization();
    expect(utilization).toBeGreaterThan(0);

    await scheduler.stop();
  });
});
