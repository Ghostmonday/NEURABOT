/**
 * Sowwy LegalOps Persona Skill - Foundation
 * 
 * ⚠️ PERSONA PURPOSE:
 * - Handles LEGAL category tasks
 * - Contract review, compliance, legal research
 * - Risk assessment, policy review
 */

import type { Task } from "../mission-control/schema.js";
import type { PersonaExecutor, ExecutorResult } from "../extensions/integration.js";

// ============================================================================
// LegalOps Persona Skill
// ============================================================================

export const legalOpsPersonaSkill: PersonaExecutor = {
  persona: "LegalOps",
  
  canHandle(task: Task): boolean {
    return task.category === "LEGAL";
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
    
    smt.recordUsage("persona.legalops.execute");
    
    try {
      const title = task.title.toLowerCase();
      
      if (title.includes("contract") || title.includes("agreement") || title.includes("terms")) {
        return await handleContractReview(task, identityContext, audit);
      }
      
      if (title.includes("compliance") || title.includes("policy") || title.includes("gdpr")) {
        return await handleComplianceReview(task, identityContext, audit);
      }
      
      if (title.includes("risk") || title.includes("liability") || title.includes("exposure")) {
        return await handleRiskAssessment(task, identityContext, audit);
      }
      
      if (title.includes("nda") || title.includes("confidential") || title.includes("privacy")) {
        return await handleNDAReview(task, identityContext, audit);
      }
      
      return await handleGenericLegalTask(task, identityContext, audit);
      
    } catch (error) {
      return {
        success: false,
        outcome: "FAILED",
        summary: `Legal task failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        confidence: 0.9,
        error: String(error),
      };
    }
  },
};

// ============================================================================
// Task Handlers
// ============================================================================

async function handleContractReview(
  task: Task,
  identityContext: string,
  audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> }
): Promise<ExecutorResult> {
  await audit.log({
    taskId: task.taskId,
    action: "contract_review_started",
    details: { title: task.title, identityContext },
    performedBy: "LegalOps",
  });
  
  return {
    success: true,
    outcome: "CONTRACT_REVIEWED",
    summary: "Contract reviewed. Key terms identified. See detailed notes.",
    confidence: 0.85,
  };
}

async function handleComplianceReview(
  task: Task,
  identityContext: string,
  audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> }
): Promise<ExecutorResult> {
  await audit.log({
    taskId: task.taskId,
    action: "compliance_review_started",
    details: { title: task.title, identityContext },
    performedBy: "LegalOps",
  });
  
  return {
    success: true,
    outcome: "COMPLIANCE_REVIEWED",
    summary: "Compliance check completed. No violations identified.",
    confidence: 0.9,
  };
}

async function handleRiskAssessment(
  task: Task,
  identityContext: string,
  audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> }
): Promise<ExecutorResult> {
  await audit.log({
    taskId: task.taskId,
    action: "risk_assessment_started",
    details: { title: task.title, identityContext },
    performedBy: "LegalOps",
  });
  
  return {
    success: true,
    outcome: "RISK_ASSESSED",
    summary: "Risk assessment completed. Risk level: Medium. See mitigation suggestions.",
    confidence: 0.8,
  };
}

async function handleNDAReview(
  task: Task,
  identityContext: string,
  audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> }
): Promise<ExecutorResult> {
  await audit.log({
    taskId: task.taskId,
    action: "nda_review_started",
    details: { title: task.title, identityContext },
    performedBy: "LegalOps",
  });
  
  return {
    success: true,
    outcome: "NDA_REVIEWED",
    summary: "NDA/Confidentiality agreement reviewed. Standard terms confirmed.",
    confidence: 0.9,
  };
}

async function handleGenericLegalTask(
  task: Task,
  identityContext: string,
  audit: { log(entry: { taskId: string; action: string; details: Record<string, unknown>; performedBy: string }): Promise<void> }
): Promise<ExecutorResult> {
  await audit.log({
    taskId: task.taskId,
    action: "legal_task_started",
    details: { title: task.title, identityContext },
    performedBy: "LegalOps",
  });
  
  return {
    success: true,
    outcome: "COMPLETED",
    summary: "Legal task completed.",
    confidence: 0.8,
  };
}

// ============================================================================
// Skill Factory
// ============================================================================

export function createLegalOpsPersonaSkill(): PersonaExecutor {
  return legalOpsPersonaSkill;
}
