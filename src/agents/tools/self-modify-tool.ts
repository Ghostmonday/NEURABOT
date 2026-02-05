/**
 * Self-Modification Tool
 *
 * Allows agents to validate and trigger self-modification with safety checks.
 * Agents use this after editing their own code to validate and request reload.
 */

import { Type } from "@sinclair/typebox";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateSelfModifyPath } from "../../sowwy/self-modify/boundaries.js";
import { runSelfEditChecklist } from "../../sowwy/self-modify/checklist.js";
import { requestSelfModifyReload } from "../../sowwy/self-modify/reload.js";
import { stringEnum } from "../schema/typebox.js";
import { type AnyAgentTool, jsonResult, readStringParam } from "./common.js";

const SELF_MODIFY_ACTIONS = ["validate", "reload"] as const;

const SelfModifyToolSchema = Type.Object({
  action: stringEnum(SELF_MODIFY_ACTIONS),
  // validate
  filePath: Type.Optional(Type.String()),
  // reload
  reason: Type.Optional(Type.String()),
  modifiedFiles: Type.Optional(
    Type.Array(
      Type.Object({
        path: Type.String(),
        oldContent: Type.String(),
        newContent: Type.String(),
      }),
    ),
  ),
});

/**
 * Resolves the project root directory for git operations.
 * Priority: 1) OPENCLAW_ROOT env var, 2) Walk up from this file to find package.json, 3) Fallback to cwd
 */
function resolveProjectRoot(fallback: string): string {
  // 1. Check environment variable
  const envRoot = process.env.OPENCLAW_ROOT;
  if (envRoot && existsSync(join(envRoot, "package.json"))) {
    return envRoot;
  }

  // 2. Walk up from this file's directory to find package.json
  try {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    let dir = currentDir;
    for (let i = 0; i < 10; i++) {
      const pkgPath = join(dir, "package.json");
      if (existsSync(pkgPath)) {
        return dir;
      }
      const parent = dirname(dir);
      if (parent === dir) break; // Reached filesystem root
      dir = parent;
    }
  } catch {
    // import.meta.url might not work in all contexts
  }

  // 3. Fallback
  return fallback;
}

export function createSelfModifyTool(opts?: {
  workspaceDir?: string;
  /** Project root directory for git operations (defaults to auto-detected or process.cwd() if not provided) */
  projectDir?: string;
}): AnyAgentTool {
  // Use projectDir for git operations, with smart detection as fallback
  const gitRoot = opts?.projectDir ?? resolveProjectRoot(opts?.workspaceDir ?? process.cwd());

  return {
    label: "Self Modify",
    name: "self_modify",
    description: `Validate and trigger self-modification of agent code with safety checks.

ACTIONS:
- validate: Check if a file path is allowed for self-modification (use before editing)
- reload: Validate edits, capture rollback commit, and request supervised restart

WORKFLOW:
1. Call validate with filePath to check if editing is allowed
2. Make edits using write/edit tools
3. Call reload with modifiedFiles (oldContent + newContent) to trigger restart

SAFETY:
- All files must pass boundary checks (allowlist/denylist)
- Edits must be minimal (< 50% change)
- TypeScript files must parse correctly
- No secrets allowed in code
- Automatic rollback on failure

The reload action will (autonomous, no manual steps):
- Run full validation checklist
- Capture current git commit for rollback
- Build the project so new code is in dist/
- Start watchdog if not running (so gateway comes back)
- Request supervised restart; gateway exits and watchdog restarts it with new code
- If health checks fail, automatic rollback occurs`,
    parameters: SelfModifyToolSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const action = readStringParam(params, "action", { required: true });

      if (action === "validate") {
        const filePath = readStringParam(params, "filePath", { required: true });
        const validation = validateSelfModifyPath(filePath);
        return jsonResult({
          allowed: validation.allowed,
          reason: validation.reason,
          matchedRule: validation.matchedRule,
        });
      }

      if (action === "reload") {
        const reason = readStringParam(params, "reason", { required: true });
        const modifiedFilesRaw = params.modifiedFiles;
        if (!Array.isArray(modifiedFilesRaw) || modifiedFilesRaw.length === 0) {
          throw new Error("modifiedFiles is required and must be a non-empty array");
        }

        const modifiedFiles = modifiedFilesRaw.map((file: unknown) => {
          if (!file || typeof file !== "object") {
            throw new Error("Each modified file must be an object");
          }
          const f = file as Record<string, unknown>;
          return {
            path: readStringParam(f, "path", { required: true }),
            oldContent: readStringParam(f, "oldContent", { required: true }),
            newContent: readStringParam(f, "newContent", { required: true }),
          };
        });

        // Validate all file paths first
        for (const file of modifiedFiles) {
          const validation = validateSelfModifyPath(file.path);
          if (!validation.allowed) {
            return jsonResult({
              ok: false,
              error: `File not allowed: ${file.path} - ${validation.reason}`,
            });
          }
        }

        // Run checklist
        const checklistResult = await runSelfEditChecklist(modifiedFiles);
        if (!checklistResult.passed) {
          return jsonResult({
            ok: false,
            error: "Validation checklist failed",
            checks: checklistResult.checks,
            blockingErrors: checklistResult.blockingErrors,
          });
        }

        // Capture rollback commit - use gitRoot for git operations
        let rollbackCommit: string;
        try {
          rollbackCommit = execSync("git rev-parse HEAD --", {
            encoding: "utf-8",
            cwd: gitRoot,
          }).trim();
        } catch (err) {
          return jsonResult({
            ok: false,
            error: `Failed to capture rollback commit: ${err instanceof Error ? err.message : String(err)}`,
          });
        }

        // Build so restarted gateway loads new code (autonomy: no manual rebuild)
        const buildTimeoutMs = 120_000;
        try {
          execSync("pnpm build", {
            encoding: "utf-8",
            cwd: gitRoot,
            timeout: buildTimeoutMs,
            stdio: "pipe",
          });
        } catch (err) {
          return jsonResult({
            ok: false,
            error: `Build failed before reload: ${err instanceof Error ? err.message : String(err)}. Fix errors and retry.`,
          });
        }

        // Request reload
        const reloadResult = await requestSelfModifyReload({
          reason,
          modifiedFiles: modifiedFiles.map((f) => f.path),
          rollbackCommit,
          validationPassed: true,
        });

        if (!reloadResult.scheduled) {
          return jsonResult({
            ok: false,
            error: reloadResult.error ?? "Failed to schedule reload",
          });
        }

        return jsonResult({
          ok: true,
          message: `Self-modification reload scheduled. Gateway will restart in ~500ms. Rollback commit: ${rollbackCommit}`,
          rollbackCommit,
          modifiedFiles: modifiedFiles.map((f) => f.path),
          checks: checklistResult.checks,
        });
      }

      throw new Error(`Unknown action: ${action}`);
    },
  };
}
