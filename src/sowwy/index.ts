/**
 * Sowwy - OpenClaw Synthesis
 *
 * Super Output Workforce Intelligence Entity
 *
 * Architecture:
 * - Mission Control: Task OS with priorities and scheduling
 * - Identity Model: Learns who you are over time
 * - Personas: Dev, LegalOps, ChiefOfStaff, R&D
 * - SMT Throttler: Throughput control with safety scope
 *
 * This package extends OpenClaw rather than replacing it.
 */

// Mission Control
export * from "./mission-control/memory-store.js";
export * from "./mission-control/pg-store.js";
export * from "./mission-control/scheduler.js";
export * from "./mission-control/schema.js";
export * from "./mission-control/store.js";

// Identity Model
export * from "./identity/fragments.js";
export * from "./identity/lancedb-store.js";
export * from "./identity/store.js";

// Personas
export * from "./personas/priority.js";
export * from "./personas/router.js";

// SMT Throttler
export * from "./smt/throttler.js";

// Security
export * from "./security/env-validator.js";
export * from "./security/policy.js";
export * from "./security/redact.js";

// Integrations
export * from "./integrations/circuit-breaker.js";

// Gateway - explicitly re-export types to avoid HealthStatus conflict with monitoring/metrics
export * from "./extensions/integration.js";
export { registerSowwyRPCMethods } from "./gateway/rpc-methods.js";
export type {
  GatewayContext,
  GatewayHealthStatus,
  SowwyRPCMethods,
  TaskRPCMethods,
} from "./gateway/rpc-methods.js";

// Monitoring
export * from "./monitoring/metrics.js";

// Migration
export * from "./migration/openclaw-to-sowwy.js";

// Version
export const SOWWY_VERSION = "0.1.0";
