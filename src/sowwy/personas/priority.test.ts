import { describe, expect, it } from "vitest";
import {
  canOverride,
  getHighestPriority,
  getPersonaCategory,
  getPersonaPriority,
  getPersonaSkill,
} from "./priority.js";

describe("Persona Priority", () => {
  describe("getPersonaPriority", () => {
    it("should return correct priority for each persona", () => {
      expect(getPersonaPriority("RnD")).toBe(0);
      expect(getPersonaPriority("Dev")).toBe(1);
      expect(getPersonaPriority("ChiefOfStaff")).toBe(2);
      expect(getPersonaPriority("LegalOps")).toBe(3);
    });
  });

  describe("canOverride", () => {
    it("should allow higher priority persona to override lower", () => {
      expect(canOverride("LegalOps", "Dev")).toBe(true);
      expect(canOverride("ChiefOfStaff", "RnD")).toBe(true);
      expect(canOverride("Dev", "LegalOps")).toBe(false);
    });
  });

  describe("getHighestPriority", () => {
    it("should return highest priority persona", () => {
      expect(getHighestPriority(["RnD", "Dev", "LegalOps"])).toBe("LegalOps");
      expect(getHighestPriority(["Dev", "ChiefOfStaff"])).toBe("ChiefOfStaff");
    });
  });

  describe("getPersonaSkill", () => {
    it("should map persona to skill", () => {
      expect(getPersonaSkill("Dev")).toBe("persona-dev");
      expect(getPersonaSkill("LegalOps")).toBe("persona-legal");
      expect(getPersonaSkill("ChiefOfStaff")).toBe("persona-cos");
      expect(getPersonaSkill("RnD")).toBe("persona-rnd");
    });
  });

  describe("getPersonaCategory", () => {
    it("should map persona to category", () => {
      expect(getPersonaCategory("Dev")).toBe("DEV");
      expect(getPersonaCategory("LegalOps")).toBe("LEGAL");
      expect(getPersonaCategory("ChiefOfStaff")).toBe("ADMIN");
      expect(getPersonaCategory("RnD")).toBe("RND");
    });
  });
});
