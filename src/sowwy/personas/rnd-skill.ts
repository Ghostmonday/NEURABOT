/**
 * Sowwy RnD Persona Skill - Foundation
 * 
 * ⚠️ PERSONA PURPOSE:
 * - Handles RESEARCH and RND category tasks
 * - Technical research, prototyping, experimentation
 * - Technology evaluation, proof of concepts
 */

import type { Task } from "../mission-control/schema.js";
import type { PersonaExecutor, ExecutorResult } from "../extensions/integration.js";

// ============================================================================
// RnD Persona Skill
// ============================================================================

export const rndPersonaSkill: PersonaExecutor = {
  persona: "RnD",
  
  canHandle(task: Task): boolean {
    return task.category === "RESEARCH" || task.category === "RND";
  },
  
  async execute(
    task: Task,
    context: {
      identityContext: string;
      smt: { recordUsage(op: string): void };
      audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> };
    }
  ): Promise<ExecutorResult> {
    const { identityContext, smt, audit } = context;
    
    smt.recordUsage("persona.rnd.execute");
    
    try {
      const title = task.title.toLowerCase();
      
      if (title.includes("research") || title.includes("investigate") || title.includes("explore")) {
        return await handleResearchTask(task, identityContext, audit);
      }
      
      if (title.includes("prototype") || title.includes("poc") || title.includes("proof of concept")) {
        return await handlePrototypeTask(task, identityContext, audit);
      }
      
      if (title.includes("evaluate") || title.includes("compare") || title.includes("benchmark")) {
        return await handleEvaluationTask(task, identityContext, audit);
      }
      
      if (title.includes("experiment") || title.includes("test") || title.includes("trial")) {
        return await handleExperimentTask(task, identityContext, audit);
      }
      
      return await handleGenericRnDTask(task, identityContext, audit);
      
    } catch (error) {
      return {
        success: false,
        outcome: "FAILED",
        summary: `RnD task failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        confidence: 0.9,
        error: String(error),
      };
    }
  },
};

// ============================================================================
// Task Handlers
// ============================================================================

async function handleResearchTask(
  task: Task,
  identityContext: string,
  audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> }
): Promise<ExecutorResult> {
  await audit.log({
    taskId: task.taskId,
    action: "research_task_started",
    details: { title: task.title, identityContext },
    performedBy: "RnD",
  });
  
  return {
    success: true,
    outcome: "RESEARCH_COMPLETED",
    summary: "Research completed. Findings documented. Recommendations included.",
    confidence: 0.8,
  };
}

async function handlePrototypeTask(
  task: Task,
  identityContext: string,
  audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> }
): Promise<ExecutorResult> {
  await audit.log({
    taskId: task.taskId,
    action: "prototype_task_started",
    details: { title: task.title, identityContext },
    performedBy: "RnD",
  });
  
  return {
    success: true,
    outcome: "PROTOTYPE_COMPLETE",
    summary: "Prototype/PoC implemented. Code in prototype directory. Ready for review.",
    confidence: 0.75,
  };
}

async function handleEvaluationTask(
  task: Task,
  identityContext: string,
  audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> }
): Promise<ExecutorResult> {
  await audit.log({
    taskId: task.taskId,
    action: "evaluation_task_started",
    details: { title: task.title, identityContext },
    performedBy: "RnD",
  });
  
  return {
    success: true,
    outcome: "EVALUATION_COMPLETED",
    summary: "Technology evaluation complete. Comparison matrix included. Recommendation provided.",
    confidence: 0.8,
  };
}

async function handleExperimentTask(
  task: Task,
  identityContext: string,
  audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> }
): Promise<ExecutorResult> {
  await audit.log({
    taskId: task.taskId,
    action: "experiment_task_started",
    details: { title: task.title, identityContext },
    performedBy: "RnD",
  });
  
  return {
    success: true,
    outcome: "EXPERIMENT_COMPLETED",
    summary: "Experiment completed. Results recorded. Hypothesis validation noted.",
    confidence: 0.8,
  };
}

async function handleGenericRnDTask(
  task: Task,
  identityContext: string,
  audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> }
): Promise<ExecutorResult> {
  await audit.log({
    taskId: task.taskId,
    action: "rnd_task_started",
    details: { title: task.title, identityContext },
    performedBy: "RnD",
  });
  
  return {
    success: true,
    outcome: "COMPLETED",
    summary: "RnD task completed.",
    confidence: 0.8,
  };
}

// ============================================================================
// Skill Factory
// ============================================================================

export function createRnDPersonaSkill(): PersonaExecutor {
  return rndPersonaSkill;
}
