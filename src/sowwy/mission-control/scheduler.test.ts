/**
 * Unit tests for the TaskScheduler module.
 * Tests cover task prioritization, promotion logic, and SMT (State Machine Throttler) integration.
 */
import { describe, expect, it, vi } from "vitest";
import type { IdentityStore } from "../identity/store.js";
import { SMTThrottler, getMetrics } from "../smt/throttler.js";
import { InMemoryTaskStore } from "./memory-store.js";
import { TaskScheduler } from "./scheduler.js";
import { TaskCategory, TaskStatus, type Task } from "./schema.js";

function createIdentityStore(): IdentityStore {
  return {
    write: async () => {
      throw new Error("write not supported");
    },
    writeBatch: async () => {
      throw new Error("writeBatch not supported");
    },
    getById: async () => null,
    getByCategory: async () => [],
    getAll: async () => [],
    search: async () => [],
    searchByCategory: async () => [],
    findSimilar: async () => [],
    count: async () => 0,
    countByCategory: async () => ({
      goal: 0,
      constraint: 0,
      preference: 0,
      belief: 0,
      risk: 0,
      capability: 0,
      relationship: 0,
      historical_fact: 0,
    }),
    delete: async () => false,
    markReviewed: async () => undefined,
  };
}

describe("TaskScheduler", () => {
  it("promotes the highest priority backlog task to READY", async () => {
    const taskStore = new InMemoryTaskStore();
    const identityStore = createIdentityStore();
    const smt = new SMTThrottler({ maxPrompts: 100 });
    const scheduler = new TaskScheduler(taskStore, identityStore, smt, {
      pollIntervalMs: 1,
    });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    scheduler.registerPersona("Dev", async () => ({
      success: true,
      outcome: "COMPLETED",
      summary: "done",
      confidence: 0.9,
    }));

    const promoted = await taskStore.create({
      title: "High priority",
      category: TaskCategory.DEV,
      personaOwner: "Dev",
      urgency: 5,
      importance: 5,
      risk: 1,
      stressCost: 1,
      createdBy: "test",
    });

    const other = await taskStore.create({
      title: "Low priority",
      category: TaskCategory.DEV,
      personaOwner: "Dev",
      urgency: 1,
      importance: 1,
      risk: 1,
      stressCost: 1,
      createdBy: "test",
    });

    const oneSecondAgoMs = 1000;
    await taskStore.update(promoted.taskId, {
      status: TaskStatus.BACKLOG,
      createdAt: new Date(Date.now() - oneSecondAgoMs).toISOString(),
    } as Partial<Task>);
    await taskStore.update(other.taskId, {
      status: TaskStatus.BACKLOG,
      createdAt: new Date().toISOString(),
    } as Partial<Task>);

    try {
      await scheduler.triggerTick(); // Promotes highest-priority backlog to READY
      await scheduler.triggerTick(); // Runs the now-READY task (fire-and-forget)
      await new Promise((r) => setTimeout(r, 20)); // Allow executor to complete and update task to DONE
    } finally {
      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    }

    const promotedTask = await taskStore.get(promoted.taskId);
    const otherTask = await taskStore.get(other.taskId);
    expect(promotedTask?.status).toBe(TaskStatus.DONE);
    expect(promotedTask?.outcome).toBe("COMPLETED");
    expect(otherTask?.status).toBe(TaskStatus.BACKLOG);
  });

  it("SHC: records SMT usage for each executed task", async () => {
    const taskStore = new InMemoryTaskStore();
    const identityStore = createIdentityStore();
    const windowMs = 5 * 60 * 60 * 1000; // 5 hours
    const smt = new SMTThrottler({ maxPrompts: 500, windowMs });
    const scheduler = new TaskScheduler(taskStore, identityStore, smt, {
      pollIntervalMs: 1,
      maxConcurrentPerPersona: 1,
    });

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    scheduler.registerPersona("Dev", async () => ({
      success: true,
      outcome: "COMPLETED",
      summary: "done",
      confidence: 0.9,
    }));

    // Create 10 dummy tasks
    const tasks: Task[] = [];
    for (let i = 0; i < 10; i++) {
      const task = await taskStore.create({
        title: `Dummy task ${i + 1}`,
        category: TaskCategory.DEV,
        personaOwner: "Dev",
        urgency: 3,
        importance: 3,
        risk: 1,
        stressCost: 1,
        createdBy: "shc-test",
      });
      tasks.push(task);
    }

    // Verify initial metrics
    const initialMetrics = getMetrics(smt);
    expect(initialMetrics.utilization).toBe(0);
    expect(initialMetrics.remaining).toBe(Math.floor(500 * 0.95)); // 475 with 0.95 targetUtilization

    // Execute tasks by triggering scheduler ticks
    try {
      for (let i = 0; i < 20; i++) {
        await scheduler.triggerTick();
        await new Promise((r) => setTimeout(r, 10));
      }
    } finally {
      logSpy.mockRestore();
    }

    // Verify SMT metrics after execution
    const finalMetrics = getMetrics(smt);
    const state = smt.getState();

    // Should have recorded 10 usages
    expect(state.usedInWindow).toBe(10);
    expect(finalMetrics.remaining).toBe(Math.floor(500 * 0.95) - 10); // 465
    expect(finalMetrics.utilization).toBeCloseTo(10 / (500 * 0.95), 3);

    // Verify windowEnd is correct (windowStart + windowMs)
    expect(finalMetrics.windowEnd).toBe(state.windowStart + windowMs);

    // Verify all 10 tasks completed
    for (const task of tasks) {
      const updated = await taskStore.get(task.taskId);
      expect(updated?.status).toBe(TaskStatus.DONE);
    }
  });
});
