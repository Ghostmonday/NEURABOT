/**
 * Fitness Assessment System (README §0.4 - MANDATORY FIRMWARE)
 *
 * All modules MUST have fitness functions before being marked complete.
 * This assessor verifies that task outcomes meet their fitness criteria
 * and records results into the fitness store for convergence/degradation tracking.
 *
 * SKILL FITNESS (MANDATORY):
 *  module: fitness-assessor
 *  correctness: tasks only marked DONE when all three metrics pass; failures recorded with reason
 *  reliability: 3 consecutive passes required before marking stable
 *  efficiency: max prompts per successful execution
 *  reAssessmentInterval: 168 (weekly)
 *  convergence: all three pass for 3 consecutive runs → mark stable
 *  degradation: if stable module fails → reset streak, re-enter optimization
 */

import type { FitnessStore, FitnessMetricSnapshot, ModuleFitnessRecord } from "./fitness-store.js";
import type { TaskExecutionResult } from "./scheduler.js";
import type { Task, TaskCategory } from "./schema.js";
import type { TaskStore } from "./store.js";
import { getChildLogger } from "../../logging/logger.js";

const log = getChildLogger({ subsystem: "fitness-assessor" });

// ============================================================================
// Fitness Assessment Result
// ============================================================================

export interface FitnessAssessmentResult {
  passed: boolean;
  reason?: string;
  metrics?: {
    correctness?: boolean;
    reliability?: boolean;
    efficiency?: boolean;
  };
  /** Module name this assessment was for (derived from task category) */
  moduleName?: string;
  /** Whether a previously stable module just degraded */
  degraded?: boolean;
}

// ============================================================================
// Fitness Assessor Interface
// ============================================================================

export interface FitnessAssessor {
  /**
   * Assess fitness of a task outcome.
   * Records the result in the fitness store for streak tracking.
   */
  assessFitness(task: Task, result: TaskExecutionResult): Promise<FitnessAssessmentResult>;
}

// ============================================================================
// Category → Module Name Mapping
// ============================================================================

const CATEGORY_MODULE_MAP: Partial<Record<TaskCategory, string>> = {
  SELF_MODIFY: "self-modify",
  FITNESS_CHECK: "fitness-assessor",
  MISSION_CONTROL: "roadmap-observer",
  DEV: "scheduler",
  RESEARCH: "scheduler",
  RND: "scheduler",
  ADMIN: "scheduler",
  LEGAL: "scheduler",
  EMAIL: "scheduler",
  SMS: "scheduler",
  RUST_CHECK: "scheduler",
  RUST_FIX: "scheduler",
};

/**
 * Derive module name from task metadata.
 * Uses payload.source if available, falls back to category mapping.
 */
export function deriveModuleName(task: Task): string {
  // Prefer explicit source in payload
  const source = task.payload?.source as string | undefined;
  if (source) {
    return source;
  }

  // Map category to module
  return CATEGORY_MODULE_MAP[task.category as TaskCategory] ?? "unknown";
}

// ============================================================================
// Default Fitness Assessor Implementation
// ============================================================================

/**
 * Fitness assessor that checks three dimensions:
 *
 * 1. **Correctness**: Task completed successfully with a meaningful summary
 * 2. **Reliability**: Outcome is COMPLETED (not partial/blocked)
 * 3. **Efficiency**: Confidence above threshold (proxy for prompt efficiency)
 *
 * Records results into the fitness store for convergence tracking.
 * If a previously-stable module fails, flags degradation.
 */
export class DefaultFitnessAssessor implements FitnessAssessor {
  private readonly minConfidence: number;
  private readonly fitnessStore: FitnessStore | null;

  constructor(minConfidence: number = 0.7, fitnessStore?: FitnessStore) {
    this.minConfidence = minConfidence;
    this.fitnessStore = fitnessStore ?? null;
  }

  async assessFitness(task: Task, result: TaskExecutionResult): Promise<FitnessAssessmentResult> {
    const moduleName = deriveModuleName(task);

    // FITNESS_CHECK tasks are assessments themselves — always pass
    // (they verify other modules, not themselves)
    if (task.category === "FITNESS_CHECK") {
      this.recordToStore(moduleName, {
        correctness: true,
        reliability: true,
        efficiency: true,
        timestamp: Date.now(),
        taskId: task.taskId,
      });
      return { passed: true, reason: "Fitness check task completed", moduleName };
    }

    // === Correctness Check ===
    // Task must have completed with COMPLETED outcome
    const correctness = result.outcome === "COMPLETED";

    // === Reliability Check ===
    // Must have a decision summary proving actual work was done
    const reliability = Boolean(result.summary && result.summary.trim().length > 0);

    // === Efficiency Check ===
    // Confidence must meet threshold (proxy: high confidence = fewer wasted prompts)
    const efficiency = result.confidence >= this.minConfidence;

    const passed = correctness && reliability && efficiency;

    // Build failure reason
    let reason: string | undefined;
    if (!passed) {
      const failures: string[] = [];
      if (!correctness) failures.push(`outcome=${result.outcome} (expected COMPLETED)`);
      if (!reliability) failures.push("missing decision summary");
      if (!efficiency) failures.push(`confidence=${result.confidence} < ${this.minConfidence}`);
      reason = `Fitness failed: ${failures.join("; ")}`;
    }

    // Record to fitness store
    const snapshot: FitnessMetricSnapshot = {
      correctness,
      reliability,
      efficiency,
      timestamp: Date.now(),
      taskId: task.taskId,
    };

    const degraded = this.recordToStore(moduleName, snapshot);

    if (degraded) {
      log.warn("Module degradation detected", {
        moduleName,
        reason,
        taskId: task.taskId,
      });
    }

    return {
      passed,
      reason,
      metrics: { correctness, reliability, efficiency },
      moduleName,
      degraded,
    };
  }

