/**
 * Unit tests for RoadmapObserverExecutor
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "../../mission-control/schema.js";
import type { ExtensionFoundation } from "../integration.js";
import { RoadmapObserverExtension } from "./index.js";

describe("RoadmapObserverExecutor", () => {
  let mockFoundation: ExtensionFoundation;
  let mockTaskStore: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };
  let mockAudit: { log: ReturnType<typeof vi.fn> };
  let executor: any; // PersonaExecutor from the extension

  beforeEach(() => {
    mockTaskStore = {
      create: vi.fn().mockResolvedValue({ taskId: "mock-task-id" }),
      update: vi.fn().mockResolvedValue(null),
      get: vi.fn().mockResolvedValue(null),
    };

    mockAudit = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    mockFoundation = {
      registerCircuitBreaker: vi.fn(),
      canProceed: vi.fn().mockReturnValue(true),
      recordUsage: vi.fn(),
      registerPersonaExecutor: vi.fn((persona, exec) => {
        if (persona === "ChiefOfStaff") {
          executor = exec;
        }
      }),
      getIdentityStore: vi.fn().mockReturnValue({
        search: vi.fn().mockResolvedValue([]),
        getByCategory: vi.fn().mockResolvedValue([]),
      }),
      getTaskStore: vi.fn().mockReturnValue(mockTaskStore),
      logAudit: vi.fn(),
      triggerSchedulerTick: vi.fn(),
      pauseScheduler: vi.fn(),
      resumeScheduler: vi.fn(),
    } as unknown as ExtensionFoundation;

    const extension = new RoadmapObserverExtension();
    void extension.initialize(mockFoundation);
  });

  it("registers ChiefOfStaff executor", () => {
    expect(mockFoundation.registerPersonaExecutor).toHaveBeenCalledWith(
      "ChiefOfStaff",
      expect.any(Object),
    );
    expect(executor).toBeTruthy();
  });

  it("canHandle returns true for MISSION_CONTROL tasks", () => {
    const task: Partial<Task> = {
      category: "MISSION_CONTROL",
      payload: { action: "read_readme_roadmap" },
    };

    expect(executor.canHandle(task)).toBe(true);
  });

  it("canHandle returns false for other tasks", () => {
    const task: Partial<Task> = {
      category: "DEV",
      payload: {},
    };

    expect(executor.canHandle(task)).toBe(false);
  });

  it("returns SMT_THROTTLED when SMT quota exceeded", async () => {
    mockFoundation.canProceed = vi.fn().mockReturnValue(false);

    const task: Partial<Task> = {
      taskId: "test-task-id",
      category: "MISSION_CONTROL",
      payload: { action: "read_readme_roadmap" },
    };

    const context = {
      identityContext: "",
      smt: { recordUsage: vi.fn() },
      audit: mockAudit,
    };

    const result = await executor.execute(task, context);

    expect(result.success).toBe(false);
    expect(result.outcome).toBe("SMT_THROTTLED");
    expect(result.error).toContain("SMT quota exceeded");
  });

  it("handles README read errors gracefully", async () => {
    // Mock fs.readFileSync to throw error
    const originalReadme = process.cwd;
    process.cwd = () => "/nonexistent/path";

    const task: Partial<Task> = {
      taskId: "test-task-id",
      category: "MISSION_CONTROL",
      payload: { action: "read_readme_roadmap" },
    };

    const context = {
      identityContext: "",
      smt: { recordUsage: vi.fn() },
      audit: mockAudit,
    };

    const result = await executor.execute(task, context);

    expect(result.success).toBe(false);
    expect(result.outcome).toBe("READ_ERROR");

    process.cwd = originalReadme;
  });

  it("logs audit entry when roadmap is parsed", async () => {
    const task: Partial<Task> = {
      taskId: "test-task-id",
      category: "MISSION_CONTROL",
      payload: { action: "read_readme_roadmap", persist_until_complete: false },
    };

    const context = {
      identityContext: "",
      smt: { recordUsage: vi.fn() },
      audit: mockAudit,
    };

    // This will attempt to read actual README.md (test in real project context)
    await executor.execute(task, context);

    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "roadmap_parsed",
        details: expect.objectContaining({
          tracksFound: expect.any(Number),
          tracks: expect.any(Array),
        }),
      }),
    );
  });

  it("creates follow-up task when persist_until_complete is true", async () => {
    const task: Partial<Task> = {
      taskId: "test-task-id",
      category: "MISSION_CONTROL",
      payload: { action: "read_readme_roadmap", persist_until_complete: true },
    };

    const context = {
      identityContext: "",
      smt: { recordUsage: vi.fn() },
      audit: mockAudit,
    };

    await executor.execute(task, context);

    // Should create follow-up task (assuming not all tracks are complete)
    expect(mockTaskStore.create).toHaveBeenCalled();
  });

  it("respects MAX_SUBTASKS_PER_EXECUTION limit", async () => {
    const task: Partial<Task> = {
      taskId: "test-task-id",
      category: "MISSION_CONTROL",
      payload: { action: "read_readme_roadmap" },
    };

    const context = {
      identityContext: "",
      smt: { recordUsage: vi.fn() },
      audit: mockAudit,
    };

    await executor.execute(task, context);

    // Max 10 sub-tasks + potentially 1 follow-up task
    expect(mockTaskStore.create).toHaveBeenCalledTimes(expect.any(Number));
    const createCalls = (mockTaskStore.create as any).mock.calls.length;
    expect(createCalls).toBeLessThanOrEqual(11); // 10 subtasks + 1 followup
  });
});
