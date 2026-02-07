import { execSync } from "node:child_process";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { consumeRestartSentinel } from "../../infra/restart-sentinel.js";
import { checkSelfModifyRollback, type RollbackConfig } from "./rollback.js";

vi.mock("node:child_process");
vi.mock("../../infra/restart-sentinel.js");

describe("SelfModifyRollback", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.OPENCLAW_SELF_MODIFY_ROLLBACK_STRATEGY;
    delete process.env.OPENCLAW_SELF_MODIFY_ROLLBACK_TIMEOUT;
    delete process.env.OPENCLAW_SELF_MODIFY_ROLLBACK_MAX_FAILURES;
    delete process.env.OPENCLAW_SELF_MODIFY_ROLLBACK_DRY_RUN;
  });

  describe("checkSelfModifyRollback", () => {
    it("does nothing if no restart sentinel exists", async () => {
      vi.mocked(consumeRestartSentinel).mockResolvedValue(null);

      const config: RollbackConfig = {
        healthCheckTimeoutMs: 30000,
        maxConsecutiveFailures: 2,
        strategy: "file-scoped",
        dryRun: false,
      };

      await expect(checkSelfModifyRollback(config)).resolves.not.toThrow();
      expect(execSync).not.toHaveBeenCalled();
    });

    it("does not rollback if health check passes", async () => {
      vi.mocked(consumeRestartSentinel).mockResolvedValue({
        kind: "restart",
        status: "ok",
        ts: Date.now(),
        stats: {
          before: {
            rollbackCommit: "abc123",
            modifiedFiles: ["src/foo.ts"],
          },
        },
      });

      // Mock health check to succeed
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true }),
      });

      const config: RollbackConfig = {
        healthCheckTimeoutMs: 1000,
        maxConsecutiveFailures: 2,
        strategy: "file-scoped",
        dryRun: false,
      };

      await checkSelfModifyRollback(config);
      expect(execSync).not.toHaveBeenCalled();
    });

    it("rolls back on health check failure (file-scoped)", async () => {
      vi.mocked(consumeRestartSentinel).mockResolvedValue({
        kind: "restart",
        status: "ok",
        ts: Date.now(),
        stats: {
          before: {
            rollbackCommit: "abc123",
            modifiedFiles: ["src/foo.ts", "src/bar.ts"],
          },
        },
      });

      // Mock health check to fail
      global.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));

      const config: RollbackConfig = {
        healthCheckTimeoutMs: 100,
        maxConsecutiveFailures: 1,
        strategy: "file-scoped",
        dryRun: false,
      };

      vi.mocked(execSync).mockReturnValue("");

      await checkSelfModifyRollback(config);

      // Should call git checkout for each file
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining("git checkout abc123 -- src/foo.ts"),
        expect.any(Object),
      );
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining("git checkout abc123 -- src/bar.ts"),
        expect.any(Object),
      );
    });

    it("rolls back using full-checkout strategy", async () => {
      vi.mocked(consumeRestartSentinel).mockResolvedValue({
        kind: "restart",
        status: "ok",
        ts: Date.now(),
        stats: {
          before: {
            rollbackCommit: "abc123",
          },
        },
      });

      global.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));

      const config: RollbackConfig = {
        healthCheckTimeoutMs: 100,
        maxConsecutiveFailures: 1,
        strategy: "full-checkout",
        dryRun: false,
      };

      vi.mocked(execSync).mockReturnValue("");

      await checkSelfModifyRollback(config);

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining("git checkout abc123"),
        expect.any(Object),
      );
    });

    it("respects dry-run mode", async () => {
      vi.mocked(consumeRestartSentinel).mockResolvedValue({
        kind: "restart",
        status: "ok",
        ts: Date.now(),
        stats: {
          before: {
            rollbackCommit: "abc123",
            modifiedFiles: ["src/foo.ts"],
          },
        },
      });

      global.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));

      const config: RollbackConfig = {
        healthCheckTimeoutMs: 100,
        maxConsecutiveFailures: 1,
        strategy: "file-scoped",
        dryRun: true,
      };

      await checkSelfModifyRollback(config);

      // Should not execute git commands in dry-run
      expect(execSync).not.toHaveBeenCalled();
    });
  });
});
