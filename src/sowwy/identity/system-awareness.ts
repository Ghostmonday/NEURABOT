/**
 * System Awareness - Bot Self-Knowledge
 *
 * Stores information about the bot's own systems, capabilities, and infrastructure
 * so the bot can reason about and utilize its own features.
 *
 * Note: System awareness is accessible via:
 * 1. RPC method: sowwy.capabilities (returns current capabilities)
 * 2. Identity search: identity.search("system capability") (if stored in identity store)
 * 3. Direct RPC calls to check system status
 */

import type { AuditStore } from "../mission-control/store.js";

/**
 * Initialize system awareness by logging capabilities to audit store
 * This makes capabilities discoverable via audit logs and RPC methods
 */
export async function initializeSystemAwareness(
  auditStore: AuditStore,
  capabilities: {
    systems: Record<string, unknown>;
    storage: Record<string, unknown>;
    communication: Record<string, unknown>;
    selfModify: Record<string, unknown>;
    rpcMethods: string[];
    tools: Record<string, unknown>;
  },
): Promise<void> {
  // Log system capabilities to audit store for discoverability
  await auditStore.append({
    taskId: "system",
    action: "system-awareness.initialized",
    details: {
      systems: capabilities.systems,
      storage: capabilities.storage,
      communication: capabilities.communication,
      selfModify: capabilities.selfModify,
      rpcMethods: capabilities.rpcMethods,
      tools: capabilities.tools,
      timestamp: new Date().toISOString(),
    },
    performedBy: "system",
  });
}
