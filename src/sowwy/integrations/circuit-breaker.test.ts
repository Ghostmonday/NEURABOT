import { describe, expect, it, beforeEach } from "vitest";
import { CircuitBreaker } from "./circuit-breaker.js";

describe("CircuitBreaker", () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(
      async () => "success",
      {
        failureThreshold: 3,
        cooldownMs: 1000,
      }
    );
  });

  describe("constructor", () => {
    it("should initialize with default state CLOSED", () => {
      const state = circuitBreaker.getState();
      expect(state.state).toBe("CLOSED");
      expect(state.failures).toBe(0);
    });
  });

  describe("execute", () => {
    it("should execute successful operation", async () => {
      const breaker = new CircuitBreaker(async () => "success");
      const result = await breaker.execute<string>();
      expect(result).toBe("success");
      expect(breaker.getState().state).toBe("CLOSED");
    });

    it("should track failures", async () => {
      const breaker = new CircuitBreaker(async () => {
        throw new Error("test error");
      });
      try {
        await breaker.execute();
      } catch (e) {
        expect(e).toBeDefined();
      }
      const state = breaker.getState();
      expect(state.failures).toBeGreaterThan(0);
    });
  });

  describe("getState", () => {
    it("should return current state", () => {
      const state = circuitBreaker.getState();
      expect(state).toHaveProperty("state");
      expect(state).toHaveProperty("failures");
      expect(["CLOSED", "OPEN", "HALF_OPEN"]).toContain(state.state);
    });
  });
});
