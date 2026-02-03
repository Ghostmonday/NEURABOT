/**
 * Sowwy Persona Priority System
 * 
 * ⚠️ EXECUTION ORDER (never change this):
 * RnD (0) → Dev (1) → ChiefOfStaff (2) → LegalOps (3)
 * 
 * WHY THIS ORDER MATTERS:
 * - LegalOps OVERRIDES Dev: Compliance > shipping deadlines
 * - ChiefOfStaff DEFIES ANYTHING: Scheduling authority
 * - RnD NEVER BLOCKS: Experiments don't stop production
 * 
 * ⚠️ COMMON MISTAKE: "What if LegalOps is slow?"
 * Answer: Tasks wait. Compliance delays are intentional.
 * Don't add "urgent legal" bypasses - that defeats the purpose.
 * 
 * ⚠️ ANTI-PATTERNS TO AVOID:
 * - Priority inversion: Lower priority persona handling higher priority work
 * - Escalation without review: Auto-escalating to bypass priority
 * - Persona shopping: Trying different personas for same task
 * 
 * ⚠️ WHEN TO USE canOverride():
 * - LegalOps finding a blocked task that needs compliance review
 * - ChiefOfStaff rebalancing workload
 * - NOT for "this persona is faster" - that's load balancing, not override
 */

// ============================================================================
// Persona Priority Constants
// ============================================================================

/**
 * PERSONA PRIORITY (higher index = higher priority)
 * 
 * RnD: 0 - Experiments, research, never blocks production
 * Dev: 1 - Production code, feature work
 * ChiefOfStaff: 2 - Scheduling, coordination, can defer
 * LegalOps: 3 - Compliance, legal, never compromises
 */
export const PERSONA_PRIORITY = [
  "RnD",          // 0 - lowest, never blocks others
  "Dev",          // 1 - production work
  "ChiefOfStaff", // 2 - can defer anything
  "LegalOps",     // 3 - highest, compliance critical
] as const;

export type PersonaType = typeof PERSONA_PRIORITY[number];

// ============================================================================
// Priority Functions
// ============================================================================

export function getPersonaPriority(persona: PersonaType): number {
  return PERSONA_PRIORITY.indexOf(persona);
}

export function canOverride(requester: PersonaType, target: PersonaType): boolean {
  return getPersonaPriority(requester) > getPersonaPriority(target);
}

export function getHighestPriority(tieBreakers: PersonaType[]): PersonaType {
  let highest = tieBreakers[0];
  for (const persona of tieBreakers) {
    if (getPersonaPriority(persona) > getPersonaPriority(highest)) {
      highest = persona;
    }
  }
  return highest;
}

// ============================================================================
// Persona Skill Mapping
// ============================================================================

export function getPersonaSkill(owner: string): string {
  const map: Record<string, string> = {
    Dev: "persona-dev",
    LegalOps: "persona-legal",
    ChiefOfStaff: "persona-cos",
    RnD: "persona-rnd",
  };
  return map[owner] || "persona-dev";
}

// ============================================================================
// Persona Category Mapping
// ============================================================================

export function getPersonaCategory(persona: PersonaType): string {
  const map: Record<PersonaType, string> = {
    RnD: "RND",
    Dev: "DEV",
    ChiefOfStaff: "ADMIN",
    LegalOps: "LEGAL",
  };
  return map[persona];
}
