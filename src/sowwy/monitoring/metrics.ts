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
