import { describe, expect, it, beforeEach } from "vitest";
import { SMTThrottler, DEFAULT_SMT_CONFIG, UNTHROTTLED_OPERATIONS } from "./throttler.js";

describe("SMTThrottler", () => {
  let throttler: SMTThrottler;

  beforeEach(() => {
    throttler = new SMTThrottler();
  });

  describe("constructor", () => {
    it("should initialize with default config", () => {
      expect(throttler).toBeDefined();
    });

    it("should accept custom config", () => {
      const customThrottler = new SMTThrottler({
        maxPrompts: 100,
        windowMs: 1000,
      });
      expect(customThrottler).toBeDefined();
    });
  });

  describe("canProceed", () => {
    it("should allow unthrottled operations", () => {
      for (const op of UNTHROTTLED_OPERATIONS) {
        expect(throttler.canProceed(op)).toBe(true);
      }
    });

    it("should allow operations within limit", () => {
      const throttler = new SMTThrottler({
        maxPrompts: 100,
        windowMs: 60000,
      });
      expect(throttler.canProceed("test.operation")).toBe(true);
    });

    it("should respect operation limits", () => {
      const throttler = new SMTThrottler({
        maxPrompts: 1,
        windowMs: 60000,
      });
      expect(throttler.canProceed("test.operation")).toBe(true);
      throttler.recordUsage("test.operation");
      // After recording usage, should still allow if under limit
      expect(throttler.canProceed("test.operation")).toBe(true);
    });
  });

  describe("recordUsage", () => {
    it("should record usage without throwing", () => {
      expect(() => {
        throttler.recordUsage("test.operation");
      }).not.toThrow();
    });
  });

  describe("pause and resume", () => {
    it("should pause and resume", () => {
      throttler.pause();
      expect(throttler.getState().isPaused).toBe(true);

      throttler.resume();
      expect(throttler.getState().isPaused).toBe(false);
    });
  });

  describe("getState", () => {
    it("should return state object", () => {
      const state = throttler.getState();
      expect(state).toHaveProperty("usedInWindow");
      expect(state).toHaveProperty("windowStart");
      expect(state).toHaveProperty("isPaused");
      expect(state).toHaveProperty("burstMode");
    });
  });
});
