/**
 * Sowwy Gateway Server Bootstrap
 *
 * Initializes SOWWY components and wires them to the OpenClaw gateway.
 * This file is called during gateway startup.
 */

import { randomUUID } from "node:crypto";
import type { IdentityStore } from "../identity/store.js";
import type { TaskScheduler } from "../mission-control/scheduler.js";
import type {
  AuditStore,
  DecisionLogEntry,
  DecisionStore,
  TaskStore,
} from "../mission-control/store.js";
import type { SMTThrottler } from "../smt/throttler.js";
import type { GatewayContext } from "./rpc-methods.js";
import { getChildLogger } from "../../logging/logger.js";
import { PersonaOwner } from "../mission-control/schema.js";
// Persona executors
import { createChiefOfStaffPersonaSkill } from "../personas/cos-skill.js";
import { createDevPersonaSkill } from "../personas/dev-skill.js";
import { createLegalOpsPersonaSkill } from "../personas/legalops-skill.js";
import { createRnDPersonaSkill } from "../personas/rnd-skill.js";
import { registerSowwyRPCMethods } from "./rpc-methods.js";

export interface SowwyGatewayConfig {
  /**
   * Enable/disable persona executors
   */
  enablePersonas: boolean;
}

/**
 * Module-level logger for gateway startup
 */
const log = getChildLogger({ subsystem: "sowwy-gateway" });

/**
 * Initialize SOWWY gateway components
 */
export async function initializeSowwyGateway(
  scheduler: TaskScheduler,
  taskStore: TaskStore,
  identityStore: IdentityStore,
  smt: SMTThrottler,
  auditStore: AuditStore,
  config: Partial<SowwyGatewayConfig> = {},
): Promise<GatewayContext> {
  const finalConfig: SowwyGatewayConfig = {
    enablePersonas: true,
    ...config,
  };

  log.info("Initializing...");

  // Register persona executors
  if (finalConfig.enablePersonas) {
    registerPersonaExecutors(scheduler);
  }

  // Create gateway context
  const context: GatewayContext = {
    stores: {
      tasks: taskStore,
      audit: auditStore,
      decisions: {
        async log(entry: Omit<DecisionLogEntry, "id" | "createdAt">) {
          const now = new Date().toISOString();
          const decisionEntry: DecisionLogEntry = {
            ...entry,
            id: randomUUID(),
            createdAt: now,
          };
          // Use audit store as fallback
          await auditStore.append({
            taskId: entry.taskId,
            action: `decision:${entry.decision}`,
            details: {
              reasoning: entry.reasoning,
              confidence: entry.confidence,
              outcome: entry.outcome,
            },
            performedBy: "system",
          });
          return decisionEntry;
        },
        async getByTaskId(_taskId: string) {
          return [];
        },
        async getRecent(_limit: number) {
          return [];
        },
      } as unknown as DecisionStore,
    },
    identityStore,
    smt,
    scheduler,
    userId: "sowwy",
  };

  log.info("SowwyGateway initialized successfully");

  return context;
}

/**
 * Register all persona executors with the scheduler
 */
function registerPersonaExecutors(scheduler: TaskScheduler): void {
  log.info("Registering persona executors...");

  // Helper to create task-specific logger
  const createTaskLogger = (persona: string, taskId: string) =>
    getChildLogger({ subsystem: "sowwy-gateway", persona, taskId });

  // Register Dev persona
  const devExecutor = createDevPersonaSkill();
  scheduler.registerPersona(PersonaOwner.Dev, async (task, context) => {
    if (!devExecutor.canHandle(task)) {
      throw new Error(`Dev executor cannot handle task ${task.taskId}`);
    }
    const taskLog = createTaskLogger("Dev", task.taskId);
    return devExecutor.execute(task, {
      identityContext: context,
      smt: { recordUsage: (op) => taskLog.debug("SMT usage", { operation: op }) },
      audit: {
        log: async (entry) => {
          taskLog.debug("Audit", { action: entry.action });
        },
      },
      logger: taskLog,
    });
  });

  // Register LegalOps persona
  const legalOpsExecutor = createLegalOpsPersonaSkill();
  scheduler.registerPersona(PersonaOwner.LegalOps, async (task, context) => {
    if (!legalOpsExecutor.canHandle(task)) {
      throw new Error(`LegalOps executor cannot handle task ${task.taskId}`);
    }
    const taskLog = createTaskLogger("LegalOps", task.taskId);
    return legalOpsExecutor.execute(task, {
      identityContext: context,
      smt: { recordUsage: (op) => taskLog.debug("SMT usage", { operation: op }) },
      audit: {
        log: async (entry) => {
          taskLog.debug("Audit", { action: entry.action });
        },
      },
      logger: taskLog,
    });
  });

  // Register ChiefOfStaff persona
  const cosExecutor = createChiefOfStaffPersonaSkill();
  scheduler.registerPersona(PersonaOwner.ChiefOfStaff, async (task, context) => {
    if (!cosExecutor.canHandle(task)) {
      throw new Error(`ChiefOfStaff executor cannot handle task ${task.taskId}`);
    }
    const taskLog = createTaskLogger("ChiefOfStaff", task.taskId);
    return cosExecutor.execute(task, {
      identityContext: context,
      smt: { recordUsage: (op) => taskLog.debug("SMT usage", { operation: op }) },
      audit: {
        log: async (entry) => {
          taskLog.debug("Audit", { action: entry.action });
        },
      },
      logger: taskLog,
    });
  });

  // Register RnD persona
  const rndExecutor = createRnDPersonaSkill();
  scheduler.registerPersona(PersonaOwner.RnD, async (task, context) => {
    if (!rndExecutor.canHandle(task)) {
      throw new Error(`RnD executor cannot handle task ${task.taskId}`);
    }
    const taskLog = createTaskLogger("RnD", task.taskId);
    return rndExecutor.execute(task, {
      identityContext: context,
      smt: { recordUsage: (op) => taskLog.debug("SMT usage", { operation: op }) },
      audit: {
        log: async (entry) => {
          taskLog.debug("Audit", { action: entry.action });
        },
      },
      logger: taskLog,
    });
  });

  log.info("Registered 4 persona executors: Dev, LegalOps, ChiefOfStaff, RnD");
}

/**
 * Create RPC methods for the gateway
 */
export function createSowwyRPCMethods(context: GatewayContext): Record<string, Function> {
  return registerSowwyRPCMethods(context);
}
