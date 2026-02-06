/**
 * LegalOps Persona Executor Extension
 *
 * Handles tasks with category LEGAL.
 * Executes compliance, contract review, risk assessment, and legal analysis.
 * All outputs require approval by default.
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

export class PersonaLegalOpsExtension implements ExtensionLifecycle {
  private foundation: ExtensionFoundation | null = null;

  async initialize(foundation: ExtensionFoundation): Promise<void> {
    this.foundation = foundation;
    const executor = new PersonaLegalOpsExecutor(foundation);
    foundation.registerPersonaExecutor("LegalOps", executor);
  }

  async shutdown(): Promise<void> {
    this.foundation = null;
  }

  async tick(): Promise<void> {
    // No periodic work needed
  }
}

class PersonaLegalOpsExecutor implements PersonaExecutor {
  persona = "LegalOps";

  constructor(private foundation: ExtensionFoundation) {}

  canHandle(task: Task): boolean {
    return task.category === "LEGAL";
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
    if (!this.foundation.canProceed("persona_legal.execute")) {
      return {
        success: false,
        outcome: "BLOCKED",
        summary: "SMT quota exhausted. Task blocked.",
        confidence: 0,
        error: "SMT throttled",
      };
    }

    context.smt.recordUsage("persona_legal.execute");

    try {
      // Build system prompt for LegalOps persona
      const systemPrompt = `You are NEURABOT LegalOps persona, responsible for legal compliance and risk management.

Your capabilities:
- Contract analysis: Review contracts, identify key terms, flag risks
- Compliance: Ensure adherence to regulations, policies, and standards
- Risk assessment: Evaluate legal risks, recommend mitigation strategies
- Legal research: Research legal precedents, regulations, and requirements

Task: ${task.title}
${task.description ? `Description: ${task.description}` : ""}
${task.payload ? `Payload: ${JSON.stringify(task.payload)}` : ""}

${context.identityContext ? `\nUser Context:\n${context.identityContext}` : ""}

CRITICAL: All legal outputs require human approval before any action is taken.
Provide analysis, recommendations, and draft responses, but do not execute without approval.

Execute this task using available tools. Provide a clear summary of your analysis and recommendations.`;

      const sessionKey = `legal-${task.taskId}-${Date.now()}`;
      const replyText = await runAgentStep({
        sessionKey,
        message: task.description || task.title,
        extraSystemPrompt: systemPrompt,
        timeoutMs: 120_000, // 2 minutes
        lane: AGENT_LANE_NESTED,
      });

      // Audit log
      await context.audit.log({
        action: "persona_legal_executed",
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
        confidence: replyText ? 0.75 : 0.5, // Lower confidence for legal work
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await context.audit.log({
        action: "persona_legal_execution_failed",
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
