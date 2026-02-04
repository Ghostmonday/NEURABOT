/**
 * Self-Modification Protocol
 *
 * Controlled self-modification capability for SOWWY agents.
 * Enables agents to edit their own code within defined boundaries
 * and trigger supervised restarts with safety gates and rollback support.
 */

export * from "./boundaries.js";
export * from "./checklist.js";
export * from "./reload.js";
export * from "./rollback.js";
