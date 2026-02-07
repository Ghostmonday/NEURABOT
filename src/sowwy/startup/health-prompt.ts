/**
 * SOWWY Startup Health Check and User Prompt
 *
 * Runs after gateway bootstrap to verify system health and prompt the user
 * to proceed with autonomous operations (e.g., Roadmap Observer execution).
 *
 * Constitution §0: This is "The Safety Net" ensuring SOWWY doesn't start
 * modifications without operator consent.
 */

import type { IdentityStore } from "../identity/store.js";
import type { TaskStore } from "../mission-control/store.js";
import type { SMTThrottler } from "../smt/throttler.js";
import { getChildLogger } from "../../logging/logger.js";

const log = getChildLogger({ subsystem: "startup-health-prompt" });

export type HealthCheckResult = {
  healthy: boolean;
  checks: {
    taskStore: boolean;
    identityStore: boolean;
    smtThrottler: boolean;
    watchdog: boolean;
  };
  warnings: string[];
  errors: string[];
};

export type StartupPromptOptions = {
  /** If true, skip interactive prompt and auto-proceed (for automated deployments) */
  autoApprove?: boolean;
  /** If true, skip startup prompt entirely (for testing or manual control) */
  skipPrompt?: boolean;
};

/**
 * Run health checks on SOWWY subsystems
 */
