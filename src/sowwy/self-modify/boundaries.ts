/**
 * Self-Modification Boundaries
 *
 * Defines what files the agent is allowed to modify.
 * This is the ONLY gatekeeper for self-edit operations.
 */

// ============================================================================
// Glob Matcher (consistent with tool-policy pattern matching)
// ============================================================================

type CompiledGlob =
  | { kind: "all" }
  | { kind: "exact"; value: string }
  | { kind: "regex"; value: RegExp };

/**
 * Compile glob pattern to matcher.
 * Supports: * (single segment), ** (recursive), exact paths.
 * Based on src/agents/sandbox/tool-policy.ts pattern matching.
 */
function compileGlob(pattern: string): CompiledGlob {
  const normalized = pattern.trim();
  if (!normalized) return { kind: "exact", value: "" };
  if (normalized === "**" || normalized === "**/*") return { kind: "all" };
  if (!normalized.includes("*")) return { kind: "exact", value: normalized };

  // Convert glob to regex:
  // - ** matches any path segments (including /)
  // - * matches single segment (no /)
  let regexStr = normalized
    .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape regex specials (except *)
    .replace(/\*\*/g, "§DOUBLESTAR§") // Placeholder for **
    .replace(/\*/g, "[^/]*") // * = single segment
    .replace(/§DOUBLESTAR§/g, ".*"); // ** = any path

  return { kind: "regex", value: new RegExp(`^${regexStr}$`) };
}

function matchGlob(filePath: string, pattern: string): boolean {
  const compiled = compileGlob(pattern);
  if (compiled.kind === "all") return true;
  if (compiled.kind === "exact") return filePath === compiled.value;
  return compiled.value.test(filePath);
}

// ============================================================================
// Allowlist / Denylist
// ============================================================================

export const SELF_MODIFY_ALLOW = [
  // Agent logic (own behavior)
  "src/agents/**/*.ts",
  "src/sowwy/**/*.ts",

  // Extension system (pluggable capabilities)
  "extensions/**/*.ts",

  // Documentation (safe to update)
  "docs/**/*.md",

  // Skills (behavior definitions)
  "skills/**/*.md",
  "skills/**/*.ts",

  // Prompts and templates
  "src/**/prompts/**",
  "src/**/templates/**",
] as const;

export const SELF_MODIFY_DENY = [
  // Infrastructure (NEVER touch)
  "src/infra/**",
  "src/gateway/**",
  "src/cli/**",

  // Security (NEVER touch)
  "src/security/**",
  "**/*.env*",
  "**/secrets/**",
  "**/credentials/**",

  // Deployment (NEVER touch)
  "render.yaml",
  "Dockerfile*",
  ".github/**",

  // Package management (requires human)
  "package.json",
  "pnpm-lock.yaml",

  // This file itself (no self-unlocking)
  "src/sowwy/self-modify/boundaries.ts",
] as const;

export interface SelfModifyValidation {
  allowed: boolean;
  reason: string;
  matchedRule?: string;
}

export function validateSelfModifyPath(filePath: string): SelfModifyValidation {
  // Deny rules take precedence
  for (const pattern of SELF_MODIFY_DENY) {
    if (matchGlob(filePath, pattern)) {
      return {
        allowed: false,
        reason: `Blocked by deny rule: ${pattern}`,
        matchedRule: pattern,
      };
    }
  }

  // Check allow rules
  for (const pattern of SELF_MODIFY_ALLOW) {
    if (matchGlob(filePath, pattern)) {
      return {
        allowed: true,
        reason: `Allowed by rule: ${pattern}`,
        matchedRule: pattern,
      };
    }
  }

  return {
    allowed: false,
    reason: "Not in allowlist",
  };
}
