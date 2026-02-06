/**
 * Continuous Self-Modify Extension (README §0.2)
 *
 * When SOWWY_CONTINUOUS_SELF_MODIFY=true, creates recurring SELF_MODIFY tasks
 * so the system runs upgrade/validate cycles until the human says stop
 * (sowwy.pause or SOWWY_KILL_SWITCH).
 */

import fs from "node:fs";
import path from "node:path";
import type { Task } from "../../mission-control/schema.js";
import type {
  ExecutorResult,
  ExtensionFoundation,
  ExtensionLifecycle,
  PersonaExecutor,
} from "../integration.js";
import { AGENT_LANE_NESTED } from "../../../agents/lanes.js";
import { runAgentStep } from "../../../agents/tools/agent-step.js";

const CONTINUOUS_INTERVAL_MS = 5 * 60 * 1000; // 5 min (high-throughput: was 15 min)
const PROJECT_ROOT = process.cwd();

// Persona assignments for multi-persona SELF_MODIFY spread
const PERSONA_ASSIGNMENTS: Array<{
  persona: "Dev" | "RnD" | "ChiefOfStaff" | "LegalOps";
  focus: string;
}> = [
  { persona: "Dev", focus: "code improvements, error handling, TODO fixes" },
  { persona: "RnD", focus: "research new patterns, evaluate dependencies" },
  { persona: "ChiefOfStaff", focus: "documentation, README updates, task coordination" },
  { persona: "LegalOps", focus: "license compliance, security audit" },
];

export class ContinuousSelfModifyExtension implements ExtensionLifecycle {
  private foundation: ExtensionFoundation | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  async initialize(foundation: ExtensionFoundation): Promise<void> {
    this.foundation = foundation;

    const executor = new ContinuousSelfModifyExecutor(foundation);
    foundation.registerPersonaExecutor("Dev", executor);

    if (process.env.SOWWY_CONTINUOUS_SELF_MODIFY === "true") {
      await this.scheduleNextCycle();
      this.intervalId = setInterval(() => {
        this.scheduleNextCycle();
      }, CONTINUOUS_INTERVAL_MS);
      console.log(
        `[ContinuousSelfModify] Enabled: SELF_MODIFY tasks every ${CONTINUOUS_INTERVAL_MS / 60000} min until pause`,
      );
    }
  }

  private async scheduleNextCycle(): Promise<void> {
    const f = this.foundation;
    if (!f) return;
    if (!f.canProceed("continuous_self_modify.schedule")) return; // Paused / kill switch

    const store = f.getTaskStore();
    const PARALLEL_CYCLES = 4; // Create 4 parallel tasks per interval

    // High-throughput: create multiple SELF_MODIFY tasks in parallel across personas
    await Promise.all(
      Array.from({ length: PARALLEL_CYCLES }, (_, i) => {
        const assignment = PERSONA_ASSIGNMENTS[i % PERSONA_ASSIGNMENTS.length];
        return store.create({
          title: `Upgrade & validate cycle #${i + 1} (continuous until stop)`,
          description: `README §0.2: Parallel self-modify cycle. Focus: ${assignment.focus}`,
          category: "SELF_MODIFY",
          personaOwner: assignment.persona,
          urgency: 4,
          importance: 4,
          risk: 2,
          stressCost: 2,
          requiresApproval: false,
          maxRetries: 2,
          dependencies: [],
          contextLinks: {},
          payload: {
            action: "upgrade_validate_cycle",
            source: "continuous-self-modify",
            cycleIndex: i,
            focus: assignment.focus,
          },
          createdBy: "continuous-self-modify",
        });
      }),
    );
  }

  async shutdown(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.foundation = null;
    console.log("[ContinuousSelfModify] Shutdown");
  }

  async tick(): Promise<void> {}
}

class ContinuousSelfModifyExecutor implements PersonaExecutor {
  persona = "Dev";

  constructor(private foundation: ExtensionFoundation) {}

  canHandle(task: Task): boolean {
    // Handle SELF_MODIFY tasks for any persona (multi-persona support)
    return task.category === "SELF_MODIFY";
  }

