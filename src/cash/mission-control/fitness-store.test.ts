import { beforeEach, describe, expect, it } from "vitest";
import {
  InMemoryFitnessStore,
  registerCoreModules,
  type FitnessStore,
  type ModuleRegistration,
} from "./fitness-store.js";

describe("InMemoryFitnessStore", () => {
  let store: FitnessStore;

  beforeEach(() => {
    store = new InMemoryFitnessStore();
  });

  describe("register", () => {
    it("registers a module with default values", () => {
      store.register({
        moduleName: "test-module",
        correctnessDescription: "Tests pass",
      });

      const record = store.getRecord("test-module");
      expect(record).not.toBeNull();
      expect(record!.moduleName).toBe("test-module");
      expect(record!.status).toBe("unknown");
      expect(record!.consecutiveSuccesses).toBe(0);
      expect(record!.requiredConsecutiveSuccesses).toBe(3);
      expect(record!.maxPromptsPerExecution).toBe(20);
      expect(record!.reAssessmentIntervalHours).toBe(168);
      expect(record!.lastAssessedAt).toBeNull();
      expect(record!.totalAssessments).toBe(0);
      expect(record!.history).toHaveLength(0);
    });

    it("registers a module with custom values", () => {
      store.register({
        moduleName: "custom",
        correctnessDescription: "Custom check",
        requiredConsecutiveSuccesses: 5,
        maxPromptsPerExecution: 10,
        reAssessmentIntervalHours: 72,
      });

      const record = store.getRecord("custom");
      expect(record!.requiredConsecutiveSuccesses).toBe(5);
      expect(record!.maxPromptsPerExecution).toBe(10);
      expect(record!.reAssessmentIntervalHours).toBe(72);
    });

    it("does not overwrite existing records on re-register", () => {
      store.register({ moduleName: "m", correctnessDescription: "first" });
      store.recordAssessment("m", {
        correctness: true,
        reliability: true,
        efficiency: true,
        timestamp: 1000,
      });

      // Re-register should NOT reset the history
      store.register({ moduleName: "m", correctnessDescription: "second" });
      const record = store.getRecord("m");
      expect(record!.totalAssessments).toBe(1);
      expect(record!.correctnessDescription).toBe("first");
    });
  });

  describe("recordAssessment", () => {
    it("tracks consecutive successes", () => {
      store.register({ moduleName: "m", correctnessDescription: "check" });

      store.recordAssessment("m", {
        correctness: true,
        reliability: true,
        efficiency: true,
        timestamp: 1000,
      });

      const record = store.getRecord("m");
      expect(record!.consecutiveSuccesses).toBe(1);
      expect(record!.status).toBe("unstable");
      expect(record!.totalPasses).toBe(1);
    });

    it("reaches stable after 3 consecutive passes (convergence)", () => {
      store.register({ moduleName: "m", correctnessDescription: "check" });

      for (let i = 0; i < 3; i++) {
        store.recordAssessment("m", {
          correctness: true,
          reliability: true,
          efficiency: true,
          timestamp: 1000 + i,
        });
      }

      const record = store.getRecord("m");
      expect(record!.consecutiveSuccesses).toBe(3);
      expect(record!.status).toBe("stable");
      expect(record!.lastStableAt).not.toBeNull();
    });

    it("resets streak on failure (degradation)", () => {
      store.register({ moduleName: "m", correctnessDescription: "check" });

      // Build up to stable
      for (let i = 0; i < 3; i++) {
        store.recordAssessment("m", {
          correctness: true,
          reliability: true,
          efficiency: true,
          timestamp: 1000 + i,
        });
      }
      expect(store.getRecord("m")!.status).toBe("stable");

      // Fail — degradation
      store.recordAssessment("m", {
        correctness: false,
        reliability: true,
        efficiency: true,
        timestamp: 2000,
      });

      const record = store.getRecord("m");
      expect(record!.consecutiveSuccesses).toBe(0);
      expect(record!.status).toBe("failing");
      // lastStableAt should still be set (historical reference)
      expect(record!.lastStableAt).not.toBeNull();
    });

    it("recovers from failing back to stable", () => {
      store.register({ moduleName: "m", correctnessDescription: "check" });

      // Fail first
      store.recordAssessment("m", {
        correctness: false,
        reliability: true,
        efficiency: true,
        timestamp: 1000,
      });
      expect(store.getRecord("m")!.status).toBe("failing");

      // Recover with 3 passes
      for (let i = 0; i < 3; i++) {
        store.recordAssessment("m", {
          correctness: true,
          reliability: true,
          efficiency: true,
          timestamp: 2000 + i,
        });
      }
      expect(store.getRecord("m")!.status).toBe("stable");
    });

    it("auto-registers unknown modules", () => {
      store.recordAssessment("auto-mod", {
        correctness: true,
        reliability: true,
        efficiency: true,
        timestamp: 1000,
      });

      const record = store.getRecord("auto-mod");
      expect(record).not.toBeNull();
      expect(record!.totalAssessments).toBe(1);
    });

    it("caps history at 50 entries", () => {
      store.register({ moduleName: "m", correctnessDescription: "check" });

      for (let i = 0; i < 60; i++) {
        store.recordAssessment("m", {
          correctness: true,
          reliability: true,
          efficiency: true,
          timestamp: i,
        });
      }

      expect(store.getRecord("m")!.history).toHaveLength(50);
    });

    it("counts total passes and failures separately", () => {
      store.register({ moduleName: "m", correctnessDescription: "check" });

      store.recordAssessment("m", {
        correctness: true,
        reliability: true,
        efficiency: true,
        timestamp: 1,
      });
      store.recordAssessment("m", {
        correctness: false,
        reliability: true,
        efficiency: true,
        timestamp: 2,
      });
      store.recordAssessment("m", {
        correctness: true,
        reliability: true,
        efficiency: true,
        timestamp: 3,
      });

      const record = store.getRecord("m");
      expect(record!.totalAssessments).toBe(3);
      expect(record!.totalPasses).toBe(2);
      expect(record!.totalFailures).toBe(1);
    });
  });

  describe("getModulesDueForReassessment", () => {
    it("returns never-assessed modules immediately", () => {
      store.register({ moduleName: "fresh", correctnessDescription: "check" });

      const due = store.getModulesDueForReassessment();
      expect(due).toHaveLength(1);
      expect(due[0].moduleName).toBe("fresh");
    });

    it("returns modules past their interval", () => {
      store.register({
        moduleName: "old",
        correctnessDescription: "check",
        reAssessmentIntervalHours: 1, // 1 hour
      });

      store.recordAssessment("old", {
        correctness: true,
        reliability: true,
        efficiency: true,
        timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      });

      const due = store.getModulesDueForReassessment();
      expect(due).toHaveLength(1);
    });

    it("does not return recently assessed modules", () => {
      store.register({
        moduleName: "recent",
        correctnessDescription: "check",
        reAssessmentIntervalHours: 168,
      });

      store.recordAssessment("recent", {
        correctness: true,
        reliability: true,
        efficiency: true,
        timestamp: Date.now(), // Just now
      });

      const due = store.getModulesDueForReassessment();
      expect(due).toHaveLength(0);
    });
  });

  describe("getModulesByStatus", () => {
    it("filters by status", () => {
      store.register({ moduleName: "a", correctnessDescription: "check" });
      store.register({ moduleName: "b", correctnessDescription: "check" });

      // Make 'a' failing
      store.recordAssessment("a", {
        correctness: false,
        reliability: true,
        efficiency: true,
        timestamp: 1,
      });

      const failing = store.getModulesByStatus("failing");
      expect(failing).toHaveLength(1);
      expect(failing[0].moduleName).toBe("a");

      const unknown = store.getModulesByStatus("unknown");
      expect(unknown).toHaveLength(1);
      expect(unknown[0].moduleName).toBe("b");
    });
  });

  describe("getSummary", () => {
    it("returns correct summary", () => {
      store.register({ moduleName: "a", correctnessDescription: "check" });
      store.register({ moduleName: "b", correctnessDescription: "check" });
      store.register({ moduleName: "c", correctnessDescription: "check" });

      // 'a' → stable
      for (let i = 0; i < 3; i++) {
        store.recordAssessment("a", {
          correctness: true,
          reliability: true,
          efficiency: true,
          timestamp: i,
        });
      }

      // 'b' → failing
      store.recordAssessment("b", {
        correctness: false,
        reliability: true,
        efficiency: true,
        timestamp: 1,
      });

      // 'c' → unknown (never assessed)

      const summary = store.getSummary();
      expect(summary.totalModules).toBe(3);
      expect(summary.stable).toBe(1);
      expect(summary.failing).toBe(1);
      expect(summary.unknown).toBe(1);
      expect(summary.fitnessRatio).toBeCloseTo(1 / 3);
    });

    it("returns zero ratio for empty store", () => {
      const summary = store.getSummary();
      expect(summary.totalModules).toBe(0);
      expect(summary.fitnessRatio).toBe(0);
    });
  });

  describe("registerCoreModules", () => {
    it("registers all core modules", () => {
      registerCoreModules(store);

      const all = store.getAllRecords();
      expect(all.length).toBeGreaterThanOrEqual(8);

      // Verify some known modules
      expect(store.getRecord("scheduler")).not.toBeNull();
      expect(store.getRecord("self-modify")).not.toBeNull();
      expect(store.getRecord("roadmap-observer")).not.toBeNull();
      expect(store.getRecord("rollback")).not.toBeNull();
    });

    it("sets correct intervals for high-risk modules", () => {
      registerCoreModules(store);

      // self-modify and rollback should have shorter intervals
      expect(store.getRecord("self-modify")!.reAssessmentIntervalHours).toBe(72);
      expect(store.getRecord("rollback")!.reAssessmentIntervalHours).toBe(72);

      // scheduler should have weekly
      expect(store.getRecord("scheduler")!.reAssessmentIntervalHours).toBe(168);
    });
  });
});
