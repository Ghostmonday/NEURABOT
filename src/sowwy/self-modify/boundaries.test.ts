import { describe, expect, it, vi, beforeEach } from "vitest";
import { checkSelfModifyBoundaries, type SelfModifyBoundaries } from "./boundaries.js";

describe("SelfModifyBoundaries", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.OPENCLAW_SELF_MODIFY_POWERUSER;
    delete process.env.OPENCLAW_SELF_MODIFY_ALLOW_OVERRIDE;
    delete process.env.OPENCLAW_SELF_MODIFY_DIFF_THRESHOLD;
  });

  describe("checkSelfModifyBoundaries", () => {
    it("allows files in allowlist", () => {
      const boundaries: SelfModifyBoundaries = {
        allowlist: ["src/**/*.ts", "package.json"],
        blocklist: [],
        diffThreshold: 0.5,
      };

      expect(checkSelfModifyBoundaries("src/foo.ts", boundaries)).toBe(true);
      expect(checkSelfModifyBoundaries("src/bar/baz.ts", boundaries)).toBe(true);
      expect(checkSelfModifyBoundaries("package.json", boundaries)).toBe(true);
    });

    it("blocks files in blocklist", () => {
      const boundaries: SelfModifyBoundaries = {
        allowlist: ["src/**/*.ts"],
        blocklist: ["src/secret.ts", "**/*.key"],
        diffThreshold: 0.5,
      };

      expect(checkSelfModifyBoundaries("src/secret.ts", boundaries)).toBe(false);
      expect(checkSelfModifyBoundaries("src/config/api.key", boundaries)).toBe(false);
      expect(checkSelfModifyBoundaries("src/foo.ts", boundaries)).toBe(true);
    });

    it("blocks files not in allowlist when allowlist exists", () => {
      const boundaries: SelfModifyBoundaries = {
        allowlist: ["src/**/*.ts"],
        blocklist: [],
        diffThreshold: 0.5,
      };

      expect(checkSelfModifyBoundaries("scripts/foo.sh", boundaries)).toBe(false);
      expect(checkSelfModifyBoundaries("README.md", boundaries)).toBe(false);
    });

    it("allows all files when allowlist is empty and no blocklist", () => {
      const boundaries: SelfModifyBoundaries = {
        allowlist: [],
        blocklist: [],
        diffThreshold: 0.5,
      };

      expect(checkSelfModifyBoundaries("any/file.ts", boundaries)).toBe(true);
    });

    it("checks diff threshold", () => {
      const boundaries: SelfModifyBoundaries = {
        allowlist: ["src/**/*.ts"],
        blocklist: [],
        diffThreshold: 0.5,
      };

      // Mock diff calculation (50% change = 0.5)
      expect(checkSelfModifyBoundaries("src/foo.ts", boundaries, 0.4)).toBe(true);
      expect(checkSelfModifyBoundaries("src/foo.ts", boundaries, 0.6)).toBe(false);
      expect(checkSelfModifyBoundaries("src/foo.ts", boundaries, 0.5)).toBe(true);
    });

    it("respects poweruser mode (higher diff threshold)", () => {
      process.env.OPENCLAW_SELF_MODIFY_POWERUSER = "1";
      const boundaries: SelfModifyBoundaries = {
        allowlist: ["src/**/*.ts"],
        blocklist: [],
        diffThreshold: 0.5,
      };

      // Poweruser mode allows up to 90% changes
      expect(checkSelfModifyBoundaries("src/foo.ts", boundaries, 0.9)).toBe(true);
      expect(checkSelfModifyBoundaries("src/foo.ts", boundaries, 0.95)).toBe(false);
    });

    it("handles glob patterns correctly", () => {
      const boundaries: SelfModifyBoundaries = {
        allowlist: ["src/**/*.ts", "scripts/*.sh"],
        blocklist: [],
        diffThreshold: 0.5,
      };

      expect(checkSelfModifyBoundaries("src/a/b/c.ts", boundaries)).toBe(true);
      expect(checkSelfModifyBoundaries("scripts/build.sh", boundaries)).toBe(true);
      expect(checkSelfModifyBoundaries("scripts/nested/foo.sh", boundaries)).toBe(false);
    });
  });
});