export async function runHealthCheck(opts: {
  taskStore: TaskStore;
  identityStore: IdentityStore;
  smt: SMTThrottler;
}): Promise<HealthCheckResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const checks = {
    taskStore: false,
    identityStore: false,
    smtThrottler: false,
    watchdog: false,
  };

  // Check task store
  try {
    await opts.taskStore.list({ limit: 1 });
    checks.taskStore = true;
  } catch (err) {
    errors.push(`Task store check failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Check identity store
  try {
    await opts.identityStore.search("health check", { limit: 1 });
    checks.identityStore = true;
  } catch (err) {
    errors.push(`Identity store check failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Check SMT throttler
  try {
    const canProceed = opts.smt.canProceed("health_check");
    checks.smtThrottler = true;
    if (!canProceed) {
      warnings.push("SMT throttler is at capacity (may defer some operations)");
    }
  } catch (err) {
    errors.push(`SMT throttler check failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Check watchdog (via env/process state)
  try {
    const watchdogEnabled = Boolean(process.env.HEALTHCHECKS_URL);
    checks.watchdog = true;
    if (!watchdogEnabled) {
      warnings.push(
        "Watchdog monitoring disabled (no HEALTHCHECKS_URL). Consider enabling for production.",
      );
    }
  } catch (err) {
    errors.push(`Watchdog check failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const healthy =
    checks.taskStore && checks.identityStore && checks.smtThrottler && errors.length === 0;

  return { healthy, checks, warnings, errors };
}

/**
 * Prompt user to proceed with SOWWY autonomous operations
 *
 * Returns true if user approves or auto-approve is enabled
 */
export async function promptStartupApproval(
  healthCheck: HealthCheckResult,
  options: StartupPromptOptions = {},
): Promise<boolean> {
  if (options.skipPrompt) {
    log.info("Startup prompt skipped", { skipPrompt: true });
    return false;
  }

  if (options.autoApprove) {
    log.info("Auto-approving startup", { autoApprove: true });
    if (!healthCheck.healthy) {
      log.warn("Auto-approve enabled but health check failed. Proceeding anyway.");
    }
    return true;
  }

  // Display health status
  log.info("═══════════════════════════════════════════════════════════════");
  log.info("      SOWWY Mission Control - Startup Health Check");
  log.info("═══════════════════════════════════════════════════════════════");

  const statusSymbol = (check: boolean) => (check ? "✓" : "✗");
  const statusColor = (check: boolean) => (check ? "\x1b[32m" : "\x1b[31m"); // green : red
  const reset = "\x1b[0m";

  log.info("System Components:");
  log.info(
    `  ${statusColor(healthCheck.checks.taskStore)}${statusSymbol(healthCheck.checks.taskStore)}${reset} Task Store`,
  );
  log.info(
    `  ${statusColor(healthCheck.checks.identityStore)}${statusSymbol(healthCheck.checks.identityStore)}${reset} Identity Store`,
  );
  log.info(
    `  ${statusColor(healthCheck.checks.smtThrottler)}${statusSymbol(healthCheck.checks.smtThrottler)}${reset} SMT Throttler`,
  );
  log.info(
    `  ${statusColor(healthCheck.checks.watchdog)}${statusSymbol(healthCheck.checks.watchdog)}${reset} Watchdog Monitor`,
  );

  if (healthCheck.warnings.length > 0) {
    log.info("\nWarnings:");
    for (const warning of healthCheck.warnings) {
      log.info(`  ⚠ ${warning}`);
    }
  }

  if (healthCheck.errors.length > 0) {
    log.info("\nErrors:");
    for (const error of healthCheck.errors) {
      log.info(`  ✗ ${error}`);
    }
  }

  log.info(`\n${healthCheck.healthy ? "✓ System health: OPTIMAL" : "✗ System health: DEGRADED"}`);

  if (!healthCheck.healthy) {
    log.info("\nRecommendation: Fix errors before enabling autonomous operations.");
    log.info("You can still proceed, but some features may not work correctly.\n");
  }

  // Prompt for approval
  log.info("\nThe Roadmap Observer (README §12) can autonomously create and manage tasks");
  log.info("to drive completion of Track 1 (iOS), Track 2 (Tuta Mail), and Track 3 (Calendar).");
  log.info("\nThis respects all safety constraints from the Ratified Constitution (README §0):");
  log.info("  • Approval gates for high-risk actions");
  log.info("  • SMT throttling (100 prompts per 5 hours)");
  log.info("  • Watchdog monitoring and crash recovery");
  log.info("  • Self-modification boundaries and checklist\n");

  // Use readline for interactive prompt
  const readline = await import("node:readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return await new Promise<boolean>((resolve) => {
    rl.question(
      "\x1b[1mShall I proceed with autonomous operations now? (yes/no): \x1b[0m",
      (answer) => {
        rl.close();
        const normalized = answer.trim().toLowerCase();
        const approved = normalized === "yes" || normalized === "y";

        if (approved) {
          log.info("\n✓ Autonomous operations approved. Starting SOWWY scheduler...\n");
        } else {
          log.info("\n⊘ Autonomous operations declined. SOWWY will remain idle.");
          log.info("  To activate later, run: openclaw roadmap:activate\n");
        }

        resolve(approved);
      },
    );
  });
}

/**
 * Create initial MISSION_CONTROL task if approved
 */
export async function createInitialRoadmapTask(
  taskStore: TaskStore,
  userId: string,
): Promise<void> {
  log.info("Creating initial Roadmap Observer task...");

  try {
    const task = await taskStore.create({
      title: "Monitor README Roadmap Progress",
      description:
        "Continuously monitor Section 12 roadmap (iOS, Tuta Mail, Calendar) and create sub-tasks for incomplete tracks. Respects Constitution §0 safety constraints.",
      category: "MISSION_CONTROL",
      personaOwner: "ChiefOfStaff",
      urgency: 5,
      importance: 5,
      risk: 2,
      stressCost: 2,
      requiresApproval: false,
      maxRetries: 3,
      dependencies: [],
      contextLinks: {},
      payload: {
        action: "read_readme_roadmap",
        persist_until_complete: true,
      },
      createdBy: userId,
    });

    log.info(`✓ Roadmap Observer task created (ID: ${task.taskId.slice(0, 8)}...)`);
    log.info("  SOWWY scheduler will process this task on next poll cycle.\n");
  } catch (err) {
    log.error(
      `Failed to create Roadmap Observer task: ${err instanceof Error ? err.message : String(err)}`,
    );
    log.error("  You can create it manually later with: openclaw roadmap:activate\n");
  }
}
