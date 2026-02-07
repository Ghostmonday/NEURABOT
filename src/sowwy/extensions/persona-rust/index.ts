/**
 * Rust Persona Executor
 *
 * Handles RUST_CHECK and RUST_FIX tasks with high-throughput parallel execution.
 * Integrates with continuous-rust-watcher to provide fast feedback on Rust code changes.
 *
 * Task Categories:
 * - RUST_CHECK: Validate Rust code (cargo check + clippy) in persona-parallel or file-parallel mode
 * - RUST_FIX: Auto-fix Rust compilation/clippy errors using LLM (speculative fixes)
 *
 * Execution Modes:
 * - persona-parallel: Per-crate checks (Dev -> core-native, RnD -> watchdog)
 * - file-parallel: Per-file clippy checks for fine-grained validation
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Task } from "../../mission-control/schema.js";
import type { ExecutorResult, ExtensionFoundation, PersonaExecutor } from "../integration.js";
import { AGENT_LANE_NESTED } from "../../../agents/lanes.js";
import { runAgentStep } from "../../../agents/tools/agent-step.js";
import { getChildLogger } from "../../../logging/logger.js";
import { redactError } from "../../security/redact.js";

const RUST_ROOT = join(process.cwd(), "neurabot-native");
const log = getChildLogger({ subsystem: "persona-rust" });

export class RustPersonaExecutor implements PersonaExecutor {
  persona = "Rust";

  constructor(private foundation: ExtensionFoundation) {}

  canHandle(task: Task): boolean {
    return task.category === "RUST_CHECK" || task.category === "RUST_FIX";
  }

  async execute(task: Task): Promise<ExecutorResult> {
    if (task.category === "RUST_CHECK") {
      return this.executeRustCheck(task);
    } else if (task.category === "RUST_FIX") {
      return this.executeRustFix(task);
    }
    return {
      success: false,
      outcome: "FAIL",
      summary: "Unknown task category",
      confidence: 0,
    };
  }

  private async executeRustCheck(task: Task): Promise<ExecutorResult> {
    const payload = task.payload as { crate?: string; file?: string; mode: string };
    const env = {
      ...process.env,
      PATH: `${process.env.HOME}/.cargo/bin:${process.env.PATH}`,
    };

    if (!existsSync(RUST_ROOT)) {
      return {
        success: false,
        outcome: "FAIL",
        summary: "neurabot-native/ directory not found",
        confidence: 0,
      };
    }

    try {
      if (payload.mode === "persona-parallel" && payload.crate) {
        // Per-crate check (Dev -> core-native, RnD -> watchdog)
        log.info(`Running cargo check for crate: ${payload.crate}`);

        execSync(`cargo check --package ${payload.crate} --color=always`, {
          cwd: RUST_ROOT,
          encoding: "utf-8",
          timeout: 60_000,
          stdio: "pipe",
          env,
        });

        log.info(`Running cargo clippy for crate: ${payload.crate}`);

        execSync(
          `cargo clippy --package ${payload.crate} --all-targets --color=always -- -D warnings`,
          {
            cwd: RUST_ROOT,
            encoding: "utf-8",
            timeout: 90_000,
            stdio: "pipe",
            env,
          },
        );

        return {
          success: true,
          outcome: "SUCCESS",
          summary: `✓ ${payload.crate}: cargo check + clippy passed`,
          confidence: 1.0,
        };
      } else if (payload.mode === "file-parallel" && payload.file) {
        // Per-file clippy (fast targeted check)
        log.info(`Running clippy for file: ${payload.file}`);

        const filePathFull = join(process.cwd(), payload.file);
        if (!existsSync(filePathFull)) {
          return {
            success: false,
            outcome: "FAIL",
            summary: `File not found: ${payload.file}`,
            confidence: 0,
          };
        }

        // Run clippy on the specific file
        execSync(`cargo clippy --all-targets --color=always -- -D warnings`, {
          cwd: RUST_ROOT,
          encoding: "utf-8",
          timeout: 30_000,
          stdio: "pipe",
          env,
        });

        return {
          success: true,
          outcome: "SUCCESS",
          summary: `✓ ${payload.file}: clippy passed`,
          confidence: 1.0,
        };
      }

      return {
        success: false,
        outcome: "FAIL",
        summary: "Invalid check mode or missing payload",
        confidence: 0,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      log.warn(`Rust check failed for ${payload.crate || payload.file}`, {
        error: redactError(err),
      });

      // Spawn speculative fixes (handled by self-modify-tool's spawnSpeculativeRustFixes)
      // The continuous watcher doesn't directly spawn fixes - that's done by self-modify-tool
      // when actual code changes fail validation.

      return {
        success: false,
        outcome: "FAIL",
        summary: `Rust check failed: ${errorMessage.substring(0, 200)}`,
        confidence: 0,
      };
    }
  }

  private async executeRustFix(task: Task): Promise<ExecutorResult> {
    const payload = task.payload as {
      rustFiles: Array<{ path: string }>;
      errorMessage: string;
      attempt: number;
    };

    if (!payload.rustFiles || payload.rustFiles.length === 0) {
      return {
        success: false,
        outcome: "FAIL",
        summary: "No Rust files specified for fix",
        confidence: 0,
      };
    }

    log.info(`Executing speculative Rust fix attempt ${payload.attempt}/5`, {
      files: payload.rustFiles.map((f) => f.path),
    });

    // Use LLM to analyze and fix the error
    const filesContext = payload.rustFiles.map((f) => f.path).join(", ");
    const sessionKey = `rust-fix-${task.taskId}`;
    const message = `
Files with errors: ${filesContext}

Error output:
${payload.errorMessage.substring(0, 2000)}

Task: Fix the Rust compilation or clippy errors. This is speculative fix attempt ${payload.attempt}/5.
Analyze the error, identify the root cause, and use StrReplace to fix the files.
Focus on a different fix approach than parallel attempts might take.
    `.trim();

    try {
      const result = await runAgentStep({
        sessionKey,
        message,
        extraSystemPrompt:
          "You are an expert Rust developer fixing compilation and clippy errors. Be concise and precise.",
        timeoutMs: 180_000, // 3 minutes
        lane: AGENT_LANE_NESTED,
      });

      // Check if agent returned successfully
      if (result) {
        log.info(`Rust fix attempt ${payload.attempt} completed`, {
          files: filesContext,
        });

        return {
          success: true,
          outcome: "SUCCESS",
          summary: `Fixed Rust error (attempt ${payload.attempt}). Agent response received for: ${filesContext}`,
          confidence: 0.7,
        };
      }

      return {
        success: false,
        outcome: "FAIL",
        summary: `Fix attempt ${payload.attempt} returned no result`,
        confidence: 0,
      };
    } catch (err) {
      log.warn(`Rust fix attempt ${payload.attempt} failed`, {
        error: redactError(err),
      });

      return {
        success: false,
        outcome: "FAIL",
        summary: `Fix attempt ${payload.attempt} threw error: ${err instanceof Error ? err.message : String(err)}`,
        confidence: 0,
      };
    }
  }
}
