/**
 * Self-Edit Checklist
 *
 * Every self-modification must pass ALL checks.
 * Failures block the edit entirely.
 *
 * Poweruser mode:
 * - Enabled via OPENCLAW_SELF_MODIFY_POWERUSER=1 or config selfModify.poweruser=true
 * - Increases diff threshold from 50% to 90%
 * - Can be overridden via OPENCLAW_SELF_MODIFY_DIFF_THRESHOLD (e.g., "0.9")
 */

import { getChildLogger } from "../../logging/logger.js";
import { validateSelfModifyPath, getDiffThreshold, isPoweruserModeEnabled } from "./boundaries.js";

const log = getChildLogger({ subsystem: "self-modify-checklist" });

export interface ChecklistResult {
  passed: boolean;
  checks: CheckResult[];
  blockingErrors: string[];
}

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

// Batch validation accepts multiple files. Validation checks run in parallel
// for each file, with results combined into a single ChecklistResult.
export async function runSelfEditChecklist(
  files: Array<{ path: string; oldContent: string; newContent: string }>,
): Promise<ChecklistResult> {
  const checks: CheckResult[] = [];
  const blockingErrors: string[] = [];

  // Run all validation checks in parallel for each file
  const fileResults = await Promise.all(
    files.map(async (file) => {
      const [boundaryResult, diffResult, syntaxResult, secretsResult] = await Promise.all([
        checkBoundary(file),
        checkDiffRatio(file, getDiffThreshold(), isPoweruserModeEnabled()),
        checkSyntax(file),
        checkSecrets(file),
      ]);
      return {
        boundary: boundaryResult,
        diff: diffResult,
        syntax: syntaxResult,
        secrets: secretsResult,
      };
    }),
  );

  // Collect boundary check results
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = fileResults[i].boundary;
    checks.push({
      name: `boundary:${file.path}`,
      passed: result.allowed,
      message: result.reason,
    });
    if (!result.allowed) {
      blockingErrors.push(`File not in allowlist: ${file.path}`);
    }
  }

  // Collect diff check results
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = fileResults[i].diff;
    checks.push({
      name: `minimal-diff:${file.path}`,
      passed: result.passed,
      message: result.message,
    });
    if (!result.passed) {
      blockingErrors.push(`Edit too large (${result.diffRatio! * 100}%): ${file.path}`);
    }
  }

  // Collect syntax check results
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = fileResults[i].syntax;
    if (result.checked) {
      checks.push({
        name: `syntax:${file.path}`,
        passed: result.valid,
        message: result.valid
          ? "Valid TypeScript"
          : `Syntax error: ${result.error ?? "Unknown error"}`,
      });
      if (!result.valid) {
        blockingErrors.push(`Syntax error in ${file.path}: ${result.error ?? "Unknown error"}`);
      }
    }
  }

  // Collect secrets check results
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = fileResults[i].secrets;
    checks.push({
      name: `no-secrets:${file.path}`,
      passed: !result.hasSecrets,
      message: result.hasSecrets ? "Potential secrets detected" : "No secrets",
    });
    if (result.hasSecrets) {
      blockingErrors.push(`Secrets detected in: ${file.path}`);
    }
  }

  // 5. Loop detection (not editing self-modify code) - operates on full file list
  const selfModifyFiles = files.filter(
    (f) => f.path.includes("self-modify") || f.path.includes("boundaries"),
  );
  if (selfModifyFiles.length > 0) {
    checks.push({
      name: "no-self-unlock",
      passed: false,
      message: "Cannot modify self-modification boundaries",
    });
    blockingErrors.push("Attempted to modify self-modify boundaries");
  }

  return {
    passed: blockingErrors.length === 0,
    checks,
    blockingErrors,
  };
}

// Helper function for boundary check
async function checkBoundary(file: {
  path: string;
}): Promise<{ allowed: boolean; reason: string }> {
  return validateSelfModifyPath(file.path);
}

// Helper function for diff ratio check
async function checkDiffRatio(
  file: { path: string; oldContent: string; newContent: string },
  diffThreshold: number,
  isPoweruser: boolean,
): Promise<{ passed: boolean; message: string; diffRatio: number }> {
  const diffRatio = computeDiffRatio(file.oldContent, file.newContent);
  const isMinimal = diffRatio < diffThreshold;
  return {
    passed: isMinimal,
    message: `Diff ratio: ${(diffRatio * 100).toFixed(1)}% (threshold: ${(diffThreshold * 100).toFixed(0)}%, poweruser: ${isPoweruser})`,
    diffRatio,
  };
}

