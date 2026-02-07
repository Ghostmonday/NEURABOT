/**
 * Sowwy Monitoring - Prometheus Metrics Foundation
 *
 * Metrics for:
 * - Task throughput
 * - SMT utilization
 * - Persona execution times
 * - Identity fragment counts
 * - Channel message rates
 * - Health check status
 * - Circuit breaker states
 * - Task queue depth
 * - Error rates
 */

// ============================================================================
// Metric Types
// ============================================================================

export interface SowwyMetrics {
  // Task metrics
  tasksTotal: number;
  tasksByStatus: Record<string, number>;
  tasksCompletedPerHour: number;
  taskQueueDepth: number;

  // SMT metrics
  smtUtilization: number;
  smtRemaining: number;
  smtPaused: boolean;

  // Identity metrics
  identityFragments: number;
  identityByCategory: Record<string, number>;
  identityExtractionRate: number;

  // Persona metrics
  personaExecutionTime: Record<string, number>;

  // Channel metrics
  channelMessageRates: Record<string, number>;

  // Health metrics
  healthCheckStatus: Record<string, boolean>;

  // Circuit breaker metrics
  circuitBreakerStates: Record<string, string>;

  // Error metrics
  errorRateByOperation: Record<string, number>;

  // Security metrics
  authFailures: number;
  pairingRequests: number;
  approvalDenials: number;
}

// ============================================================================
// Metrics Collector
// ============================================================================

export interface MetricsCollector {
  // Increment counters
  incrementTaskCompleted(): void;
  incrementTaskFailed(): void;
  incrementIdentityFragment(): void;
  incrementSMTUsage(): void;
  incrementAuthFailure(): void;
  incrementPairingRequest(): void;
  incrementApprovalDenial(): void;

  // Set gauges
  setTaskQueueDepth(depth: number): void;
  setSMTUtilization(utilization: number): void;
  setHealthStatus(component: string, healthy: boolean): void;
  setCircuitBreakerState(name: string, state: string): void;

  // Record timings
  recordPersonaExecution(persona: string, durationMs: number): void;
  recordTaskExecution(durationMs: number): void;

  // Get all metrics
  getMetrics(): SowwyMetrics;
}

// ============================================================================
// Prometheus Export Format
// ============================================================================

export interface PrometheusMetric {
  name: string;
  help: string;
  type: "counter" | "gauge" | "histogram" | "summary";
  value: number | string;
  labels?: Record<string, string>;
}

// ============================================================================
// Health Check Types
// ============================================================================

export interface HealthCheck {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  latencyMs: number;
  details?: Record<string, unknown>;
}

export interface HealthStatus {
  overall: "healthy" | "degraded" | "unhealthy";
  checks: HealthCheck[];
  timestamp: string;
}

// ============================================================================
// Default Health Checks
// ============================================================================

export const DEFAULT_HEALTH_CHECKS = [
  { name: "postgres", label: "PostgreSQL" },
  { name: "lancedb", label: "LanceDB" },
  { name: "gateway", label: "Gateway" },
  { name: "smt", label: "SMT" },
  { name: "scheduler", label: "Scheduler" },
  { name: "identity", label: "Identity Store" },
  { name: "tasks", label: "Task Store" },
];

// ============================================================================
// Alert Thresholds
// ============================================================================

export const ALERT_THRESHOLDS = {
  postgresDown: "critical",
  lancedbUnavailable: "warning",
  smtUtilizationHigh: 0.9,
  taskQueueDepthHigh: 100,
  oldestReadyTaskAgeMs: 86400000, // 24 hours
  identityExtractionRateZero: true,
  authFailuresHigh: 5,
  pairingRequestsHigh: 10,
};

// ============================================================================
// Alert Types
// ============================================================================

export interface Alert {
  severity: "critical" | "warning";
  name: string;
  message: string;
  value: number | string | boolean;
  threshold: number | string | boolean;
}

/**
 * Check metrics against alert thresholds and return triggered alerts
 */
export function checkAlertThresholds(metrics: SowwyMetrics): Alert[] {
  const alerts: Alert[] = [];

  // PostgreSQL down
  if (!metrics.healthCheckStatus.postgres) {
    alerts.push({
      severity: "critical",
      name: "postgresDown",
      message: "PostgreSQL is unavailable",
      value: false,
      threshold: ALERT_THRESHOLDS.postgresDown,
    });
  }

  // LanceDB unavailable
  if (!metrics.healthCheckStatus.lancedb) {
    alerts.push({
      severity: "warning",
      name: "lancedbUnavailable",
      message: "LanceDB is unavailable",
      value: false,
      threshold: ALERT_THRESHOLDS.lancedbUnavailable,
    });
  }

  // SMT utilization high
  if (metrics.smtUtilization >= ALERT_THRESHOLDS.smtUtilizationHigh) {
    alerts.push({
      severity: "warning",
      name: "smtUtilizationHigh",
      message: `SMT utilization is ${Math.round(metrics.smtUtilization * 100)}% (threshold: ${Math.round(ALERT_THRESHOLDS.smtUtilizationHigh * 100)}%)`,
      value: metrics.smtUtilization,
      threshold: ALERT_THRESHOLDS.smtUtilizationHigh,
    });
  }

  // Task queue depth high
  if (metrics.taskQueueDepth >= ALERT_THRESHOLDS.taskQueueDepthHigh) {
    alerts.push({
      severity: "warning",
      name: "taskQueueDepthHigh",
      message: `Task queue depth is ${metrics.taskQueueDepth} (threshold: ${ALERT_THRESHOLDS.taskQueueDepthHigh})`,
      value: metrics.taskQueueDepth,
      threshold: ALERT_THRESHOLDS.taskQueueDepthHigh,
    });
  }

  // Identity extraction rate zero
  if (ALERT_THRESHOLDS.identityExtractionRateZero && metrics.identityExtractionRate === 0) {
    alerts.push({
      severity: "warning",
      name: "identityExtractionRateZero",
      message: "Identity extraction rate is zero",
      value: 0,
      threshold: true,
    });
  }

  // Auth failures high
  if (metrics.authFailures >= ALERT_THRESHOLDS.authFailuresHigh) {
    alerts.push({
      severity: "warning",
      name: "authFailuresHigh",
      message: `Auth failures: ${metrics.authFailures} (threshold: ${ALERT_THRESHOLDS.authFailuresHigh})`,
      value: metrics.authFailures,
      threshold: ALERT_THRESHOLDS.authFailuresHigh,
    });
  }

  // Pairing requests high
  if (metrics.pairingRequests >= ALERT_THRESHOLDS.pairingRequestsHigh) {
    alerts.push({
      severity: "warning",
      name: "pairingRequestsHigh",
      message: `Pairing requests: ${metrics.pairingRequests} (threshold: ${ALERT_THRESHOLDS.pairingRequestsHigh})`,
      value: metrics.pairingRequests,
      threshold: ALERT_THRESHOLDS.pairingRequestsHigh,
    });
  }

  // Circuit breakers open
  for (const [name, state] of Object.entries(metrics.circuitBreakerStates)) {
    if (state === "OPEN") {
      alerts.push({
        severity: "critical",
        name: `circuitBreakerOpen:${name}`,
        message: `Circuit breaker ${name} is OPEN`,
        value: state,
        threshold: "CLOSED",
      });
    }
  }

  return alerts;
}
