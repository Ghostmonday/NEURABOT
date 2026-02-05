/**
 * Self-Modification Tool
 *
 * Allows agents to validate and trigger self-modification with safety checks.
 * Agents use this after editing their own code to validate and request reload.
 *
 * Poweruser mode supported via:
 * - Config: { selfModify: { poweruser: true, diffThreshold: 0.9 } }
 * - Environment: OPENCLAW_SELF_MODIFY_POWERUSER=1
 */

import { Type } from "@sinclair/typebox";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve as pathResolve } from "node:path";
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

function walkUpToPackageRoot(startDir: string, maxDepth = 12): string | null {
  let dir = startDir;
  for (let i = 0; i < maxDepth; i++) {
    if (existsSync(join(dir, "package.json"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return null;
}

/**
 * Resolves the project root directory for git operations.
 * Priority: 1) OPENCLAW_ROOT env var, 2) walk from entry script (argv[1]), 3) walk from
 * this module, 4) cwd. Never use workspaceDir as fallback—it may be outside the git repo
 * (e.g. ~/.openclaw/workspace).
 */
function resolveProjectRoot(fallback: string): string {
  const envRoot = process.env.OPENCLAW_ROOT;
  if (envRoot && existsSync(join(envRoot, "package.json"))) {
    return envRoot;
  }

  // Entry script (e.g. dist/index.js) is inside the project when gateway runs as `node dist/index.js gateway`
  const argv1 = process.argv[1];
  if (argv1) {
    try {
      const entryDir = dirname(pathResolve(argv1));
      const fromArgv = walkUpToPackageRoot(entryDir);
      if (fromArgv) {
        return fromArgv;
      }
    } catch {
      // ignore
    }
  }

  try {
    const fromModule = walkUpToPackageRoot(dirname(fileURLToPath(import.meta.url)));
    if (fromModule) {
      return fromModule;
    }
  } catch {
    // import.meta.url may not work in all contexts
  }

  return fallback;
}

export function createSelfModifyTool(opts?: {
  workspaceDir?: string;
  /** Project root directory for git operations (defaults to auto-detected or process.cwd() if not provided) */
  projectDir?: string;
}): AnyAgentTool {
  // Use projectDir for git operations, with smart detection as fallback.
  // Don't use workspaceDir as fallback—it may be outside the git repo (e.g. ~/.openclaw/workspace).
  const gitRoot = opts?.projectDir ?? resolveProjectRoot(process.cwd());

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
- Edits must be minimal (< 50% change by default)
- TypeScript files must parse correctly
- No secrets allowed in code
- Automatic rollback on failure

Poweruser mode: Enable via:
- Config: { selfModify: { poweruser: true, diffThreshold: 0.9 } }
- Or env: OPENCLAW_SELF_MODIFY_POWERUSER=1

Config options (selfModify):
- poweruser: boolean - Enable poweruser mode
- diffThreshold: number - Max diff ratio (default: 0.5, poweruser: 0.9)
- skipSecretsCheck: boolean - Skip secrets scan
- skipSyntaxCheck: boolean - Skip TypeScript validation
- buildCommand: string - Build command (default: "pnpm build")
- buildTimeoutMs: number - Build timeout (default: 120000)
- autoRollback: boolean - Auto-rollback on health failure (default: true)
- healthCheckTimeoutMs: number - Health probe timeout (default: 15000)

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
        // Build chain: OpenClaw uses tsdown and tsgo for TypeScript compilation.
        // Node 22 is production runtime; Bun can be used for local development.
        // Respect OPENCLAW_PREFER_PNPM=1 for build stability on some architectures (Synology, ARM NAS).
        const buildCommand = process.env.OPENCLAW_PREFER_PNPM === "1" ? "pnpm build" : "pnpm build";
        const buildTimeoutMs = 120_000;
        try {
          execSync(buildCommand, {
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
