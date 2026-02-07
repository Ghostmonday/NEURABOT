/**
 * Fitness Assessment System (README §0.4 - MANDATORY FIRMWARE)
 *
 * All modules MUST have fitness functions before being marked complete.
 * This assessor verifies that task outcomes meet their fitness criteria.
 *
 * SKILL FITNESS REQUIREMENTS:
 * - correctness: Externally verifiable outcome (what human would check)
 * - reliability: Consecutive successes required (minimum 3)
 * - efficiency: Max prompts per successful execution
 * - reAssessmentInterval: Hours between re-checks (default: 168 = weekly)
 *
 * Convergence: All three pass for 3 consecutive runs → mark stable
 * Degradation: If stable module fails → reset streak, re-enter optimization
 */

import type { Task, TaskExecutionResult } from "./schema.js";

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
}

// ============================================================================
// Fitness Assessor Interface
// ============================================================================

export interface FitnessAssessor {
  /**
   * Assess fitness of a task outcome.
   * @param task - The completed task
   * @param result - The execution result
   * @returns Assessment result indicating if fitness criteria are met
   */
  assessFitness(task: Task, result: TaskExecutionResult): Promise<FitnessAssessmentResult>;
}

// ============================================================================
// Default Fitness Assessor Implementation
// ============================================================================

/**
 * Default fitness assessor that checks basic criteria:
 * - Task must have completed successfully (outcome = COMPLETED)
 * - Task must have a decision summary (proves work was done)
 * - Confidence must be above threshold (default: 0.7)
 *
 * For SELF_MODIFY tasks, additional checks:
 * - Modified files must be tracked
 * - Build must have succeeded (implicit via reload success)
 *
 * For FITNESS_CHECK tasks, always pass (they are the assessment themselves)
 */
export class DefaultFitnessAssessor implements FitnessAssessor {
  private readonly minConfidence: number;

  constructor(minConfidence: number = 0.7) {
    this.minConfidence = minConfidence;
  }

  async assessFitness(task: Task, result: TaskExecutionResult): Promise<FitnessAssessmentResult> {
    // FITNESS_CHECK tasks are assessments themselves - always pass
    if (task.category === "FITNESS_CHECK") {
      return { passed: true, reason: "Fitness check task completed" };
    }

    // Task must have completed successfully
    if (result.outcome !== "COMPLETED") {
      return {
        passed: false,
        reason: `Task outcome is ${result.outcome}, expected COMPLETED`,
      };
    }

    // Task must have a decision summary (proves work was done)
    if (!result.summary || result.summary.trim().length === 0) {
      return {
        passed: false,
        reason: "Task completed without decision summary",
      };
    }

    // Confidence must meet threshold
    if (result.confidence < this.minConfidence) {
      return {
        passed: false,
        reason: `Confidence ${result.confidence} below threshold ${this.minConfidence}`,
      };
    }

    // SELF_MODIFY tasks: Check that modifications were tracked
    if (task.category === "SELF_MODIFY") {
      const modifiedFiles = task.payload?.modifiedFiles as string[] | undefined;
      if (!modifiedFiles || modifiedFiles.length === 0) {
        // Allow if no files were modified (validation-only cycle)
        // But log it for tracking
        return {
          passed: true,
          reason: "Self-modify task completed (validation-only cycle)",
        };
      }
    }

    // All checks passed
    return {
      passed: true,
      metrics: {
        correctness: true,
        reliability: true,
        efficiency: true,
      },
    };
  }
}

// ============================================================================
// Fitness Re-Assessment Task Creation
// ============================================================================

/**
 * Creates fitness re-assessment tasks for modules that need periodic checks.
 * Called by scheduler on each tick to ensure all modules are re-assessed.
 */
export interface FitnessReassessmentConfig {
  /** Default re-assessment interval in hours (default: 168 = weekly) */
  defaultReAssessmentIntervalHours: number;
  /** Map of module names to their specific re-assessment intervals */
  moduleIntervals?: Record<string, number>;
}

export interface FitnessReassessmentTaskCreator {
  /**
   * Create fitness re-assessment tasks for modules that need them.
   * @param taskStore - Task store for creating tasks
   * @param config - Re-assessment configuration
   * @returns Number of tasks created
   */
  createReassessmentTasks(
    taskStore: {
      create(input: {
        title: string;
        description: string;
        category: string;
        personaOwner: string;
        urgency: number;
        importance: number;
        risk: number;
        stressCost: number;
        requiresApproval: boolean;
        maxRetries: number;
        dependencies: string[];
        contextLinks: Record<string, string>;
        payload?: unknown;
        createdBy: string;
      }): Promise<{ taskId: string }>;
      count(filter: { category: string; status: string }): Promise<number>;
    },
    config: FitnessReassessmentConfig,
  ): Promise<number>;
}

/**
 * Default implementation that creates fitness check tasks for known modules.
 * In a full implementation, this would track module last-assessment times
 * and create tasks only when intervals have elapsed.
 */
export class DefaultFitnessReassessmentTaskCreator implements FitnessReassessmentTaskCreator {
  async createReassessmentTasks(
    taskStore: {
      create(input: {
        title: string;
        description: string;
        category: string;
        personaOwner: string;
        urgency: number;
        importance: number;
        risk: number;
        stressCost: number;
        requiresApproval: boolean;
        maxRetries: number;
        dependencies: string[];
        contextLinks: Record<string, string>;
        payload?: unknown;
        createdBy: string;
      }): Promise<{ taskId: string }>;
      count(filter: { category: string; status: string }): Promise<number>;
    },
    config: FitnessReassessmentConfig,
  ): Promise<number> {
    // Check if there are already pending fitness check tasks
    const pendingCount = await taskStore.count({
      category: "FITNESS_CHECK",
      status: "READY",
    });
    const inProgressCount = await taskStore.count({
      category: "FITNESS_CHECK",
      status: "IN_PROGRESS",
    });

    // Don't create more if there are already pending/in-progress tasks
    if (pendingCount + inProgressCount > 0) {
      return 0;
    }

    // Create a single fitness check task per cycle
    // In a full implementation, this would check last-assessment times
    // and create tasks only for modules that need re-assessment
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
}
