/**
 * Fitness Assessment History Store (README §0.4 - MANDATORY FIRMWARE)
 *
 * Tracks per-module fitness assessment results over time.
 * Provides the data backbone for convergence detection, degradation alerts,
 * and automatic re-assessment scheduling.
 *
 * SKILL FITNESS (MANDATORY):
 *  module: fitness-store
 *  correctness: module records persist across assessments, streaks increment/reset correctly
 *  reliability: 3 consecutive passes required before marking stable
 *  efficiency: O(1) lookups per module
 *  reAssessmentInterval: 168 (weekly)
 *  convergence: all three pass for 3 consecutive runs → mark stable
 *  degradation: if stable module fails → reset streak, re-enter optimization
 */

// ============================================================================
// Types
// ============================================================================

export type FitnessStatus = "unstable" | "stable" | "failing" | "unknown";

export interface FitnessMetricSnapshot {
  correctness: boolean;
  reliability: boolean;
  efficiency: boolean;
  timestamp: number;
  taskId?: string;
  /** Prompt count for efficiency tracking */
  promptsUsed?: number;
}

export interface ModuleFitnessRecord {
  /** Module identifier (e.g. "scheduler", "roadmap-observer", "self-modify") */
  moduleName: string;
  /** Current fitness status */
  status: FitnessStatus;
  /** Consecutive successful assessments (reset on failure) */
  consecutiveSuccesses: number;
  /** Required consecutive successes before marking stable (default: 3) */
  requiredConsecutiveSuccesses: number;
  /** Max prompts per successful execution (efficiency threshold) */
  maxPromptsPerExecution: number;
  /** Timestamp of last assessment */
  lastAssessedAt: number | null;
  /** Re-assessment interval in hours (default: 168 = weekly) */
  reAssessmentIntervalHours: number;
  /** When the module was first registered */
  registeredAt: number;
  /** When the module was last marked stable (null if never) */
  lastStableAt: number | null;
  /** Total assessments run */
  totalAssessments: number;
  /** Total passes */
  totalPasses: number;
  /** Total failures */
  totalFailures: number;
  /** Recent history (last N snapshots, FIFO) */
  history: FitnessMetricSnapshot[];
  /** Human-readable correctness description */
  correctnessDescription: string;
}

// ============================================================================
// Fitness Store Interface
// ============================================================================

export interface FitnessStore {
  /** Register a module for fitness tracking */
  register(config: ModuleRegistration): void;

  /** Record an assessment result for a module */
  recordAssessment(moduleName: string, snapshot: FitnessMetricSnapshot): void;

  /** Get the fitness record for a module */
  getRecord(moduleName: string): ModuleFitnessRecord | null;

  /** Get all registered modules */
  getAllRecords(): ModuleFitnessRecord[];

  /** Get modules that are due for re-assessment */
  getModulesDueForReassessment(nowMs?: number): ModuleFitnessRecord[];

  /** Get modules in a specific status */
  getModulesByStatus(status: FitnessStatus): ModuleFitnessRecord[];

  /** Check if a module is stable */
  isStable(moduleName: string): boolean;

  /** Get a summary of the entire fitness landscape */
  getSummary(): FitnessSummary;
}

export interface ModuleRegistration {
  moduleName: string;
  correctnessDescription: string;
  requiredConsecutiveSuccesses?: number;
  maxPromptsPerExecution?: number;
  reAssessmentIntervalHours?: number;
}

export interface FitnessSummary {
  totalModules: number;
  stable: number;
  unstable: number;
  failing: number;
  unknown: number;
  /** Modules overdue for re-assessment */
  overdue: number;
  /** Overall system fitness ratio (stable / total) */
  fitnessRatio: number;
}

// ============================================================================
// Default values
// ============================================================================

const DEFAULT_CONSECUTIVE_REQUIRED = 3;
const DEFAULT_MAX_PROMPTS = 20;
const DEFAULT_REASSESSMENT_HOURS = 168; // weekly
const MAX_HISTORY_LENGTH = 50;

// ============================================================================
// In-Memory Fitness Store
// ============================================================================

export class InMemoryFitnessStore implements FitnessStore {
  private records = new Map<string, ModuleFitnessRecord>();

  register(config: ModuleRegistration): void {
    // Don't overwrite existing records (preserve history across restarts within session)
    if (this.records.has(config.moduleName)) {
      return;
    }

    this.records.set(config.moduleName, {
      moduleName: config.moduleName,
      status: "unknown",
      consecutiveSuccesses: 0,
      requiredConsecutiveSuccesses:
        config.requiredConsecutiveSuccesses ?? DEFAULT_CONSECUTIVE_REQUIRED,
      maxPromptsPerExecution: config.maxPromptsPerExecution ?? DEFAULT_MAX_PROMPTS,
      lastAssessedAt: null,
      reAssessmentIntervalHours: config.reAssessmentIntervalHours ?? DEFAULT_REASSESSMENT_HOURS,
      registeredAt: Date.now(),
      lastStableAt: null,
      totalAssessments: 0,
      totalPasses: 0,
      totalFailures: 0,
      history: [],
      correctnessDescription: config.correctnessDescription,
    });
  }