  /**
   * Record assessment to the fitness store.
   * Returns true if a degradation event occurred (stable → failing).
   */
  private recordToStore(moduleName: string, snapshot: FitnessMetricSnapshot): boolean {
    if (!this.fitnessStore) {
      return false;
    }

    const before = this.fitnessStore.getRecord(moduleName);
    const wasStable = before?.status === "stable";

    this.fitnessStore.recordAssessment(moduleName, snapshot);

    const after = this.fitnessStore.getRecord(moduleName);
    return wasStable && after?.status === "failing";
  }
}

// ============================================================================
// Fitness Re-Assessment Task Creator
// ============================================================================

export interface FitnessReassessmentConfig {
  /** Default re-assessment interval in hours (default: 168 = weekly) */
  defaultReAssessmentIntervalHours: number;
  /** Map of module names to their specific re-assessment intervals */
  moduleIntervals?: Record<string, number>;
}

export interface FitnessReassessmentTaskCreator {
  /**
   * Create fitness re-assessment tasks for modules that need them.
   * @returns Number of tasks created
   */
  createReassessmentTasks(taskStore: TaskStore, config: FitnessReassessmentConfig): Promise<number>;
}

/**
 * Creates targeted re-assessment tasks based on actual module fitness data.
 * Queries the fitness store for modules that are overdue, then creates
 * one task per overdue module (prioritizing failing > unstable > stable).
 */
export class DefaultFitnessReassessmentTaskCreator implements FitnessReassessmentTaskCreator {
  private readonly fitnessStore: FitnessStore | null;

  constructor(fitnessStore?: FitnessStore) {
    this.fitnessStore = fitnessStore ?? null;
  }

  async createReassessmentTasks(
    taskStore: TaskStore,
    config: FitnessReassessmentConfig,
  ): Promise<number> {
    // Guard: don't create duplicates if fitness checks are already queued
    const pendingCount = await taskStore.count({
      category: "FITNESS_CHECK",
      status: "READY",
    });
    const inProgressCount = await taskStore.count({
      category: "FITNESS_CHECK",
      status: "IN_PROGRESS",
    });

    if (pendingCount + inProgressCount > 0) {
      return 0;
    }

    // If no fitness store, create a generic task (backward compat)
    if (!this.fitnessStore) {
      await taskStore.create({
        title: "Fitness Re-Assessment Cycle",
        description:
          "Periodic fitness check for all modules. Verifies correctness, reliability, and efficiency metrics.",
        category: "FITNESS_CHECK",
        personaOwner: "Dev",
        urgency: 3,
        importance: 4,
        risk: 1,
        stressCost: 2,
        requiresApproval: false,
        maxRetries: 3,
        dependencies: [],
        contextLinks: {},
        payload: {
          action: "fitness_reassessment",
          intervalHours: config.defaultReAssessmentIntervalHours,
        },
        createdBy: "fitness-assessor",
      });
      return 1;
    }

    // Query fitness store for overdue modules
    const overdueModules = this.fitnessStore.getModulesDueForReassessment();
    if (overdueModules.length === 0) {
      return 0;
    }

    // Sort: failing first, then unstable, then stable, then unknown
    const statusPriority: Record<string, number> = {
      failing: 0,
      unstable: 1,
      unknown: 2,
      stable: 3,
    };
    overdueModules.sort(
      (a, b) => (statusPriority[a.status] ?? 4) - (statusPriority[b.status] ?? 4),
    );

    // Create one task per overdue module (max 5 per tick to avoid flooding)
    const maxTasksPerTick = 5;
    let created = 0;

    for (const mod of overdueModules.slice(0, maxTasksPerTick)) {
      const urgency = mod.status === "failing" ? 5 : mod.status === "unstable" ? 4 : 3;

      await taskStore.create({
        title: `Fitness Re-Assessment: ${mod.moduleName}`,
        description: `README §0.4: Re-assess ${mod.moduleName}. Status: ${mod.status}. Streak: ${mod.consecutiveSuccesses}/${mod.requiredConsecutiveSuccesses}. Check: ${mod.correctnessDescription}`,
        category: "FITNESS_CHECK",
        personaOwner: "Dev",
        urgency,
        importance: 4,
        risk: 1,
        stressCost: 2,
        requiresApproval: false,
        maxRetries: 3,
        dependencies: [],
        contextLinks: {},
        payload: {
          action: "fitness_reassessment",
          moduleName: mod.moduleName,
          currentStatus: mod.status,
          consecutiveSuccesses: mod.consecutiveSuccesses,
          lastAssessedAt: mod.lastAssessedAt,
          correctnessDescription: mod.correctnessDescription,
        },
        createdBy: "fitness-assessor",
      });
      created++;
    }

    if (created > 0) {
      log.info("Created fitness re-assessment tasks", {
        count: created,
        modules: overdueModules.slice(0, maxTasksPerTick).map((m) => m.moduleName),
      });
    }

    return created;
  }
}
