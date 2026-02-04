import { describe, expect, it } from "vitest";
import {
  TaskCategory,
  TaskStatus,
  TaskOutcome,
  PersonaOwner,
  calculatePriority,
  validateTaskState,
  isValidTransition,
} from "./schema.js";

describe("Task Schema", () => {
  describe("TaskCategory", () => {
    it("should have all expected categories", () => {
      expect(TaskCategory.DEV).toBe("DEV");
      expect(TaskCategory.LEGAL).toBe("LEGAL");
      expect(TaskCategory.EMAIL).toBe("EMAIL");
      expect(TaskCategory.ADMIN).toBe("ADMIN");
      expect(TaskCategory.RESEARCH).toBe("RESEARCH");
      expect(TaskCategory.RND).toBe("RND");
    });
  });

  describe("TaskStatus", () => {
    it("should have all expected statuses", () => {
      expect(TaskStatus.BACKLOG).toBe("BACKLOG");
      expect(TaskStatus.READY).toBe("READY");
      expect(TaskStatus.IN_PROGRESS).toBe("IN_PROGRESS");
      expect(TaskStatus.BLOCKED).toBe("BLOCKED");
      expect(TaskStatus.WAITING_ON_HUMAN).toBe("WAITING_ON_HUMAN");
      expect(TaskStatus.DONE).toBe("DONE");
    });
  });

  describe("PersonaOwner", () => {
    it("should have all expected personas", () => {
      expect(PersonaOwner.Dev).toBe("Dev");
      expect(PersonaOwner.LegalOps).toBe("LegalOps");
      expect(PersonaOwner.ChiefOfStaff).toBe("ChiefOfStaff");
      expect(PersonaOwner.RnD).toBe("RnD");
    });
  });

  describe("calculatePriority", () => {
    it("should calculate priority correctly", () => {
      const task = {
        taskId: "test-id",
        title: "Test",
        category: TaskCategory.DEV,
        personaOwner: PersonaOwner.Dev,
        status: TaskStatus.READY,
        urgency: 5,
        importance: 5,
        risk: 1,
        stressCost: 1,
        requiresApproval: false,
        approved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "test",
      };
      const priority = calculatePriority(task);
      expect(priority).toBeGreaterThan(0);
      expect(typeof priority).toBe("number");
    });

    it("should handle minimum values", () => {
      const task = {
        taskId: "test-id",
        title: "Test",
        category: TaskCategory.DEV,
        personaOwner: PersonaOwner.Dev,
        status: TaskStatus.READY,
        urgency: 1,
        importance: 1,
        risk: 1,
        stressCost: 1,
        requiresApproval: false,
        approved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "test",
      };
      const priority = calculatePriority(task);
      expect(priority).toBeGreaterThanOrEqual(0);
    });
  });

  describe("validateTaskState", () => {
    it("should validate task with DONE status and outcome", () => {
      const task = {
        taskId: "test-id",
        title: "Test",
        category: TaskCategory.DEV,
        personaOwner: PersonaOwner.Dev,
        status: TaskStatus.DONE,
        outcome: TaskOutcome.COMPLETED,
        decisionSummary: "Completed",
        urgency: 1,
        importance: 1,
        risk: 1,
        stressCost: 1,
        requiresApproval: false,
        approved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "test",
      };
      expect(() => {
        validateTaskState(task);
      }).not.toThrow();
    });

    it("should throw if DONE task lacks outcome", () => {
      const task = {
        taskId: "test-id",
        title: "Test",
        category: TaskCategory.DEV,
        personaOwner: PersonaOwner.Dev,
        status: TaskStatus.DONE,
        urgency: 1,
        importance: 1,
        risk: 1,
        stressCost: 1,
        requiresApproval: false,
        approved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "test",
      };
      expect(() => {
        validateTaskState(task);
      }).toThrow();
    });
  });

  describe("isValidTransition", () => {
    it("should validate valid transitions", () => {
      expect(isValidTransition(TaskStatus.BACKLOG, TaskStatus.READY)).toBe(true);
      expect(isValidTransition(TaskStatus.READY, TaskStatus.IN_PROGRESS)).toBe(true);
      expect(isValidTransition(TaskStatus.READY, TaskStatus.WAITING_ON_HUMAN)).toBe(true);
      expect(isValidTransition(TaskStatus.IN_PROGRESS, TaskStatus.DONE)).toBe(true);
    });

    it("should reject invalid transitions", () => {
      expect(isValidTransition(TaskStatus.BACKLOG, TaskStatus.DONE)).toBe(false);
      expect(isValidTransition(TaskStatus.DONE, TaskStatus.READY)).toBe(false);
    });
  });
});