  recordAssessment(moduleName: string, snapshot: FitnessMetricSnapshot): void {
    const record = this.records.get(moduleName);
    if (!record) {
      // Auto-register unknown modules with defaults
      this.register({
        moduleName,
        correctnessDescription: "Auto-registered module (no explicit correctness definition)",
      });
      return this.recordAssessment(moduleName, snapshot);
    }

    const passed = snapshot.correctness && snapshot.reliability && snapshot.efficiency;
    const now = snapshot.timestamp;

    // Update counters
    record.totalAssessments++;
    record.lastAssessedAt = now;

    if (passed) {
      record.totalPasses++;
      record.consecutiveSuccesses++;

      // Convergence: all three pass for N consecutive runs → mark stable
      if (record.consecutiveSuccesses >= record.requiredConsecutiveSuccesses) {
        if (record.status !== "stable") {
          record.lastStableAt = now;
        }
        record.status = "stable";
      } else {
        // Making progress but not yet stable
        record.status = "unstable";
      }
    } else {
      record.totalFailures++;

      // Degradation: if stable module fails → reset streak, re-enter optimization
      const wasPreviouslyStable = record.status === "stable";
      record.consecutiveSuccesses = 0;
      record.status = "failing";

      if (wasPreviouslyStable) {
        // This is a degradation event — module was stable and now it's not
        // The record.status = "failing" already signals this
        // Callers can detect degradation by checking status === "failing" && lastStableAt !== null
      }
    }

    // Append to history (FIFO, capped at MAX_HISTORY_LENGTH)
    record.history.push(snapshot);
    if (record.history.length > MAX_HISTORY_LENGTH) {
      record.history.shift();
    }
  }

  getRecord(moduleName: string): ModuleFitnessRecord | null {
    return this.records.get(moduleName) ?? null;
  }

  getAllRecords(): ModuleFitnessRecord[] {
    return Array.from(this.records.values());
  }

  getModulesDueForReassessment(nowMs?: number): ModuleFitnessRecord[] {
    const now = nowMs ?? Date.now();
    return Array.from(this.records.values()).filter((record) => {
      if (record.lastAssessedAt === null) {
        // Never assessed → due immediately
        return true;
      }
      const intervalMs = record.reAssessmentIntervalHours * 60 * 60 * 1000;
      return now - record.lastAssessedAt >= intervalMs;
    });
  }

  getModulesByStatus(status: FitnessStatus): ModuleFitnessRecord[] {
    return Array.from(this.records.values()).filter((r) => r.status === status);
  }

  isStable(moduleName: string): boolean {
    const record = this.records.get(moduleName);
    return record?.status === "stable";
  }

  getSummary(): FitnessSummary {
    const all = Array.from(this.records.values());
    const now = Date.now();

    const stable = all.filter((r) => r.status === "stable").length;
    const unstable = all.filter((r) => r.status === "unstable").length;
    const failing = all.filter((r) => r.status === "failing").length;
    const unknown = all.filter((r) => r.status === "unknown").length;

    const overdue = all.filter((r) => {
      if (r.lastAssessedAt === null) return true;
      const intervalMs = r.reAssessmentIntervalHours * 60 * 60 * 1000;
      return now - r.lastAssessedAt >= intervalMs;
    }).length;

    return {
      totalModules: all.length,
      stable,
      unstable,
      failing,
      unknown,
      overdue,
      fitnessRatio: all.length > 0 ? stable / all.length : 0,
    };
  }
}

// ============================================================================
// Known Modules Registry
// ============================================================================

/**
 * Register all known core modules with their fitness definitions.
 * Called once at startup to seed the fitness store.
 */
export function registerCoreModules(store: FitnessStore): void {
  const modules: ModuleRegistration[] = [
    {
      moduleName: "scheduler",
      correctnessDescription:
        "Tasks are picked by priority, executed by correct persona, and marked DONE with valid outcome",
      requiredConsecutiveSuccesses: 3,
      maxPromptsPerExecution: 10,
      reAssessmentIntervalHours: 168,
    },
    {
      moduleName: "self-modify",
      correctnessDescription:
        "Code changes compile, tests pass, rollback works if health check fails",
      requiredConsecutiveSuccesses: 3,
      maxPromptsPerExecution: 30,
      reAssessmentIntervalHours: 72, // More frequent — higher risk module
    },
    {
      moduleName: "roadmap-observer",
      correctnessDescription:
        "README Section 12 parsed correctly, tracks detected with accurate status, sub-tasks created for incomplete tracks",
      requiredConsecutiveSuccesses: 3,
      maxPromptsPerExecution: 5,
      reAssessmentIntervalHours: 168,
    },
    {
      moduleName: "continuous-self-modify",
      correctnessDescription:
        "Self-modify cycles create valid tasks, agent invoked successfully, modifications tracked",
      requiredConsecutiveSuccesses: 3,
      maxPromptsPerExecution: 50,
      reAssessmentIntervalHours: 72,
    },
    {
      moduleName: "identity-store",
      correctnessDescription:
        "Identity fragments stored, retrieved, and searched with correct relevance ranking",
      requiredConsecutiveSuccesses: 3,
      maxPromptsPerExecution: 5,
      reAssessmentIntervalHours: 168,
    },
    {
      moduleName: "smt-throttler",
      correctnessDescription:
        "Prompt usage tracked accurately, canProceed returns false when window exhausted",
      requiredConsecutiveSuccesses: 3,
      maxPromptsPerExecution: 1,
      reAssessmentIntervalHours: 168,
    },
    {
      moduleName: "boundaries",
      correctnessDescription:
        "Self-modify path validation blocks forbidden paths, allows permitted globs, diff ratio enforced",
      requiredConsecutiveSuccesses: 3,
      maxPromptsPerExecution: 1,
      reAssessmentIntervalHours: 168,
    },
    {
      moduleName: "rollback",
      correctnessDescription:
        "Health check failure triggers git rollback, dry-run prevents actual changes, file-scoped and full-checkout strategies work",
      requiredConsecutiveSuccesses: 3,
      maxPromptsPerExecution: 5,
      reAssessmentIntervalHours: 72,
    },
  ];

  for (const mod of modules) {
    store.register(mod);
  }
}
