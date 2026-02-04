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
    if (file.path.endsWith(".ts")) {
      const syntaxOk = await checkTypeScriptSyntax(file.newContent);
      checks.push({
        name: `syntax:${file.path}`,
        passed: syntaxOk,
        message: syntaxOk ? "Valid TypeScript" : "Syntax error",
      });
      if (!syntaxOk) {
        blockingErrors.push(`Syntax error in: ${file.path}`);
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

async function checkTypeScriptSyntax(content: string): Promise<boolean> {
  // Use TypeScript compiler API
  try {
    const ts = await import("typescript");
    const result = ts.createSourceFile("temp.ts", content, ts.ScriptTarget.Latest, true);
    return result.parseDiagnostics?.length === 0;
  } catch {
    return false;
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
