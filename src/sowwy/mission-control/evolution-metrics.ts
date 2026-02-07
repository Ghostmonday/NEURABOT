/**
 * Evolution Metrics Collector
 *
 * Tracks self-modification and evolution speed metrics for the NEURABOT system.
 * Provides insight into the effectiveness and health of the self-improvement loop.
 */

export type EvolutionEventType =
  | "self_modify_attempt"
  | "self_modify_success"
  | "self_modify_rollback"
  | "build_complete"
  | "validation_complete"
  | "fitness_pass"
  | "fitness_fail"
  | "todo_resolved"
  | "todo_introduced";

export interface EvolutionEvent {
  type: EvolutionEventType;
  timestamp: Date;
  details?: Record<string, unknown>;
}

export interface EvolutionMetrics {
  selfModificationsAttempted: number;
  selfModificationsSucceeded: number;
  selfModificationsRolledBack: number;
  averageBuildTimeMs: number;
  averageValidationTimeMs: number;
  fitnessPassRate: number;
  filesModifiedToday: Set<string>;
  todosResolved: number;
  todosIntroduced: number;
}

export class EvolutionMetricsCollector {
  private events: EvolutionEvent[] = [];
  private filesModifiedToday: Set<string> = new Set();
  private lastResetDate: Date = new Date();

  private totalBuildTimeMs = 0;
  private buildCount = 0;
  private totalValidationTimeMs = 0;
  private validationCount = 0;
  private fitnessPassCount = 0;
  private fitnessFailCount = 0;

  /**
   * Record an evolution event.
   */
  record(event: EvolutionEvent): void {
    this.events.push(event);

    // Track files modified today
    if (event.type === "self_modify_success" && event.details?.["files"]) {
      const files = event.details["files"] as string[];
      for (const file of files) {
        this.filesModifiedToday.add(file);
      }
    }

    // Track build time
    if (event.type === "build_complete" && event.details?.["durationMs"]) {
      this.totalBuildTimeMs += event.details["durationMs"] as number;
      this.buildCount++;
    }

    // Track validation time
    if (event.type === "validation_complete" && event.details?.["durationMs"]) {
      this.totalValidationTimeMs += event.details["durationMs"] as number;
      this.validationCount++;
    }

    // Track fitness outcomes
    if (event.type === "fitness_pass") {
      this.fitnessPassCount++;
    }
    if (event.type === "fitness_fail") {
      this.fitnessFailCount++;
    }

    // Check if we need to reset daily metrics
    this.checkDailyReset();
  }

  /**
   * Get current metrics snapshot.
   */
  getMetrics(): EvolutionMetrics {
    const totalModifications = this.selfModificationsAttempted;
    const succeeded = this.selfModificationsSucceeded;
    const rolledBack = this.selfModificationsRolledBack;

    return {
      selfModificationsAttempted: totalModifications,
      selfModificationsSucceeded: succeeded,
      selfModificationsRolledBack: rolledBack,
      averageBuildTimeMs: this.buildCount > 0 ? this.totalBuildTimeMs / this.buildCount : 0,
      averageValidationTimeMs:
        this.validationCount > 0 ? this.totalValidationTimeMs / this.validationCount : 0,
      fitnessPassRate:
        this.fitnessPassCount + this.fitnessFailCount > 0
          ? this.fitnessPassCount / (this.fitnessPassCount + this.fitnessFailCount)
          : 0,
      filesModifiedToday: new Set(this.filesModifiedToday),
      todosResolved: this.todosResolved,
      todosIntroduced: this.todosIntroduced,
    };
  }

  /**
   * Get a human-readable summary of current metrics.
   */
  getSummary(): string {
    const metrics = this.getMetrics();
    const successRate =
      metrics.selfModificationsAttempted > 0
        ? ((metrics.selfModificationsSucceeded / metrics.selfModificationsAttempted) * 100).toFixed(
            0,
          )
        : "0";

    const summary = [
      `Today: ${metrics.selfModificationsAttempted} modifications attempted, ${metrics.selfModificationsSucceeded} succeeded (${successRate}%), ${metrics.selfModificationsRolledBack} rollback${metrics.selfModificationsRolledBack !== 1 ? "s" : ""}.`,
    ];

    if (metrics.averageBuildTimeMs > 0) {
      summary.push(`Avg build: ${(metrics.averageBuildTimeMs / 1000).toFixed(1)}s.`);
    }

    if (metrics.todosResolved > 0 || metrics.todosIntroduced > 0) {
      summary.push(
        `${metrics.todosResolved} TODOs resolved, ${metrics.todosIntroduced} introduced.`,
      );
    }

    if (metrics.fitnessPassRate > 0) {
      summary.push(`Fitness pass rate: ${(metrics.fitnessPassRate * 100).toFixed(0)}%.`);
    }

    return summary.join(" ");
  }

  /**
   * Reset daily metrics (called automatically).
   */
  reset(): void {
    this.events = [];
    this.filesModifiedToday = new Set();
    this.totalBuildTimeMs = 0;
    this.buildCount = 0;
    this.totalValidationTimeMs = 0;
    this.validationCount = 0;
    this.fitnessPassCount = 0;
    this.fitnessFailCount = 0;
    this.lastResetDate = new Date();
  }

  /**
   * Get the number of attempted self-modifications.
   */
  private get selfModificationsAttempted(): number {
    return this.events.filter((e) => e.type === "self_modify_attempt").length;
  }

  /**
   * Get the number of successful self-modifications.
   */
  private get selfModificationsSucceeded(): number {
    return this.events.filter((e) => e.type === "self_modify_success").length;
  }

  /**
   * Get the number of rolled back self-modifications.
   */
  private get selfModificationsRolledBack(): number {
    return this.events.filter((e) => e.type === "self_modify_rollback").length;
  }

  /**
   * Get the number of resolved TODOs.
   */
  private get todosResolved(): number {
    return this.events.filter((e) => e.type === "todo_resolved").length;
  }

  /**
   * Get the number of introduced TODOs.
   */
  private get todosIntroduced(): number {
    return this.events.filter((e) => e.type === "todo_introduced").length;
  }

  /**
   * Check if it's a new day and reset daily metrics if needed.
   */
  private checkDailyReset(): void {
    const now = new Date();
    if (now.toDateString() !== this.lastResetDate.toDateString()) {
      this.reset();
    }
  }
}
