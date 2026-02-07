/**
 * Dev Persona Executor Extension
 *
 * Handles tasks with category DEV or SELF_MODIFY.
 * Executes code-related work: debugging, refactoring, testing, documentation.
 */

import type { Task } from "../../mission-control/schema.js";
import type {
  ExecutorResult,
  ExtensionFoundation,
  ExtensionLifecycle,
  PersonaExecutor,
} from "../integration.js";
import { AGENT_LANE_NESTED } from "../../../agents/lanes.js";
import { runAgentStep } from "../../../agents/tools/agent-step.js";

export class PersonaDevExtension implements ExtensionLifecycle {
  private foundation: ExtensionFoundation | null = null;

  async initialize(foundation: ExtensionFoundation): Promise<void> {
    this.foundation = foundation;
    const executor = new PersonaDevExecutor(foundation);
    foundation.registerPersonaExecutor("Dev", executor);
  }

  async shutdown(): Promise<void> {
    this.foundation = null;
  }

  async tick(): Promise<void> {
    // No periodic work needed
  }
}

class PersonaDevExecutor implements PersonaExecutor {
  persona = "Dev";

  constructor(private foundation: ExtensionFoundation) {}

  canHandle(task: Task): boolean {
    return task.category === "DEV" || task.category === "SELF_MODIFY";
  }

  async execute(
    task: Task,
    context: {
      identityContext: string;
      smt: { recordUsage(op: string): void };
      audit: { log(entry: { action: string; details: unknown }): Promise<void> };
    },
  ): Promise<ExecutorResult> {
    // Check SMT quota
    if (!this.foundation.canProceed("persona_dev.execute")) {
      return {
        success: false,
        outcome: "BLOCKED",
        summary: "SMT quota exhausted. Task blocked.",
        confidence: 0,
        error: "SMT throttled",
      };
    }

    context.smt.recordUsage("persona_dev.execute");

    try {
      // Build system prompt for Dev persona
      const systemPrompt = `You are NEURABOT Dev persona, responsible for code-related tasks.

Your capabilities:
- Debugging: Identify and fix bugs, analyze error logs, trace execution flow
- Refactoring: Improve code structure, reduce complexity, enhance maintainability
- Testing: Write tests, verify functionality, ensure code quality
- Documentation: Write clear docs, update README, explain code behavior
- Code review: Analyze code for issues, suggest improvements

**EVOLUTION SYSTEM**: Read docs/EVOLUTION_ACCELERATION_GUIDE.md for system management. Quick ref: docs/EVOLUTION_QUICK_REFERENCE.md

Task: ${task.title}
${task.description ? `Description: ${task.description}` : ""}
${task.payload ? `Payload: ${JSON.stringify(task.payload)}` : ""}

${context.identityContext ? `\nUser Context:\n${context.identityContext}` : ""}

**Safety Notes:**
- Use full 5-minute timeout to maximize prompt usage
- Check safety limits if tasks are blocked (memory/queue/concurrent)
- Only 1 build can run at a time - wait if build is active
- Provide clear summary (confidence >= 0.7) for fitness assessment

Execute this task using available tools (browser, web-fetch, web-search, memory, self-modify, etc.).
Provide a clear summary of what you did and the outcome.`;

      const sessionKey = `dev-${task.taskId}-${Date.now()}`;
      const replyText = await runAgentStep({
        sessionKey,
        message: task.description || task.title,
        extraSystemPrompt: systemPrompt,
        timeoutMs: 300_000, // 5 minutes (increased to allow more prompts per task)
        lane: AGENT_LANE_NESTED,
      });

      // Audit log
      await context.audit.log({
        action: "persona_dev_executed",
        details: {
          taskId: task.taskId,
          category: task.category,
          summary: replyText?.substring(0, 200) || "No reply",
        },
      });

      return {
        success: true,
        outcome: "COMPLETED",
        summary: replyText || "Task executed but no reply received",
        confidence: replyText ? 0.8 : 0.5,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await context.audit.log({
        action: "persona_dev_execution_failed",
        details: {
          taskId: task.taskId,
          error: errorMessage,
        },
      });

      return {
        success: false,
        outcome: "ABORTED",
        summary: `Execution failed: ${errorMessage}`,
        confidence: 0,
        error: errorMessage,
      };
    }
  }
}
