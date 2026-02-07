import { beforeEach, describe, expect, it } from "vitest";
import { SMTThrottler, UNTHROTTLED_OPERATIONS, getMetrics } from "./throttler.js";

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
      // effective limit = floor(5 * 0.8) = 4, so we can do a few then hit limit
      const throttler = new SMTThrottler({
        maxPrompts: 5,
        windowMs: 60000,
      });
      expect(throttler.canProceed("test.operation")).toBe(true);
      // effective limit = floor(5 * 0.8) = 4; use all 4
      throttler.recordUsage("test.operation");
      throttler.recordUsage("test.operation");
      throttler.recordUsage("test.operation");
      throttler.recordUsage("test.operation");
      expect(throttler.canProceed("test.operation")).toBe(false);
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

  describe("getBurstMode", () => {
    it("should return false by default", () => {
      expect(throttler.getBurstMode()).toBe(false);
    });

    it("should return true after enabling burst mode", () => {
      throttler.enableBurstMode();
      expect(throttler.getBurstMode()).toBe(true);
    });

    it("should return false after disabling burst mode", () => {
      throttler.enableBurstMode();
      throttler.disableBurstMode();
      expect(throttler.getBurstMode()).toBe(false);
    });
  });

  describe("getWindowEnd", () => {
    it("should return windowStart + windowMs", () => {
      const windowMs = 60000; // 1 minute
      const customThrottler = new SMTThrottler({ windowMs });
      const state = customThrottler.getState();
      const windowEnd = customThrottler.getWindowEnd();

      expect(windowEnd).toBe(state.windowStart + windowMs);
    });

    it("should use custom windowMs from config", () => {
      const windowMs = 3600000; // 1 hour
      const customThrottler = new SMTThrottler({ windowMs });
      const beforeTime = Date.now();
      const windowEnd = customThrottler.getWindowEnd();
      const afterTime = Date.now();

      // windowEnd should be approximately now + windowMs
      expect(windowEnd).toBeGreaterThanOrEqual(beforeTime + windowMs);
      expect(windowEnd).toBeLessThanOrEqual(afterTime + windowMs);
    });
  });

  describe("getMetrics", () => {
    it("should return correct burstMode state", () => {
      const metrics = getMetrics(throttler);
      expect(metrics.burstMode).toBe(false);

      throttler.enableBurstMode();
      const metricsAfterBurst = getMetrics(throttler);
      expect(metricsAfterBurst.burstMode).toBe(true);
    });

    it("should return accurate windowEnd", () => {
      const windowMs = 60000;
      const customThrottler = new SMTThrottler({ windowMs });
      const state = customThrottler.getState();
      const metrics = getMetrics(customThrottler);

      expect(metrics.windowEnd).toBe(state.windowStart + windowMs);
    });

    it("should return correct utilization and remaining", () => {
      const customThrottler = new SMTThrottler({
        maxPrompts: 100,
        targetUtilization: 0.95,
      });

      // Record 10 operations
      for (let i = 0; i < 10; i++) {
        customThrottler.record("test.op");
      }

      const metrics = getMetrics(customThrottler);
      // utilization = 10 / (100 * 0.95) = 10 / 95 ≈ 0.105
      expect(metrics.utilization).toBeCloseTo(10 / 95, 3);
      // remaining = 95 - 10 = 85
      expect(metrics.remaining).toBe(85);
    });

    it("should return isPaused state correctly", () => {
      const metrics = getMetrics(throttler);
      expect(metrics.isPaused).toBe(false);

      throttler.pause();
      const metricsAfterPause = getMetrics(throttler);
      expect(metricsAfterPause.isPaused).toBe(true);
    });
  });
});
