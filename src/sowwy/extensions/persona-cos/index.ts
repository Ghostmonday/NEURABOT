/**
 * ChiefOfStaff Persona Executor Extension
 *
 * Handles tasks with category EMAIL, ADMIN, or MISSION_CONTROL.
 * Executes coordination, communication, scheduling, and administrative work.
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

export class PersonaChiefOfStaffExtension implements ExtensionLifecycle {
  private foundation: ExtensionFoundation | null = null;

  async initialize(foundation: ExtensionFoundation): Promise<void> {
    this.foundation = foundation;
    const executor = new PersonaChiefOfStaffExecutor(foundation);
    foundation.registerPersonaExecutor("ChiefOfStaff", executor);
  }

  async shutdown(): Promise<void> {
    this.foundation = null;
  }

  async tick(): Promise<void> {
    // No periodic work needed
  }
}

class PersonaChiefOfStaffExecutor implements PersonaExecutor {
  persona = "ChiefOfStaff";

  constructor(private foundation: ExtensionFoundation) {}

  canHandle(task: Task): boolean {
    return (
      task.category === "EMAIL" || task.category === "ADMIN" || task.category === "MISSION_CONTROL"
    );
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
    if (!this.foundation.canProceed("persona_cos.execute")) {
      return {
        success: false,
        outcome: "BLOCKED",
        summary: "SMT quota exhausted. Task blocked.",
        confidence: 0,
        error: "SMT throttled",
      };
    }

    context.smt.recordUsage("persona_cos.execute");

    try {
      // Build system prompt for ChiefOfStaff persona
      const systemPrompt = `You are NEURABOT ChiefOfStaff persona, responsible for coordination and administration.

Your capabilities:
- Email: Draft professional emails, manage correspondence, prioritize messages
- Scheduling: Coordinate calendars, set up meetings, manage appointments
- Communication: Facilitate inter-persona coordination, summarize status updates
- Administration: Handle routine tasks, manage workflows, track progress

Task: ${task.title}
${task.description ? `Description: ${task.description}` : ""}
${task.payload ? `Payload: ${JSON.stringify(task.payload)}` : ""}

${context.identityContext ? `\nUser Context:\n${context.identityContext}` : ""}

IMPORTANT: All email sends and high-risk actions require approval. Draft content and request approval before sending.

Execute this task using available tools. Provide a clear summary of what you did and the outcome.`;

      const sessionKey = `cos-${task.taskId}-${Date.now()}`;
      const replyText = await runAgentStep({
        sessionKey,
        message: task.description || task.title,
        extraSystemPrompt: systemPrompt,
        timeoutMs: 120_000, // 2 minutes
        lane: AGENT_LANE_NESTED,
      });

      // Audit log
      await context.audit.log({
        action: "persona_cos_executed",
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
        action: "persona_cos_execution_failed",
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
