/**
 * RnD Persona Executor Extension
 *
 * Handles tasks with category RESEARCH or RND.
 * Executes research, experimentation, prototyping, and evaluation work.
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

export class PersonaRnDExtension implements ExtensionLifecycle {
  private foundation: ExtensionFoundation | null = null;

  async initialize(foundation: ExtensionFoundation): Promise<void> {
    this.foundation = foundation;
    const executor = new PersonaRnDExecutor(foundation);
    foundation.registerPersonaExecutor("RnD", executor);
  }

  async shutdown(): Promise<void> {
    this.foundation = null;
  }

  async tick(): Promise<void> {
    // No periodic work needed
  }
}

class PersonaRnDExecutor implements PersonaExecutor {
  persona = "RnD";

  constructor(private foundation: ExtensionFoundation) {}

  canHandle(task: Task): boolean {
    return task.category === "RESEARCH" || task.category === "RND";
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
    if (!this.foundation.canProceed("persona_rnd.execute")) {
      return {
        success: false,
        outcome: "BLOCKED",
        summary: "SMT quota exhausted. Task blocked.",
        confidence: 0,
        error: "SMT throttled",
      };
    }

    context.smt.recordUsage("persona_rnd.execute");

    try {
      // Build system prompt for RnD persona
      const systemPrompt = `You are NEURABOT RnD persona, responsible for research and experimentation.

Your capabilities:
- Research: Investigate topics, gather information, analyze findings
- Experimentation: Design experiments, test hypotheses, evaluate results
- Prototyping: Build prototypes, explore new approaches, validate concepts
- Evaluation: Assess technologies, compare options, recommend solutions

**EVOLUTION SYSTEM**: Read docs/EVOLUTION_ACCELERATION_GUIDE.md for system management. Quick ref: docs/EVOLUTION_QUICK_REFERENCE.md

Task: ${task.title}
${task.description ? `Description: ${task.description}` : ""}
${task.payload ? `Payload: ${JSON.stringify(task.payload)}` : ""}

${context.identityContext ? `\nUser Context:\n${context.identityContext}` : ""}

**Safety Notes:**
- Use full 10-minute timeout (research can take longer)
- Make extensive tool calls (web-search, web-fetch) to maximize prompt usage
- Check safety limits if tasks are blocked
- Provide clear summary (confidence >= 0.7) for fitness assessment

Use web-search and web-fetch tools extensively to gather information.
Provide comprehensive research findings, analysis, and recommendations.

Execute this task using available tools. Provide a clear summary of your research and findings.`;

      const sessionKey = `rnd-${task.taskId}-${Date.now()}`;
      const replyText = await runAgentStep({
        sessionKey,
        message: task.description || task.title,
        extraSystemPrompt: systemPrompt,
        timeoutMs: 600_000, // 10 minutes (research can take longer, increased for more prompts)
        lane: AGENT_LANE_NESTED,
      });

      // Audit log
      await context.audit.log({
        action: "persona_rnd_executed",
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
        action: "persona_rnd_execution_failed",
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
