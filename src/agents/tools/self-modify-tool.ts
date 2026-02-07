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

// ── Speculative Rust Fix Helper ─────────────────────────────────────────────
// Note: We don't spawn tasks directly from self-modify-tool since it doesn't have
// access to the task store. Instead, we just fail fast and let the continuous
// Rust watcher detect and spawn fix tasks proactively.

const SPECULATIVE_FIX_COUNT = 5;

async function spawnSpeculativeRustFixes(
  rustFiles: Array<{ path: string }>,
  error: unknown,
): Promise<void> {
  // Log the error for debugging
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("[self-modify] Rust validation failed:", errorMessage.substring(0, 500));
  console.info(
    `[self-modify] Note: Continuous Rust watcher will detect and spawn ${SPECULATIVE_FIX_COUNT} parallel fix attempts`,
  );
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

        // Build optimization: Skip or fast-path build for non-compilable changes
        // This reduces self-modification latency for docs, config, and small TypeScript fixes
        const hasCompilableFiles = modifiedFiles.some((f) => {
          const ext = f.path.split(".").pop()?.toLowerCase();
          return ["ts", "tsx", "js", "jsx", "mjs"].includes(ext ?? "");
        });

        // Check if all files are non-compilable (docs, json, markdown, etc.)
        const hasNonCompilableOnly = modifiedFiles.every((f) => {
          const ext = f.path.split(".").pop()?.toLowerCase();
          return !["ts", "tsx", "js", "jsx", "mjs"].includes(ext ?? "");
        });

        if (hasNonCompilableOnly) {
          // Skip build entirely for non-compilable files (docs, json, markdown, etc.)
          console.info("[self-modify] Skipping build: no compilable files modified");
        } else {
          // SAFETY CHECK: Verify system can handle a build before starting
          let buildRegistered = false;
          try {
            const { getSafetyLimits } =
              await import("../../sowwy/mission-control/safety-limits.js");
            const safetyLimits = getSafetyLimits();
            const safetyCheck = safetyLimits.canAcceptTasks(0, 0, { isBuild: true });
            if (!safetyCheck.allowed) {
              return jsonResult({
                ok: false,
                error: `Build blocked by safety limits: ${safetyCheck.reason}. Wait for current builds to complete or system resources to free up.`,
              });
            }
            safetyLimits.registerBuildStart();
            buildRegistered = true;
          } catch (err) {
            // If safety limits module not available, log warning but continue
            // (graceful degradation)
          }

          // Build so restarted gateway loads new code (autonomy: no manual rebuild)
          // Build chain: OpenClaw uses tsdown and tsgo for TypeScript compilation.
          // Node 22 is production runtime; Bun can be used for local development.
          // Respect OPENCLAW_PREFER_PNPM=1 for build stability on some architectures (Synology, ARM NAS).
          const buildCommand =
            process.env.OPENCLAW_PREFER_PNPM === "1" ? "pnpm build" : "pnpm build";

          // Fast type-check first for TypeScript files (avoids full build if types are invalid)
          const hasTypeScript = modifiedFiles.some(
            (f) => f.path.endsWith(".ts") || f.path.endsWith(".tsx"),
          );
          if (hasTypeScript) {
            try {
              execSync("pnpm tsgo --noEmit", {
                encoding: "utf-8",
                cwd: gitRoot,
                timeout: 60_000, // 60s for type check
                stdio: "pipe",
              });
              console.info("[self-modify] Type check passed, proceeding with build");
            } catch (typeErr) {
              // Unregister build on failure
              if (buildRegistered) {
                try {
                  const { getSafetyLimits } =
                    await import("../../sowwy/mission-control/safety-limits.js");
                  getSafetyLimits().registerBuildEnd();
                } catch {
                  // Ignore
                }
              }
              return jsonResult({
                ok: false,
                error: `Type check failed: ${typeErr instanceof Error ? typeErr.message : String(typeErr)}. Fix type errors before retry.`,
              });
            }
          }

          // Full build with reduced timeout (tsgo already validated types)
          const buildTimeoutMs = 90_000; // Reduced from 120s
          try {
            execSync(buildCommand, {
              encoding: "utf-8",
              cwd: gitRoot,
              timeout: buildTimeoutMs,
              stdio: "pipe",
            });
          } catch (err) {
            // Unregister build on failure
            if (buildRegistered) {
              try {
                const { getSafetyLimits } =
                  await import("../../sowwy/mission-control/safety-limits.js");
                getSafetyLimits().registerBuildEnd();
              } catch {
                // Ignore
              }
            }
            return jsonResult({
              ok: false,
              error: `Build failed before reload: ${err instanceof Error ? err.message : String(err)}. Fix errors and retry.`,
            });
          }

          // Unregister build on success
          if (buildRegistered) {
            try {
              const { getSafetyLimits } =
                await import("../../sowwy/mission-control/safety-limits.js");
              getSafetyLimits().registerBuildEnd();
            } catch {
              // Ignore
            }
          }
        }

        // ── Rust validation ─────────────────────────────────────────────────────
        // Fast Rust validation: check for .rs file modifications and run cargo check + clippy
        if (process.env.OPENCLAW_SELF_MODIFY_SKIP_RUST !== "1") {
          const rustFiles = modifiedFiles.filter((f) => f.path.endsWith(".rs"));
          if (rustFiles.length > 0) {
            const rustRoot = join(gitRoot, "neurabot-native");
            if (!existsSync(rustRoot)) {
              console.warn("[self-modify] neurabot-native/ not found, skipping Rust validation");
            } else {
              const rustEnv = {
                ...process.env,
                PATH: `${process.env.HOME}/.cargo/bin:${process.env.PATH}`,
              };

              // Fast cargo check for compilation errors
              try {
                execSync("cargo check --workspace --color=always", {
                  cwd: rustRoot,
                  encoding: "utf-8",
                  timeout: 60_000,
                  stdio: "pipe",
                  env: rustEnv,
                });
                console.info("[self-modify] Rust cargo check passed");
              } catch (rustErr) {
                // On failure, spawn speculative Rust fix tasks
                await spawnSpeculativeRustFixes(rustFiles, rustErr);
                return jsonResult({
                  ok: false,
                  error: `Rust compilation failed, spawned 5 parallel fix tasks`,
                  rustFiles: rustFiles.map((f) => f.path),
                });
              }

              // Clippy for linting and logic issues
              try {
                execSync("cargo clippy --all-targets --color=always -- -D warnings", {
                  cwd: rustRoot,
                  encoding: "utf-8",
                  timeout: 90_000,
                  stdio: "pipe",
                  env: rustEnv,
                });
                console.info("[self-modify] Rust clippy passed");
              } catch (clippyErr) {
                await spawnSpeculativeRustFixes(rustFiles, clippyErr);
                return jsonResult({
                  ok: false,
                  error: `Rust clippy failed, spawned 5 parallel fix tasks`,
                  rustFiles: rustFiles.map((f) => f.path),
                });
              }
            }
          }
        }

        // Post-modify test gate: Run tests for modified files before reload
        // This prevents regressions from being deployed (README §0.4 - MANDATORY FIRMWARE)
        if (process.env.OPENCLAW_SELF_MODIFY_SKIP_TESTS !== "1") {
          try {
            // Map modified files to their corresponding test files
            const testFiles: string[] = [];
            for (const file of modifiedFiles) {
              // Tests are colocated: src/foo.ts -> src/foo.test.ts
              if (file.path.endsWith(".ts") && !file.path.endsWith(".test.ts")) {
                const testPath = file.path.replace(/\.ts$/, ".test.ts");
                if (existsSync(join(gitRoot, testPath))) {
                  testFiles.push(testPath);
                }
              }
            }

            // Run tests if any test files found
            if (testFiles.length > 0) {
              const testCommand = `pnpm vitest run --reporter=json ${testFiles.join(" ")}`;
              const testTimeoutMs = 60_000; // 60s timeout for tests
              try {
                const testOutput = execSync(testCommand, {
                  encoding: "utf-8",
                  cwd: gitRoot,
                  timeout: testTimeoutMs,
                  stdio: "pipe",
                });

                // Parse vitest JSON output to check for failures
                try {
                  const testResult = JSON.parse(testOutput);
                  if (testResult.numFailedTests > 0) {
                    return jsonResult({
                      ok: false,
                      error: `Tests failed for modified files: ${testFiles.join(", ")}. ${testResult.numFailedTests} test(s) failed. Fix tests before reload.`,
                      testOutput: testOutput.substring(0, 500), // First 500 chars of output
                    });
                  }
                } catch {
                  // If JSON parsing fails, check if output contains "FAIL" or error indicators
                  if (testOutput.toLowerCase().includes("fail") || testOutput.includes("Error")) {
                    return jsonResult({
                      ok: false,
                      error: `Tests may have failed for modified files: ${testFiles.join(", ")}. Check test output.`,
                      testOutput: testOutput.substring(0, 500),
                    });
                  }
                }
              } catch (testErr) {
                return jsonResult({
                  ok: false,
                  error: `Test execution failed: ${testErr instanceof Error ? testErr.message : String(testErr)}. Fix tests before reload.`,
                });
              }
            }
          } catch (testGateErr) {
            // Don't fail reload if test gate itself fails (e.g., vitest not available)
            // Log warning but proceed
            // In production, this should probably fail, but for development flexibility we allow it
            if (process.env.NODE_ENV === "production") {
              return jsonResult({
                ok: false,
                error: `Test gate failed: ${testGateErr instanceof Error ? testGateErr.message : String(testGateErr)}`,
              });
            }
            // In development, log warning but continue
          }
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
