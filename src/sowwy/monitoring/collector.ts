/**
 * Sowwy Metrics Collector - Prometheus Implementation
 *
 * ⚠️ METRICS OVERVIEW:
 * - Task throughput and queue depth
 * - SMT utilization and limits
 * - Identity fragment counts by category
 * - Persona execution times
 * - Circuit breaker states
 * - Error rates by operation
 */

import type { SowwyMetrics, MetricsCollector } from "./metrics.js";

// ============================================================================
// In-Memory Metrics Collector
// ============================================================================

export class InMemoryMetricsCollector implements MetricsCollector {
  private counters: Record<string, number> = {};
  private gauges: Record<string, number> = {};
  private timings: Record<string, number[]> = {};
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  // Increment counters
  incrementTaskCompleted(): void {
    this.counters["tasks_completed"] = (this.counters["tasks_completed"] ?? 0) + 1;
  }

  incrementTaskFailed(): void {
    this.counters["tasks_failed"] = (this.counters["tasks_failed"] ?? 0) + 1;
  }

  incrementIdentityFragment(): void {
    this.counters["identity_fragments_total"] =
      (this.counters["identity_fragments_total"] ?? 0) + 1;
  }

  incrementSMTUsage(): void {
    this.counters["smt_operations_total"] = (this.counters["smt_operations_total"] ?? 0) + 1;
  }

  incrementAuthFailure(): void {
    this.counters["auth_failures_total"] = (this.counters["auth_failures_total"] ?? 0) + 1;
  }

  incrementPairingRequest(): void {
    this.counters["pairing_requests_total"] = (this.counters["pairing_requests_total"] ?? 0) + 1;
  }

  incrementApprovalDenial(): void {
    this.counters["approval_denials_total"] = (this.counters["approval_denials_total"] ?? 0) + 1;
  }

  // Set gauges
  setTaskQueueDepth(depth: number): void {
    this.gauges["task_queue_depth"] = depth;
  }

  setSMTUtilization(utilization: number): void {
    this.gauges["smt_utilization"] = Math.round(utilization * 100) / 100;
  }

  setHealthStatus(component: string, healthy: boolean): void {
    this.gauges[`health_${component}`] = healthy ? 1 : 0;
  }

  setCircuitBreakerState(name: string, state: string): void {
    const stateMap: Record<string, number> = { CLOSED: 0, HALF_OPEN: 1, OPEN: 2 };
    this.gauges[`circuit_breaker_${name}`] = stateMap[state] ?? -1;
  }

  // Record timings
  recordPersonaExecution(persona: string, durationMs: number): void {
    const key = `persona_${persona}_execution_ms`;
    if (!this.timings[key]) {
      this.timings[key] = [];
    }
    this.timings[key].push(durationMs);
  }

  recordTaskExecution(durationMs: number): void {
    if (!this.timings["task_execution_ms"]) {
      this.timings["task_execution_ms"] = [];
    }
    this.timings["task_execution_ms"].push(durationMs);
  }

  // Get all metrics
  getMetrics(): SowwyMetrics {
    return {
      // Task metrics
      tasksTotal: (this.counters["tasks_completed"] ?? 0) + (this.counters["tasks_failed"] ?? 0),
      tasksByStatus: {
        completed: this.counters["tasks_completed"] ?? 0,
        failed: this.counters["tasks_failed"] ?? 0,
      },
      tasksCompletedPerHour: this.calculateRatePerHour("tasks_completed"),
      taskQueueDepth: this.gauges["task_queue_depth"] ?? 0,

      // SMT metrics
      smtUtilization: this.gauges["smt_utilization"] ?? 0,
      smtRemaining: 100 - (this.gauges["smt_utilization"] ?? 0) * 100,
      smtPaused: false,

      // Identity metrics
      identityFragments: this.counters["identity_fragments_total"] ?? 0,
      identityByCategory: {},
      identityExtractionRate: this.calculateRatePerHour("identity_fragments_total"),

      // Persona metrics
      personaExecutionTime: this.calculateTimingMetrics(),

      // Channel metrics
      channelMessageRates: {},

      // Health metrics
      healthCheckStatus: {
        postgres: this.gauges["health_postgres"] === 1,
        lancedb: this.gauges["health_lancedb"] === 1,
        gateway: this.gauges["health_gateway"] === 1,
        smt: this.gauges["health_smt"] === 1,
      },

      // Circuit breaker metrics
      circuitBreakerStates: {},

      // Error metrics
      errorRateByOperation: {},

      // Security metrics
      authFailures: this.counters["auth_failures_total"] ?? 0,
      pairingRequests: this.counters["pairing_requests_total"] ?? 0,
      approvalDenials: this.counters["approval_denials_total"] ?? 0,
    };
  }

  // Private helpers
  private calculateRatePerHour(counterKey: string): number {
    const count = this.counters[counterKey] ?? 0;
    const elapsedHours = (Date.now() - this.startTime) / (1000 * 60 * 60);
    return elapsedHours > 0 ? Math.round(count / elapsedHours) : 0;
  }

  private calculateTimingMetrics(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, timings] of Object.entries(this.timings)) {
      if (timings.length > 0) {
        const sum = timings.reduce((a, b) => a + b, 0);
        result[key] = Math.round(sum / timings.length);
      }
    }
    return result;
  }
}

// ============================================================================
// Prometheus Export
// ============================================================================

export function metricsToPrometheus(metrics: SowwyMetrics): string {
  const lines: string[] = [];

  // Task metrics
  lines.push(`# HELP sowwy_tasks_total Total number of tasks`);
  lines.push(`# TYPE sowwy_tasks_total counter`);
  lines.push(`sowwy_tasks_total ${metrics.tasksTotal}`);

  lines.push(`# HELP sowwy_task_queue_depth Number of tasks waiting in queue`);
  lines.push(`# TYPE sowwy_task_queue_depth gauge`);
  lines.push(`sowwy_task_queue_depth ${metrics.taskQueueDepth}`);

  // SMT metrics
  lines.push(`# HELP sowwy_smt_utilization SMT token utilization (0-1)`);
  lines.push(`# TYPE sowwy_smt_utilization gauge`);
  lines.push(`sowwy_smt_utilization ${metrics.smtUtilization}`);

  // Identity metrics
  lines.push(`# HELP sowwy_identity_fragments_total Total identity fragments stored`);
  lines.push(`# TYPE sowwy_identity_fragments_total counter`);
  lines.push(`sowwy_identity_fragments_total ${metrics.identityFragments}`);

  // Security metrics
  lines.push(`# HELP sowwy_auth_failures_total Total authentication failures`);
  lines.push(`# TYPE sowwy_auth_failures_total counter`);
  lines.push(`sowwy_auth_failures_total ${metrics.authFailures}`);

  lines.push(`# HELP sowwy_approval_denials_total Total approval denials`);
  lines.push(`# TYPE sowwy_approval_denials_total counter`);
  lines.push(`sowwy_approval_denials_total ${metrics.approvalDenials}`);

  return lines.join("\n") + "\n";
}

// ============================================================================
// Collector Factory
// ============================================================================

let globalCollector: MetricsCollector | null = null;

export function getGlobalCollector(): MetricsCollector {
  if (!globalCollector) {
    globalCollector = new InMemoryMetricsCollector();
  }
  return globalCollector;
}

export function setGlobalCollector(collector: MetricsCollector): void {
  globalCollector = collector;
}
