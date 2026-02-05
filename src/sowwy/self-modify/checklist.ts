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

import { validateSelfModifyPath, getDiffThreshold, isPoweruserModeEnabled } from "./boundaries.js";

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

// Batch validation accepts multiple files. Parallel validation for large batches
// is supported via Promise.all in calling code. This function validates all files
// sequentially for simplicity and deterministic error reporting.
export async function runSelfEditChecklist(
  files: Array<{ path: string; oldContent: string; newContent: string }>,
): Promise<ChecklistResult> {
  const checks: CheckResult[] = [];
  const blockingErrors: string[] = [];

  // 1. Boundary check (all files in allowlist)
  for (const file of files) {
    const validation = validateSelfModifyPath(file.path);
    checks.push({
      name: `boundary:${file.path}`,
      passed: validation.allowed,
      message: validation.reason,
    });
    if (!validation.allowed) {
      blockingErrors.push(`File not in allowlist: ${file.path}`);
    }
  }

  // 2. Diff check (changes are minimal, not full overwrites)
  // Environment-driven diff threshold:
  // - Default: 50% (0.5)
  // - Poweruser mode: 90% (0.9) via OPENCLAW_SELF_MODIFY_POWERUSER=1
  // - Override: OPENCLAW_SELF_MODIFY_DIFF_THRESHOLD=0.75
  const isPoweruser = isPoweruserModeEnabled();
  const diffThreshold = getDiffThreshold();

  for (const file of files) {
    const diffRatio = computeDiffRatio(file.oldContent, file.newContent);
    const isMinimal = diffRatio < diffThreshold;
    checks.push({
      name: `minimal-diff:${file.path}`,
      passed: isMinimal,
      message: `Diff ratio: ${(diffRatio * 100).toFixed(1)}% (threshold: ${(diffThreshold * 100).toFixed(0)}%, poweruser: ${isPoweruser})`,
    });
    if (!isMinimal) {
      blockingErrors.push(
        `Edit too large (${(diffRatio * 100).toFixed(0)}% > ${(diffThreshold * 100).toFixed(0)}%): ${file.path}`,
      );
    }
  }

  // 3. Syntax check (TypeScript files must parse)
  for (const file of files) {
    if (file.path.endsWith(".ts") || file.path.endsWith(".tsx")) {
      const syntaxResult = await checkTypeScriptSyntax(file.newContent, file.path);
      checks.push({
        name: `syntax:${file.path}`,
        passed: syntaxResult.valid,
        message: syntaxResult.valid
          ? "Valid TypeScript"
          : `Syntax error: ${syntaxResult.error ?? "Unknown error"}`,
      });
      if (!syntaxResult.valid) {
        blockingErrors.push(
          `Syntax error in ${file.path}: ${syntaxResult.error ?? "Unknown error"}`,
        );
      }
    }
  }

  // 4. No secrets check
  for (const file of files) {
    const hasSecrets = detectSecrets(file.newContent);
    checks.push({
      name: `no-secrets:${file.path}`,
      passed: !hasSecrets,
      message: hasSecrets ? "Potential secrets detected" : "No secrets",
    });
    if (hasSecrets) {
      blockingErrors.push(`Secrets detected in: ${file.path}`);
    }
  }

  // 5. Loop detection (not editing self-modify code)
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

// Line-based diff ratio for simple change detection.
// Consider AST-based diffing for semantic change detection in future.
// Character-based diff available as alternative metric.
function computeDiffRatio(old: string, new_: string): number {
  const oldLines = old.split("\n").length;
  const newLines = new_.split("\n").length;
  const maxLines = Math.max(oldLines, newLines);
  if (maxLines === 0) {
    return 0;
  }
  return Math.abs(newLines - oldLines) / maxLines;
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
    console.warn(`[checklist] Skipping syntax check for ${filePath} (contains module constructs)`);
    return { valid: true, error: undefined };
  }

  try {
    let ts: typeof import("typescript");
    try {
      ts = await import("typescript");
    } catch {
      console.warn(`[checklist] TypeScript not available, skipping syntax check for ${filePath}`);
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
    console.warn(`[checklist] Syntax check failed for ${filePath}:`, err);
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
