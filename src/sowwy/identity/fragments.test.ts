import { describe, expect, it } from "vitest";
import {
  IdentityCategory,
  FragmentSource,
  type IdentityFragment,
} from "./fragments.js";

describe("Identity Fragments", () => {
  describe("IdentityCategory", () => {
    it("should have exactly 8 categories", () => {
      const categories = Object.values(IdentityCategory);
      expect(categories.length).toBe(8);
    });

    it("should include all required categories", () => {
      expect(IdentityCategory.goal).toBe("goal");
      expect(IdentityCategory.constraint).toBe("constraint");
      expect(IdentityCategory.preference).toBe("preference");
      expect(IdentityCategory.belief).toBe("belief");
      expect(IdentityCategory.risk).toBe("risk");
      expect(IdentityCategory.capability).toBe("capability");
      expect(IdentityCategory.relationship).toBe("relationship");
      expect(IdentityCategory.historical_fact).toBe("historical_fact");
    });
  });

  describe("FragmentSource", () => {
    it("should have expected sources", () => {
      expect(FragmentSource.chat).toBe("chat");
      expect(FragmentSource.email_analysis).toBe("email_analysis");
      expect(FragmentSource.correction).toBe("correction");
    });
  });

  describe("IdentityFragment structure", () => {
    it("should have required fields", () => {
      const fragment: IdentityFragment = {
        id: "test-id",
        category: IdentityCategory.goal,
        content: "Test content that is long enough",
        context: "Test context",
        confidence: 0.8,
        source: FragmentSource.chat,
        createdAt: new Date().toISOString(),
      };

      expect(fragment.id).toBe("test-id");
      expect(fragment.category).toBe(IdentityCategory.goal);
      expect(fragment.content.length).toBeGreaterThan(10);
      expect(fragment.confidence).toBeGreaterThanOrEqual(0);
      expect(fragment.confidence).toBeLessThanOrEqual(1);
    });
  });
});