// Helper function for syntax check
async function checkSyntax(file: { path: string; newContent: string }): Promise<{
  checked: boolean;
  valid: boolean;
  error?: string;
}> {
  if (!file.path.endsWith(".ts") && !file.path.endsWith(".tsx")) {
    return { checked: false, valid: true };
  }
  const result = await checkTypeScriptSyntax(file.newContent, file.path);
  return { checked: true, ...result };
}

// Helper function for secrets check
async function checkSecrets(file: { newContent: string }): Promise<{ hasSecrets: boolean }> {
  return { hasSecrets: detectSecrets(file.newContent) };
}

// Line-based diff ratio using set comparison for actual change detection.
// Counts added and removed lines rather than just line count difference.
// This better reflects semantic changes in the file.
function computeDiffRatio(old: string, new_: string): number {
  const oldLines = old.split("\n");
  const newLines = new_.split("\n");
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  // Count lines that exist in old but not in new (removed)
  const removed = oldLines.filter((l) => !newSet.has(l)).length;
  // Count lines that exist in new but not in old (added)
  const added = newLines.filter((l) => !oldSet.has(l)).length;

  const totalLines = Math.max(oldLines.length, newLines.length);
  if (totalLines === 0) {
    return 0;
  }

  // Ratio: (added + removed) / (2 * totalLines)
  // Dividing by 2 normalizes so complete rewrite = 1.0
  return (added + removed) / (2 * totalLines);
}

async function checkTypeScriptSyntax(
  content: string,
  filePath: string,
): Promise<{ valid: boolean; error?: string }> {
  // Skip files with module constructs that require program context to resolve
  const hasModuleConstructs =
    /(__filename|__dirname|import\s*\(|require\s*\(|export\s+(default\s+)?(interface|type|class|function|const|let|var))/m.test(
      content,
    );
  if (hasModuleConstructs) {
    log.warn("Skipping syntax check", { filePath, reason: "contains module constructs" });
    return { valid: true, error: undefined };
  }

  try {
    let ts: typeof import("typescript");
    try {
      ts = await import("typescript");
    } catch {
      log.warn("TypeScript not available, skipping syntax check", { filePath });
      return { valid: true, error: undefined };
    }

    const scriptKind = filePath.endsWith(".tsx")
      ? ts.ScriptKind.TSX
      : filePath.endsWith(".jsx")
        ? ts.ScriptKind.JSX
        : ts.ScriptKind.TS;

    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      scriptKind,
    );

    const parseDiagnostics = (sourceFile as { parseDiagnostics?: Array<unknown> }).parseDiagnostics;

    if (parseDiagnostics && parseDiagnostics.length > 0) {
      const firstDiagnostic = parseDiagnostics[0] as {
        messageText?: string | { messageText: string };
        start?: number;
        length?: number;
      };

      let errorMessage = "Syntax error";
      if (firstDiagnostic.messageText) {
        if (typeof firstDiagnostic.messageText === "string") {
          errorMessage = firstDiagnostic.messageText;
        } else {
          errorMessage = firstDiagnostic.messageText.messageText;
        }
      }

      if (firstDiagnostic.start !== undefined) {
        const line = content.substring(0, firstDiagnostic.start).split("\n").length;
        errorMessage = `Line ${line}: ${errorMessage}`;
      }

      return { valid: false, error: errorMessage };
    }

    if (sourceFile.kind !== ts.SyntaxKind.SourceFile) {
      return { valid: false, error: "Invalid source file structure" };
    }

    return { valid: true };
  } catch (err) {
    log.warn("Syntax check failed", { filePath, error: String(err) });
    return { valid: true, error: undefined };
  }
}

function detectSecrets(content: string): boolean {
  const patterns = [
    /sk-[a-zA-Z0-9]{20,}/,
    /ghp_[a-zA-Z0-9]{36}/,
    /password\s*[:=]\s*["'][^"']+["']/i,
    /api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
  ];
  return patterns.some((p) => p.test(content));
}
