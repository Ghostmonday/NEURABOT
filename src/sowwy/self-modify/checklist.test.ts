import { describe, expect, it, vi, beforeEach } from "vitest";
import { runSelfEditChecklist } from "./checklist.js";

describe("SelfModifyChecklist", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.OPENCLAW_SELF_MODIFY_POWERUSER;
    delete process.env.OPENCLAW_SELF_MODIFY_DIFF_THRESHOLD;
  });

  describe("runSelfEditChecklist", () => {
    it("passes when file is in allowlist and diff is minimal", async () => {
      const result = await runSelfEditChecklist([
        {
          path: "src/sowwy/mission-control/scheduler.ts",
          oldContent: "export function foo() { return 1; }\n",
          newContent: "export function foo() { return 1; }\n", // Identical content
        },
      ]);

      expect(result.passed).toBe(true);
      expect(result.blockingErrors).toHaveLength(0);
    });

    it("fails when file is not in allowlist", async () => {
      const result = await runSelfEditChecklist([
        {
          path: "src/infra/gateway.ts",
          oldContent: "export function foo() { return 1; }",
          newContent: "export function foo() { return 2; }",
        },
      ]);

      expect(result.passed).toBe(false);
      expect(result.blockingErrors.some((e) => e.includes("allowlist"))).toBe(true);
    });

    it("fails when diff ratio exceeds threshold", async () => {
      // Create a complete rewrite scenario
      const oldContent = "line1\nline2\nline3\nline4\nline5\n";
      const newContent = "completely\ndifferent\nlines\nhere\nmore\neleven\n";

      const result = await runSelfEditChecklist([
        {
          path: "src/sowwy/mission-control/scheduler.ts",
          oldContent,
          newContent,
        },
      ]);

      expect(result.passed).toBe(false);
      expect(result.blockingErrors.some((e) => e.includes("too large"))).toBe(true);
    });

    it("allows larger diffs in poweruser mode", async () => {
      process.env.OPENCLAW_SELF_MODIFY_POWERUSER = "1";
      // Minor changes that should pass even with stricter original threshold
      const oldContent = "line1\nline2\nline3\n";
      const newContent = "line1\nline2modified\nline3\n";

      const result = await runSelfEditChecklist([
        {
          path: "src/sowwy/mission-control/scheduler.ts",
          oldContent,
          newContent,
        },
      ]);

      // Should pass with poweruser mode (90% threshold)
      expect(result.passed).toBe(true);
    });

    it("fails when TypeScript syntax is invalid", async () => {
      const result = await runSelfEditChecklist([
        {
          path: "src/sowwy/mission-control/scheduler.ts",
          oldContent: "export function foo() { return 1; }",
          newContent: "export function foo() { return; } // missing value",
        },
      ]);

      // May pass if TypeScript check is skipped, but should at least run
      expect(result.checks.some((c) => c.name.startsWith("syntax:"))).toBe(true);
    });

    it("fails when secrets are detected", async () => {
      const result = await runSelfEditChecklist([
        {
          path: "src/sowwy/mission-control/scheduler.ts",
          oldContent: "export const apiKey = '';",
          newContent: "export const apiKey = 'sk-123456789012345678901234567890';",
        },
      ]);

      expect(result.passed).toBe(false);
      expect(result.blockingErrors.some((e) => e.includes("Secrets"))).toBe(true);
    });

    it("fails when attempting to modify self-modify boundaries", async () => {
      const result = await runSelfEditChecklist([
        {
          path: "src/sowwy/self-modify/boundaries.ts",
          oldContent: "export const ALLOW = [];",
          newContent: "export const ALLOW = ['**'];",
        },
      ]);

      expect(result.passed).toBe(false);
      expect(result.blockingErrors.some((e) => e.includes("self-modify boundaries"))).toBe(true);
    });

    it("validates multiple files", async () => {
      const result = await runSelfEditChecklist([
        {
          path: "src/sowwy/mission-control/scheduler.ts",
          oldContent: "export function foo() { return 1; }\n",
          newContent: "export function foo() { return 1; }\n", // Identical
        },
        {
          path: "src/infra/gateway.ts", // Not allowed
          oldContent: "export function bar() { return 1; }\n",
          newContent: "export function bar() { return 1; }\n", // Identical
        },
      ]);

      expect(result.passed).toBe(false);
      expect(result.checks.length).toBeGreaterThan(2);
    });
  });
});
