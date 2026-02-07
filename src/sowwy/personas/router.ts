/**
 * Sowwy Persona Router - Foundation
 *
 * Routes tasks to appropriate personas with identity injection.
 */

import { IdentityContext } from "../identity/store.js";
import { PersonaOwner, Task, TaskCategory } from "../mission-control/schema.js";
import { getPersonaSkill, PERSONA_PRIORITY, PersonaType } from "./priority.js";

// ============================================================================
// Routing Result
// ============================================================================

export interface RoutingResult {
  persona: PersonaOwner;
  skill: string;
  context: IdentityContext;
  requiresApproval: boolean;
  priority: number;
}

// ============================================================================
// Router Config
// ============================================================================

export interface PersonaRouterConfig {
  enableOverride: boolean;
  requireApprovalForExternal: boolean;
}

// ============================================================================
// Persona Router
// ============================================================================

export class PersonaRouter {
  private config: PersonaRouterConfig;

  constructor(config: Partial<PersonaRouterConfig> = {}) {
    this.config = {
      enableOverride: true,
      requireApprovalForExternal: true,
      ...config,
    };
  }

  /**
   * Route a task to a persona
   */
  route(task: Task, identityContext: IdentityContext): RoutingResult {
    // Determine persona based on category
    const persona = this.getPersonaForCategory(task.category);

    // Get skill identifier
    const skill = getPersonaSkill(persona);

    // Check if approval required
    const requiresApproval = this.requiresApproval(task);

    // Get priority
    const priority = this.calculatePriority(task, persona);

    return {
      persona,
      skill,
      context: identityContext,
      requiresApproval,
      priority,
    };
  }

  /**
   * Get persona for a task category
   */
  private getPersonaForCategory(category: TaskCategory): PersonaOwner {
    const mapping: Record<TaskCategory, PersonaOwner> = {
      DEV: "Dev",
      LEGAL: "LegalOps",
      EMAIL: "ChiefOfStaff",
      ADMIN: "ChiefOfStaff",
      RESEARCH: "RnD",
      RND: "RnD",
      SMS: "ChiefOfStaff",
      MISSION_CONTROL: "ChiefOfStaff",
      SELF_MODIFY: "Dev",
      FITNESS_CHECK: "Dev",
      RUST_CHECK: "Dev",
      RUST_FIX: "Dev",
    };
    return mapping[category];
  }

  /**
   * Check if task requires approval
   */
  private requiresApproval(task: Task): boolean {
    if (task.requiresApproval) {
      return true;
    }

    if (this.config.requireApprovalForExternal) {
      // Email, SMS, or external actions require approval
      return task.category === "EMAIL" || task.category === "ADMIN";
    }

    return false;
  }

  /**
   * Calculate routing priority
   */
  private calculatePriority(task: Task, persona: PersonaOwner): number {
    // Base priority from persona hierarchy
    const basePriority = PERSONA_PRIORITY.indexOf(persona as PersonaType) * 100;

    // Add task urgency
    const urgencyBonus = task.urgency * 10;

    // Add importance weight
    const importanceBonus = task.importance * 5;

    // Subtract stress cost
    const stressPenalty = task.stressCost * 2;

    return basePriority + urgencyBonus + importanceBonus - stressPenalty;
  }

  /**
   * Check if one persona can override another
   */
  canOverride(requester: PersonaOwner, target: PersonaOwner): boolean {
    return (
      PERSONA_PRIORITY.indexOf(requester as PersonaType) >
      PERSONA_PRIORITY.indexOf(target as PersonaType)
    );
  }
}

// ============================================================================
// Router Factory
// ============================================================================

export type PersonaRouterFactory = () => PersonaRouter;
