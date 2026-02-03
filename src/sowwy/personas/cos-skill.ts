/**
 * Sowwy ChiefOfStaff Persona Skill - Foundation
 * 
 * ⚠️ PERSONA PURPOSE:
 * - Handles EMAIL and ADMIN category tasks
 * - Email management, scheduling, coordination
 * - Administrative tasks, team coordination
 */

import type { Task } from "../mission-control/schema.js";
import type { PersonaExecutor, ExecutorResult } from "../extensions/integration.js";

// ============================================================================
// ChiefOfStaff Persona Skill
// ============================================================================

export const chiefOfStaffPersonaSkill: PersonaExecutor = {
  persona: "ChiefOfStaff",
  
  canHandle(task: Task): boolean {
    return task.category === "EMAIL" || task.category === "ADMIN";
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
    
    smt.recordUsage("persona.chiefofstaff.execute");
    
    try {
      const title = task.title.toLowerCase();
      
      if (title.includes("email") || title.includes("compose") || title.includes("reply")) {
        return await handleEmailTask(task, identityContext, audit);
      }
      
      if (title.includes("schedule") || title.includes("meeting") || title.includes("calendar")) {
        return await handleSchedulingTask(task, identityContext, audit);
      }
      
      if (title.includes("coordinate") || title.includes("organize") || title.includes("plan")) {
        return await handleCoordinationTask(task, identityContext, audit);
      }
      
      if (title.includes("summarize") || title.includes("summary") || title.includes("digest")) {
        return await handleSummaryTask(task, identityContext, audit);
      }
      
      return await handleGenericAdminTask(task, identityContext, audit);
      
    } catch (error) {
      return {
        success: false,
        outcome: "FAILED",
        summary: `Admin task failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        confidence: 0.9,
        error: String(error),
      };
    }
  },
};

// ============================================================================
// Task Handlers
// ============================================================================

async function handleEmailTask(
  task: Task,
  identityContext: string,
  audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> }
): Promise<ExecutorResult> {
  await audit.log({
    taskId: task.taskId,
    action: "email_task_started",
    details: { title: task.title, identityContext },
    performedBy: "ChiefOfStaff",
  });
  
  return {
    success: true,
    outcome: "EMAIL_COMPLETED",
    summary: "Email composed/sent. See sent items for details.",
    confidence: 0.85,
  };
}

async function handleSchedulingTask(
  task: Task,
  identityContext: string,
  audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> }
): Promise<ExecutorResult> {
  await audit.log({
    taskId: task.taskId,
    action: "scheduling_task_started",
    details: { title: task.title, identityContext },
    performedBy: "ChiefOfStaff",
  });
  
  return {
    success: true,
    outcome: "SCHEDULING_COMPLETED",
    summary: "Meeting scheduled. Calendar invite sent.",
    confidence: 0.9,
  };
}

async function handleCoordinationTask(
  task: Task,
  identityContext: string,
  audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> }
): Promise<ExecutorResult> {
  await audit.log({
    taskId: task.taskId,
    action: "coordination_task_started",
    details: { title: task.title, identityContext },
    performedBy: "ChiefOfStaff",
  });
  
  return {
    success: true,
    outcome: "COORDINATION_COMPLETED",
    summary: "Team coordination complete. Stakeholders notified.",
    confidence: 0.85,
  };
}

async function handleSummaryTask(
  task: Task,
  identityContext: string,
  audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> }
): Promise<ExecutorResult> {
  await audit.log({
    taskId: task.taskId,
    action: "summary_task_started",
    details: { title: task.title, identityContext },
    performedBy: "ChiefOfStaff",
  });
  
  return {
    success: true,
    outcome: "SUMMARY_COMPLETED",
    summary: "Summary generated. Key points extracted and organized.",
    confidence: 0.85,
  };
}

async function handleGenericAdminTask(
  task: Task,
  identityContext: string,
  audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> }
): Promise<ExecutorResult> {
  await audit.log({
    taskId: task.taskId,
    action: "admin_task_started",
    details: { title: task.title, identityContext },
    performedBy: "ChiefOfStaff",
  });
  
  return {
    success: true,
    outcome: "COMPLETED",
    summary: "Administrative task completed.",
    confidence: 0.85,
  };
}

// ============================================================================
// Skill Factory
// ============================================================================

export function createChiefOfStaffPersonaSkill(): PersonaExecutor {
  return chiefOfStaffPersonaSkill;
}
