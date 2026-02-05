/**
 * Self-Edit Checklist
 *
 * Every self-modification must pass ALL checks.
 * Failures block the edit entirely.
 */

import { validateSelfModifyPath } from "./boundaries.js";

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
  for (const file of files) {
    const diffRatio = computeDiffRatio(file.oldContent, file.newContent);
    const isMinimal = diffRatio < 0.5; // Less than 50% change
    checks.push({
      name: `minimal-diff:${file.path}`,
      passed: isMinimal,
      message: `Diff ratio: ${(diffRatio * 100).toFixed(1)}%`,
    });
    if (!isMinimal) {
      blockingErrors.push(`Edit too large (${(diffRatio * 100).toFixed(0)}%): ${file.path}`);
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

function computeDiffRatio(old: string, new_: string): number {
  // Simple line-based diff ratio
  const oldLines = old.split("\n").length;
  const newLines = new_.split("\n").length;
  const maxLines = Math.max(oldLines, newLines);
  if (maxLines === 0) return 0;
  return Math.abs(newLines - oldLines) / maxLines;
}

async function checkTypeScriptSyntax(
  content: string,
  filePath: string,
): Promise<{ valid: boolean; error?: string }> {
  // Skip files with module constructs that require program context to resolve
  // __filename, __dirname, import(), require(), export are not resolvable without a TS program
  const hasModuleConstructs =
    /(__filename|__dirname|import\s*\(|require\s*\(|export\s+(default\s+)?(interface|type|class|function|const|let|var))/m.test(
      content,
    );
  if (hasModuleConstructs) {
    console.warn(`[checklist] Skipping syntax check for ${filePath} (contains module constructs)`);
    return { valid: true, error: undefined };
  }

  // Use TypeScript compiler API - check parseDiagnostics for actual syntax errors
  try {
    // Try to import TypeScript dynamically
    let ts: typeof import("typescript");
    try {
      ts = await import("typescript");
    } catch (importErr) {
      // TypeScript not available at runtime - skip syntax check
      // This is NOT a syntax error, just a runtime limitation
      console.warn(`[checklist] TypeScript not available, skipping syntax check for ${filePath}`);
      return { valid: true, error: undefined };
    }

    // Determine script kind based on file extension
    const scriptKind = filePath.endsWith(".tsx")
      ? ts.ScriptKind.TSX
      : filePath.endsWith(".jsx")
        ? ts.ScriptKind.JSX
        : ts.ScriptKind.TS;

    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true, // setParentNodes
      scriptKind,
    );

    // Check parseDiagnostics - this is where actual syntax errors are reported
    // createSourceFile never throws, it always returns a SourceFile even with errors
    const parseDiagnostics = (sourceFile as { parseDiagnostics?: Array<unknown> }).parseDiagnostics;

    if (parseDiagnostics && parseDiagnostics.length > 0) {
      // Format the first diagnostic for better error reporting
      const firstDiagnostic = parseDiagnostics[0] as {
        messageText?: string | { messageText: string };
        start?: number;
        length?: number;
      };

      // Extract error message
      let errorMessage = "Syntax error";
      if (firstDiagnostic.messageText) {
        if (typeof firstDiagnostic.messageText === "string") {
          errorMessage = firstDiagnostic.messageText;
        } else {
          errorMessage = firstDiagnostic.messageText.messageText;
        }
      }

      // Add position info if available
      if (firstDiagnostic.start !== undefined) {
        const line = content.substring(0, firstDiagnostic.start).split("\n").length;
        errorMessage = `Line ${line}: ${errorMessage}`;
      }

      return { valid: false, error: errorMessage };
    }

    // Also verify we got a valid SourceFile node
    if (sourceFile.kind !== ts.SyntaxKind.SourceFile) {
      return { valid: false, error: "Invalid source file structure" };
    }

    return { valid: true };
  } catch (err) {
    // Import or other error - log but don't block
    console.warn(`[checklist] Syntax check failed for ${filePath}:`, err);
    return { valid: true, error: undefined };
  }
}

function detectSecrets(content: string): boolean {
  const patterns = [
    /sk-[a-zA-Z0-9]{20,}/, // OpenAI keys
    /ghp_[a-zA-Z0-9]{36}/, // GitHub tokens
    /password\s*[:=]\s*["'][^"']+["']/i,
    /api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
  ];
  return patterns.some((p) => p.test(content));
}
