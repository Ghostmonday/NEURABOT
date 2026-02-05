/**
 * Sowwy Identity Model - Fragment Schema Foundation
 *
 * ⚠️ IDENTITY INTEGRITY CRITICAL:
 * - 8 categories are LOCKED - do not add more
 * - Fewer buckets = higher signal = better retrieval
 * - More categories = fragmentation = worse context
 *
 * ⚠️ WRITE ACCESS RULE (NON-NEGOTIABLE):
 * Only the Identity Extraction Pipeline may write identity fragments.
 * Personas, skills, agents, and tools are READ-ONLY.
 *
 * WHY THIS MATTERS:
 * - Self-hallucinated identity: If personas could write, they would
 *   gradually create an identity that makes their job easier, not accurate.
 * - Slow corruption: A little bit of drift each day adds up to
 *   a completely different "you" in a year.
 * - Feedback loops: Personas optimizing for success might prefer
 *   fragments that make their tasks easier.
 *
 * ENFORCEMENT:
 * - Runtime check: throw if write attempted from wrong module
 * - No exceptions, no "just this once", no emergencies that justify it
 *
 * ⚠️ CATEGORY DEFINITIONS (don't loosen these):
 * - goal: What you want to achieve (outcomes)
 * - constraint: Hard limits, non-negotiables (boundaries)
 * - preference: Soft preferences, style choices (comfort)
 * - belief: Values, stances, worldview (principles)
 * - risk: Known risks, fears, concerns (vulnerabilities)
 * - capability: Skills, strengths, resources (abilities)
 * - relationship: People, organizations, dynamics (connections)
 * - historical_fact: Past events, experiences (lessons)
 */

// ============================================================================
// LOCKED Categories (do not add/merge - fewer buckets = higher signal)
// ============================================================================

/**
 * ⚠️ DON'T ADD CATEGORIES.
 * The temptation will be to add "hobbies" or "projects" or "likes".
 * Don't. Put them in existing categories:
 * - hobbies → preference
 * - projects → goal or capability
 * - likes → preference
 * - dislikes → constraint or risk
 */
export const IdentityCategory = {
  goal: "goal", // What you want to achieve
  constraint: "constraint", // Hard limits, non-negotiables
  preference: "preference", // Soft preferences, style choices
  belief: "belief", // Values, stances, worldview
  risk: "risk", // Known risks, fears, concerns
  capability: "capability", // Skills, strengths, resources
  relationship: "relationship", // People, organizations, dynamics
  historical_fact: "historical_fact", // Past events, experiences
} as const;

export type IdentityCategory = (typeof IdentityCategory)[keyof typeof IdentityCategory];

// ============================================================================
// Fragment Source Enum
// ============================================================================

export const FragmentSource = {
  chat: "chat",
  email_analysis: "email_analysis",
  correction: "correction",
} as const;

export type FragmentSource = (typeof FragmentSource)[keyof typeof FragmentSource];

// ============================================================================
// Identity Fragment Schema
// ============================================================================

export const IdentityFragmentSchema = {
  id: { type: "string", format: "uuid" },
  // LOCKED: 8 categories only - do not expand
  category: {
    type: "string",
    enum: Object.values(IdentityCategory),
  },
  content: { type: "string", minLength: 10, maxLength: 5000 },
  context: { type: "string", maxLength: 2000 },
  confidence: { type: "number", minimum: 0, maximum: 1 },
  source: { type: "string", enum: Object.values(FragmentSource) },
  metadata: {
    type: "object",
    properties: {
      originalMessage: { type: "string" },
      extractionModel: { type: "string" },
      reviewedByHuman: { type: "boolean" },
    },
  },
  createdAt: { type: "string", format: "date-time" },
  embedding: { type: "array", items: { type: "number" } }, // Vector embedding
};

export interface IdentityFragment {
  id: string;
  category: IdentityCategory;
  content: string;
  context: string;
  confidence: number;
  source: FragmentSource;
  metadata?: {
    originalMessage?: string;
    extractionModel?: string;
    reviewedByHuman?: boolean;
  };
  createdAt: string;
  embedding?: number[];
}

// ============================================================================
// Identity Write Rule (NON-NEGOTIABLE)
// ============================================================================

/**
 * CRITICAL INVARIANT:
 * Only the Identity Extraction Pipeline may write identity fragments.
 * Personas, skills, agents, and tools are READ-ONLY.
 *
 * This prevents:
 * - Self-hallucinated identity
 * - Slow corruption of who you are
 * - Feedback loops that drift from truth
 *
 * Violations of this rule should throw, not warn.
 */

// ============================================================================
// Fragment Extraction Result
// ============================================================================

export interface FragmentExtractionResult {
  fragments: IdentityFragment[];
  contradictions: IdentityContradiction[];
  newInformation: boolean;
}

export interface IdentityContradiction {
  existingFragmentId: string;
  newFragmentId: string;
  existingContent: string;
  newContent: string;
  severity: "high" | "medium" | "low";
}

// ============================================================================
// Semantic Search Options
// ============================================================================

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  categories?: IdentityCategory[];
}

export interface SearchResult {
  fragment: IdentityFragment;
  score: number;
}
