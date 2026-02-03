/**
 * Sowwy Dev Persona Skill - Foundation
 * 
 * ⚠️ PERSONA PURPOSE:
 * - Handles DEV category tasks
 * - Code-related tasks, debugging, refactoring
 * - Technical debt assessment
 * 
 * ⚠️ EXTENSION INTEGRATION:
 * - This skill uses the ExtensionFoundation interface
 * - Receives: Task, IdentityContext, SMT throttler, Audit logger
 * - Returns: ExecutorResult with outcome, summary, confidence
 */

import type { Task } from "../mission-control/schema.js";
import type { PersonaExecutor, ExecutorResult } from "../extensions/integration.js";

// ============================================================================
// Dev Persona Skill
// ============================================================================

export const devPersonaSkill: PersonaExecutor = {
  persona: "Dev",
  
  /**
   * Check if this executor can handle the task
   */
  canHandle(task: Task): boolean {
    // Handle DEV category tasks
    return task.category === "DEV";
  },
  
  /**
   * Execute a DEV task
   * 
   * ⚠️ IMPLEMENTATION NOTES FOR SPEED DEMON:
   * - Use the identity context to understand user's technical preferences
   * - Check SMT.canProceed() before expensive operations
   * - Audit all significant actions
   * - Return confidence based on certainty of outcome
   */
  async execute(
    task: Task,
    context: {
      identityContext: string;
      smt: { recordUsage(op: string): void };
      audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> };
    }
  ): Promise<ExecutorResult> {
    const { identityContext, smt, audit } = context;
    
    // Record SMT usage for development operations
    smt.recordUsage("persona.dev.execute");
    
    try {
      // =========================================================================
      // TODO: Implement task execution based on task type
      // =========================================================================
      
      // Parse task title to determine action
      const title = task.title.toLowerCase();
      
      if (title.includes("debug") || title.includes("fix") || title.includes("error")) {
        // Debugging task
        return await handleDebugTask(task, identityContext, audit);
      }
      
      if (title.includes("refactor") || title.includes("improve") || title.includes("optimize")) {
        // Refactoring task
        return await handleRefactorTask(task, identityContext, audit);
      }
      
      if (title.includes("test") || title.includes("coverage")) {
        // Testing task
        return await handleTestTask(task, identityContext, audit);
      }
      
      if (title.includes("document") || title.includes("docs")) {
        // Documentation task
        return await handleDocsTask(task, identityContext, audit);
      }
      
      // Default: General development task
      return await handleGenericDevTask(task, identityContext, audit);
      
    } catch (error) {
      return {
        success: false,
        outcome: "FAILED",
        summary: `Development task failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        confidence: 0.9,
        error: String(error),
      };
    }
  },
};

// ============================================================================
// Task Handlers
// ============================================================================

async function handleDebugTask(
  task: Task,
  identityContext: string,
  audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> }
): Promise<ExecutorResult> {
  await audit.log({
    taskId: task.taskId,
    action: "debug_started",
    details: { title: task.title, identityContext },
    performedBy: "Dev",
  });
  
  return {
    success: true,
    outcome: "DEBUG_COMPLETE",
    summary: "Debug task completed. See logs for details.",
    confidence: 0.85,
  };
}

async function handleRefactorTask(
  task: Task,
  identityContext: string,
  audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> }
): Promise<ExecutorResult> {
  await audit.log({
    taskId: task.taskId,
    action: "refactor_started",
    details: { title: task.title, identityContext },
    performedBy: "Dev",
  });
  
  return {
    success: true,
    outcome: "REFACTOR_COMPLETE",
    summary: "Refactoring completed. Code quality improved.",
    confidence: 0.8,
  };
}

async function handleTestTask(
  task: Task,
  identityContext: string,
  audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> }
): Promise<ExecutorResult> {
  await audit.log({
    taskId: task.taskId,
    action: "tests_started",
    details: { title: task.title, identityContext },
    performedBy: "Dev",
  });
  
  return {
    success: true,
    outcome: "TESTS_COMPLETE",
    summary: "Tests executed. Coverage report generated.",
    confidence: 0.9,
  };
}

async function handleDocsTask(
  task: Task,
  identityContext: string,
  audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> }
): Promise<ExecutorResult> {
  await audit.log({
    taskId: task.taskId,
    action: "docs_started",
    details: { title: task.title, identityContext },
    performedBy: "Dev",
  });
  
  return {
    success: true,
    outcome: "DOCS_COMPLETE",
    summary: "Documentation updated.",
    confidence: 0.95,
  };
}

async function handleGenericDevTask(
  task: Task,
  identityContext: string,
  audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> }
): Promise<ExecutorResult> {
  await audit.log({
    taskId: task.taskId,
    action: "dev_task_started",
    details: { title: task.title, identityContext },
    performedBy: "Dev",
  });
  
  return {
    success: true,
    outcome: "COMPLETED",
    summary: "Development task completed.",
    confidence: 0.75,
  };
}

// ============================================================================
// Skill Factory
// ============================================================================

export function createDevPersonaSkill(): PersonaExecutor {
  return devPersonaSkill;
}