  async execute(
    task: Task,
    context: {
      identityContext: string;
      smt: { recordUsage(op: string): void };
      audit: { log(entry: { action: string; details: unknown }): Promise<void> };
    },
  ): Promise<ExecutorResult> {
    const isContinuousCycle =
      task.category === "SELF_MODIFY" && task.payload?.action === "upgrade_validate_cycle";

    if (isContinuousCycle) {
      context.smt.recordUsage("continuous_self_modify.cycle");

      try {
        // Real work: invoke agent to analyze and propose improvements
        const sessionKey = `self-modify-${Date.now()}`;
        const prompt = `You are the NEURABOT ${task.personaOwner} persona performing a self-improvement cycle.

Analyze the codebase (src/sowwy/, src/agents/) and identify 1-2 small improvements:
- Fix TODO/FIXME comments
- Add missing error handling
- Improve documentation
- Refactor for clarity

Focus on: ${task.payload?.focus || "general improvements"}

Choose ONE improvement that:
1. Is safe (passes self-modify boundaries)
2. Is minimal (< 50% file diff)
3. Has clear value

Make the edit, then call self_modify with action=validate to check your work.
If validation passes, call self_modify with action=reload to apply changes.

${context.identityContext}`;

        const replyText = await runAgentStep({
          sessionKey,
          message: prompt,
          extraSystemPrompt: `You are NEURABOT ${task.personaOwner} persona. Be concise and surgical in your changes.`,
          timeoutMs: 120_000, // 2 minutes
          lane: AGENT_LANE_NESTED,
        });

        await context.audit.log({
          action: "continuous_self_modify_cycle",
          details: {
            message: "Agent invoked for self-modification",
            sessionKey,
            reply: replyText?.substring(0, 200), // Log first 200 chars
          },
        });

        return {
          success: true,
          outcome: "COMPLETED",
          summary: `Self-modify cycle: ${replyText ? "Agent completed analysis" : "Agent timed out"}`,
          confidence: 0.85,
        };
      } catch (err) {
        await context.audit.log({
          action: "continuous_self_modify_error",
          details: { error: err instanceof Error ? err.message : String(err) },
        });

        return {
          success: false,
          outcome: "EXECUTION_ERROR",
          summary: `Self-modify failed: ${err instanceof Error ? err.message : String(err)}`,
          confidence: 0.5,
          error: String(err),
        };
      }
    }

    return {
      success: true,
      outcome: "COMPLETED",
      summary: `${task.personaOwner} task (stub).`,
      confidence: 0,
    };
  }

  private async analyzeAndProposeImprovements(): Promise<{
    summary: string;
    filesAnalyzed: number;
    improvementsFound: number;
  }> {
    let filesAnalyzed = 0;
    let improvementsFound = 0;
    const improvements: string[] = [];

    try {
      // Scan src/ for TODO, FIXME, XXX comments (potential improvements)
      const srcDir = path.join(PROJECT_ROOT, "src");
      if (fs.existsSync(srcDir)) {
        const files = this.findTypeScriptFiles(srcDir);
        filesAnalyzed = files.length;

        for (const filePath of files.slice(0, 20)) {
          // Limit to 20 files per cycle to avoid overload
          try {
            const content = fs.readFileSync(filePath, "utf-8");
            const todos = this.extractTODOs(content);
            if (todos.length > 0) {
              improvementsFound += todos.length;
              improvements.push(
                `${path.relative(PROJECT_ROOT, filePath)}: ${todos.length} TODO(s)`,
              );
            }
          } catch {
            // Skip files that can't be read
          }
        }
      }
    } catch (err) {
      // Analysis failed, but don't crash the cycle
      console.warn(
        `[ContinuousSelfModify] Analysis error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const summary =
      improvementsFound > 0
        ? `Analyzed ${filesAnalyzed} files, found ${improvementsFound} potential improvements.`
        : `Analyzed ${filesAnalyzed} files. No obvious improvements found.`;

    return { summary, filesAnalyzed, improvementsFound };
  }

  private findTypeScriptFiles(dir: string): string[] {
    const files: string[] = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
          files.push(...this.findTypeScriptFiles(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
          files.push(fullPath);
        }
      }
    } catch {
      // Skip directories that can't be read
    }
    return files;
  }

  private extractTODOs(content: string): string[] {
    const todos: string[] = [];
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/TODO|FIXME|XXX/i.test(line) && !line.trim().startsWith("//")) {
        todos.push(`Line ${i + 1}: ${line.trim().substring(0, 80)}`);
      }
    }
    return todos;
  }
}
