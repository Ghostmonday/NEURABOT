import { execSync } from "node:child_process";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { writeRestartSentinel } from "../../infra/restart-sentinel.js";
import { requestSelfModifyReload } from "./reload.js";

vi.mock("node:child_process");
vi.mock("../../infra/restart-sentinel.js");

describe("SelfModifyReload", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe("requestSelfModifyReload", () => {
    it("creates restart sentinel with rollback commit", async () => {
      vi.mocked(execSync).mockReturnValue("abc123def456\n");
      vi.mocked(writeRestartSentinel).mockResolvedValue(undefined);

      await requestSelfModifyReload({
        reason: "test",
        modifiedFiles: ["src/foo.ts"],
      });

      expect(execSync).toHaveBeenCalledWith("git rev-parse HEAD", expect.any(Object));
      expect(writeRestartSentinel).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "restart",
          stats: expect.objectContaining({
            before: expect.objectContaining({
              rollbackCommit: "abc123def456",
            }),
          }),
        }),
      );
    });

    it("includes modified files in sentinel", async () => {
      vi.mocked(execSync).mockReturnValue("abc123\n");
      vi.mocked(writeRestartSentinel).mockResolvedValue(undefined);

      await requestSelfModifyReload({
        reason: "test",
        modifiedFiles: ["src/foo.ts", "src/bar.ts"],
      });

      expect(writeRestartSentinel).toHaveBeenCalledWith(
        expect.objectContaining({
          stats: expect.objectContaining({
            before: expect.objectContaining({
              modifiedFiles: ["src/foo.ts", "src/bar.ts"],
            }),
          }),
        }),
      );
    });

    it("handles git rev-parse failure gracefully", async () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error("Not a git repository");
      });
      vi.mocked(writeRestartSentinel).mockResolvedValue(undefined);

      await expect(
        requestSelfModifyReload({
          reason: "test",
          modifiedFiles: [],
        }),
      ).resolves.not.toThrow();

      // Should still write sentinel even if git fails
      expect(writeRestartSentinel).toHaveBeenCalled();
    });

    it("includes reason in sentinel", async () => {
      vi.mocked(execSync).mockReturnValue("abc123\n");
      vi.mocked(writeRestartSentinel).mockResolvedValue(undefined);

      await requestSelfModifyReload({
        reason: "scheduled maintenance",
        modifiedFiles: [],
      });

      expect(writeRestartSentinel).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("scheduled maintenance"),
        }),
      );
    });
  });
});
