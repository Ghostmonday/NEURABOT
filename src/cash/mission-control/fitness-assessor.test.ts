import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TaskExecutionResult } from "./scheduler.js";
import type { Task } from "./schema.js";
import {
  DefaultFitnessAssessor,
  DefaultFitnessReassessmentTaskCreator,
  deriveModuleName,
  type FitnessAssessor,
} from "./fitness-assessor.js";
import { InMemoryFitnessStore, type FitnessStore } from "./fitness-store.js";

// ============================================================================
// Helper: Build a minimal Task
// ============================================================================

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    taskId: "task-001",
    title: "Test task",
    category: "DEV",
    personaOwner: "Dev",
    status: "IN_PROGRESS",
    urgency: 3,
    importance: 3,
    risk: 2,
    stressCost: 2,
    requiresApproval: false,
    approved: false,
    retryCount: 0,
    maxRetries: 3,
    dependencies: [],
    contextLinks: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "test",
    ...overrides,
  };
}

function makeResult(overrides: Partial<TaskExecutionResult> = {}): TaskExecutionResult {
  return {
    success: true,
    outcome: "COMPLETED",
    summary: "Task completed successfully",
    confidence: 0.85,
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe("deriveModuleName", () => {
  it("uses payload.source when available", () => {
    const task = makeTask({ payload: { source: "roadmap-observer" } });
    expect(deriveModuleName(task)).toBe("roadmap-observer");
  });

  it("maps SELF_MODIFY category to self-modify", () => {
    const task = makeTask({ category: "SELF_MODIFY" });
    expect(deriveModuleName(task)).toBe("self-modify");
  });

  it("maps FITNESS_CHECK to fitness-assessor", () => {
    const task = makeTask({ category: "FITNESS_CHECK" });
    expect(deriveModuleName(task)).toBe("fitness-assessor");
  });

  it("maps DEV to scheduler", () => {
    const task = makeTask({ category: "DEV" });
    expect(deriveModuleName(task)).toBe("scheduler");
  });

  it("returns unknown for unmapped categories", () => {
    const task = makeTask({ category: "UNKNOWN_CAT" as any });
    expect(deriveModuleName(task)).toBe("unknown");
  });
});

describe("DefaultFitnessAssessor", () => {
  let assessor: FitnessAssessor;
  let store: FitnessStore;

  beforeEach(() => {
    store = new InMemoryFitnessStore();
    assessor = new DefaultFitnessAssessor(0.7, store);
  });

  describe("assessFitness", () => {
    it("passes when all three metrics are met", async () => {
      const task = makeTask();
      const result = makeResult();

      const assessment = await assessor.assessFitness(task, result);

      expect(assessment.passed).toBe(true);
      expect(assessment.metrics?.correctness).toBe(true);
      expect(assessment.metrics?.reliability).toBe(true);
      expect(assessment.metrics?.efficiency).toBe(true);
    });

    it("fails on non-COMPLETED outcome (correctness)", async () => {
      const task = makeTask();
      const result = makeResult({ outcome: "BLOCKED" });

      const assessment = await assessor.assessFitness(task, result);

      expect(assessment.passed).toBe(false);
      expect(assessment.metrics?.correctness).toBe(false);
      expect(assessment.reason).toContain("outcome=BLOCKED");
    });

    it("fails on empty summary (reliability)", async () => {
      const task = makeTask();
      const result = makeResult({ summary: "" });

      const assessment = await assessor.assessFitness(task, result);

      expect(assessment.passed).toBe(false);
      expect(assessment.metrics?.reliability).toBe(false);
      expect(assessment.reason).toContain("missing decision summary");
    });

    it("fails on low confidence (efficiency)", async () => {
      const task = makeTask();
      const result = makeResult({ confidence: 0.3 });

      const assessment = await assessor.assessFitness(task, result);

      expect(assessment.passed).toBe(false);
      expect(assessment.metrics?.efficiency).toBe(false);
      expect(assessment.reason).toContain("confidence=0.3");
    });

    it("always passes FITNESS_CHECK tasks", async () => {
      const task = makeTask({ category: "FITNESS_CHECK" });
      const result = makeResult({ outcome: "BLOCKED", confidence: 0.1 });

      const assessment = await assessor.assessFitness(task, result);
      expect(assessment.passed).toBe(true);
    });

    it("records assessments to the fitness store", async () => {
      const task = makeTask({ payload: { source: "test-module" } });
      const result = makeResult();

      await assessor.assessFitness(task, result);

      const record = store.getRecord("test-module");
      expect(record).not.toBeNull();
      expect(record!.totalAssessments).toBe(1);
      expect(record!.totalPasses).toBe(1);
    });

    it("tracks convergence across multiple passes", async () => {
      store.register({ moduleName: "converge-mod", correctnessDescription: "check" });

      for (let i = 0; i < 3; i++) {
        const task = makeTask({
          taskId: `task-${i}`,
          payload: { source: "converge-mod" },
        });
        await assessor.assessFitness(task, makeResult());
      }

      expect(store.isStable("converge-mod")).toBe(true);
    });

    it("detects degradation when stable module fails", async () => {
      store.register({ moduleName: "degrade-mod", correctnessDescription: "check" });

      // Build to stable
      for (let i = 0; i < 3; i++) {
        await assessor.assessFitness(
          makeTask({ taskId: `t-${i}`, payload: { source: "degrade-mod" } }),
          makeResult(),
        );
      }
      expect(store.isStable("degrade-mod")).toBe(true);

      // Now fail
      const assessment = await assessor.assessFitness(
        makeTask({ taskId: "t-fail", payload: { source: "degrade-mod" } }),
        makeResult({ outcome: "BLOCKED" }),
      );

      expect(assessment.passed).toBe(false);
      expect(assessment.degraded).toBe(true);
      expect(store.isStable("degrade-mod")).toBe(false);
    });

    it("reports multiple failure reasons", async () => {
      const task = makeTask();
      const result = makeResult({
        outcome: "BLOCKED",
        summary: "",
        confidence: 0.1,
      });

      const assessment = await assessor.assessFitness(task, result);
      expect(assessment.passed).toBe(false);
      expect(assessment.reason).toContain("outcome=BLOCKED");
      expect(assessment.reason).toContain("missing decision summary");
      expect(assessment.reason).toContain("confidence=0.1");
    });

    it("works without a fitness store (backward compat)", async () => {
      const noStoreAssessor = new DefaultFitnessAssessor(0.7);
      const task = makeTask();
      const result = makeResult();

      const assessment = await noStoreAssessor.assessFitness(task, result);
      expect(assessment.passed).toBe(true);
    });
  });
});

describe("DefaultFitnessReassessmentTaskCreator", () => {
  let store: FitnessStore;
  let mockTaskStore: {
    create: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    store = new InMemoryFitnessStore();
    mockTaskStore = {
      create: vi.fn().mockResolvedValue({ taskId: "mock-id" }),
      count: vi.fn().mockResolvedValue(0), // No existing fitness tasks
    };
  });

  it("creates tasks for overdue modules", async () => {
    store.register({
      moduleName: "overdue-mod",
      correctnessDescription: "check",
      reAssessmentIntervalHours: 1,
    });
    // Assess 2 hours ago
    store.recordAssessment("overdue-mod", {
      correctness: true,
      reliability: true,
      efficiency: true,
      timestamp: Date.now() - 2 * 60 * 60 * 1000,
    });

    const creator = new DefaultFitnessReassessmentTaskCreator(store);
    const created = await creator.createReassessmentTasks(mockTaskStore as any, {
      defaultReAssessmentIntervalHours: 168,
    });

    expect(created).toBe(1);
    expect(mockTaskStore.create).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "FITNESS_CHECK",
        payload: expect.objectContaining({
          moduleName: "overdue-mod",
        }),
      }),
    );
  });

  it("skips creation when fitness tasks already pending", async () => {
    store.register({ moduleName: "mod", correctnessDescription: "check" });

    mockTaskStore.count.mockResolvedValue(1); // 1 pending fitness task

    const creator = new DefaultFitnessReassessmentTaskCreator(store);
    const created = await creator.createReassessmentTasks(mockTaskStore as any, {
      defaultReAssessmentIntervalHours: 168,
    });

    expect(created).toBe(0);
    expect(mockTaskStore.create).not.toHaveBeenCalled();
  });

  it("prioritizes failing modules over stable ones", async () => {
    // Register two modules
    store.register({
      moduleName: "stable-mod",
      correctnessDescription: "check",
      reAssessmentIntervalHours: 0,
    });
    store.register({
      moduleName: "failing-mod",
      correctnessDescription: "check",
      reAssessmentIntervalHours: 0,
    });

    // Make stable-mod stable
    for (let i = 0; i < 3; i++) {
      store.recordAssessment("stable-mod", {
        correctness: true,
        reliability: true,
        efficiency: true,
        timestamp: 1000 + i,
      });
    }

    // Make failing-mod fail
    store.recordAssessment("failing-mod", {
      correctness: false,
      reliability: true,
      efficiency: true,
      timestamp: 1000,
    });

    const creator = new DefaultFitnessReassessmentTaskCreator(store);
    await creator.createReassessmentTasks(mockTaskStore as any, {
      defaultReAssessmentIntervalHours: 168,
    });

    // First created task should be for failing module
    const firstCall = mockTaskStore.create.mock.calls[0][0];
    expect(firstCall.payload.moduleName).toBe("failing-mod");
    expect(firstCall.urgency).toBe(5); // Critical urgency for failing
  });

  it("creates max 5 tasks per tick", async () => {
    // Register 10 modules, all overdue
    for (let i = 0; i < 10; i++) {
      store.register({
        moduleName: `mod-${i}`,
        correctnessDescription: "check",
        reAssessmentIntervalHours: 0, // Always overdue
      });
      store.recordAssessment(`mod-${i}`, {
        correctness: true,
        reliability: true,
        efficiency: true,
        timestamp: 1, // Ancient
      });
    }

    const creator = new DefaultFitnessReassessmentTaskCreator(store);
    const created = await creator.createReassessmentTasks(mockTaskStore as any, {
      defaultReAssessmentIntervalHours: 168,
    });

    expect(created).toBe(5);
  });

  it("falls back to generic task without fitness store", async () => {
    const creator = new DefaultFitnessReassessmentTaskCreator(); // No store
    const created = await creator.createReassessmentTasks(mockTaskStore as any, {
      defaultReAssessmentIntervalHours: 168,
    });

    expect(created).toBe(1);
    expect(mockTaskStore.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Fitness Re-Assessment Cycle",
        category: "FITNESS_CHECK",
      }),
    );
  });
});
