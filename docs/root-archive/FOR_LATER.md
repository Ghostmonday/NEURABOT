# Self-Improvement Module (Deferred)

**Status:** Deferred until after core system is stable (2-3 months of operational data)

**Rationale:** This module is extremely ambitious and complex. Start simpler, focus on core task system and identity model working reliably, then layer on autonomous features.

---

## Self-Improvement Module (Persona Evolution)

**Goal:** Enable Sowwy to improve existing personas, research needed roles, and create new personas autonomously - eventually forming an entire company workforce.

**Architecture:**

```typescript
// src/sowwy/personas/evolution.ts

interface PersonaImprovement {
  personaId: string;
  currentVersion: string;
  proposedChanges: {
    promptUpdates: string[];
    newResponsibilities: string[];
    updatedDecisionFramework: string;
    rationale: string;
    evidence: string[]; // Task outcomes, feedback, metrics
  };
  confidence: number;
  requiresApproval: boolean;
}

interface RoleResearch {
  roleName: string;
  researchSource: "web" | "identity" | "task_analysis";
  responsibilities: string[];
  requiredSkills: string[];
  typicalTasks: string[];
  priority: number; // Based on task gaps
  proposedPersonaName: string;
}

interface PersonaCreation {
  roleResearch: RoleResearch;
  proposedSkill: {
    name: string;
    category: Task["category"];
    skillContent: string; // Full SKILL.md content
  };
  requiresApproval: boolean; // Always true for new personas
}
```

**Self-Improvement Pipeline:**

```typescript
// 1. Persona Self-Assessment
async function assessPersonaPerformance(personaId: string): Promise<PersonaImprovement[]> {
  // Analyze:
  // - Task completion rates
  // - Decision quality (confidence scores)
  // - Human corrections/feedback
  // - Identity alignment (does persona match Amir's style?)

  const metrics = await getPersonaMetrics(personaId);
  const feedback = await getPersonaFeedback(personaId);
  const identity = await getRelevantIdentity(`persona ${personaId} execution`);

  // Generate improvement proposals
  return await llm.generateImprovements({
    personaId,
    metrics,
    feedback,
    identity,
  });
}

// 2. Role Gap Analysis
async function identifyRoleGaps(): Promise<RoleResearch[]> {
  // Analyze:
  // - Tasks that don't fit existing personas
  // - Tasks marked BLOCKED due to missing capability
  // - Identity fragments about company structure/goals
  // - Web research on company roles

  const unassignedTasks = await taskStore.findUnassigned();
  const blockedTasks = await taskStore.findBlocked({ reason: "missing_capability" });
  const companyGoals = await identityStore.query({ category: "goal", context: "company" });

  // Research what roles are needed
  const research = await researchRoles({
    taskGaps: unassignedTasks,
    blockedTasks,
    companyGoals,
  });

  return research;
}

// 3. Role Research (Web + Identity)
async function researchRoles(params: {
  taskGaps: Task[];
  blockedTasks: Task[];
  companyGoals: IdentityFragment[];
}): Promise<RoleResearch[]> {
  // Use browser tool to research occupations
  const researchTasks = params.taskGaps.map((gap) => ({
    query: `What role handles ${gap.title} in a company?`,
    context: gap.description,
  }));

  const webResults = await browser.search(researchTasks);

  // Cross-reference with identity
  const relevantIdentity = await identityStore.query({
    category: "capability",
    context: "company structure",
  });

  // Generate role research proposals
  return await llm.synthesizeRoleResearch({
    webResults,
    identity,
    taskGaps: params.taskGaps,
  });
}

// 4. Persona Creation Pipeline
async function createPersonaFromResearch(research: RoleResearch): Promise<PersonaCreation> {
  // Generate full SKILL.md content
  const skillContent = await llm.generatePersonaSkill({
    role: research,
    identity: await getRelevantIdentity(`role ${research.roleName}`),
    existingPersonas: await getAllPersonas(),
  });

  return {
    roleResearch: research,
    proposedSkill: {
      name: `persona-${research.proposedPersonaName.toLowerCase()}`,
      category: inferCategory(research.responsibilities),
      skillContent,
    },
    requiresApproval: true, // Always require approval for new personas
  };
}

// 5. Improvement Application (Gated)
async function applyPersonaImprovement(improvement: PersonaImprovement): Promise<void> {
  if (improvement.requiresApproval) {
    // Create approval task
    await taskStore.create({
      title: `Review persona improvement: ${improvement.personaId}`,
      category: "ADMIN",
      personaOwner: "ChiefOfStaff",
      requiresApproval: true,
      contextLinks: {
        improvement: JSON.stringify(improvement),
      },
    });
    return;
  }

  // Auto-apply if confidence high and no approval needed
  await updatePersonaSkill(improvement.personaId, improvement.proposedChanges);
  await auditLog.append(null, {
    action: "persona_improvement_applied",
    personaId: improvement.personaId,
    changes: improvement.proposedChanges,
  });
}

// 6. New Persona Creation (Always Gated)
async function createNewPersona(creation: PersonaCreation): Promise<void> {
  // Always requires approval - never auto-create
  await taskStore.create({
    title: `Review new persona: ${creation.proposedSkill.name}`,
    category: "ADMIN",
    personaOwner: "ChiefOfStaff",
    requiresApproval: true,
    urgency: 3,
    importance: 4,
    contextLinks: {
      roleResearch: JSON.stringify(creation.roleResearch),
      proposedSkill: creation.proposedSkill.skillContent,
    },
  });
}
```

**Self-Improvement Triggers:**

```typescript
// Cron job: Weekly persona assessment
cron.schedule("0 2 * * 0", async () => {
  const personas = await getAllPersonas();
  for (const persona of personas) {
    const improvements = await assessPersonaPerformance(persona.id);
    for (const improvement of improvements) {
      await applyPersonaImprovement(improvement);
    }
  }
});

// On-demand: Role gap analysis
async function triggerRoleGapAnalysis(): Promise<void> {
  const gaps = await identifyRoleGaps();
  for (const gap of gaps) {
    if (gap.priority > 7) {
      // High priority
      const creation = await createPersonaFromResearch(gap);
      await createNewPersona(creation);
    }
  }
}

// Task-driven: When task can't be assigned
async function handleUnassignableTask(task: Task): Promise<void> {
  // Research what role would handle this
  const research = await researchRoles({
    taskGaps: [task],
    blockedTasks: [],
    companyGoals: [],
  });

  if (research.length > 0) {
    const creation = await createPersonaFromResearch(research[0]);
    await createNewPersona(creation);
  }
}
```

**Approval Workflow:**

```typescript
// When approval task is created
async function handlePersonaApproval(task: Task): Promise<void> {
  const improvement = JSON.parse(task.contextLinks.improvement);

  // Show in WebChat UI with diff view
  await notifyHuman({
    type: "persona_improvement_review",
    taskId: task.taskId,
    personaId: improvement.personaId,
    currentVersion: await getPersonaSkillContent(improvement.personaId),
    proposedVersion: improvement.proposedChanges,
    evidence: improvement.evidence,
  });

  // Human approves via SMS/chat: "approve persona improvement <taskId>"
}

// Approval command handler
async function approvePersonaChange(taskId: string): Promise<void> {
  const task = await taskStore.get(taskId);
  const improvement = JSON.parse(task.contextLinks.improvement);

  await updatePersonaSkill(improvement.personaId, improvement.proposedChanges);
  await taskStore.update(taskId, {
    status: "DONE",
    outcome: "COMPLETED",
    decisionSummary: "Persona improvement approved and applied",
  });
}
```

**Safety Gates:**

1. **New Personas:** Always require approval (never auto-create)
2. **Major Changes:** Prompt rewrites > 30% require approval
3. **Evidence Required:** Must show task outcomes/metrics supporting change
4. **Identity Alignment:** Proposed changes checked against identity fragments
5. **Rollback Capability:** All persona versions stored in git, can revert

**Storage:**

```typescript
// Store persona versions in git
// skills/persona-dev/
//   ├── SKILL.md (current)
//   ├── versions/
//   │   ├── v1.0.md
//   │   ├── v1.1.md
//   │   └── v2.0.md
//   └── improvements/
//       ├── 2026-02-03-proposal-1.json
//       └── 2026-02-10-proposal-2.json
```

**Metrics to Track:**

- Persona execution success rate
- Decision confidence scores
- Human correction frequency
- Task completion time by persona
- Identity alignment score

---

## When to Revisit

**Prerequisites:**

- Core task system stable (3+ months operation)
- Identity model has substantial data (1000+ fragments)
- Personas executing reliably (90%+ success rate)
- Strong evaluation criteria established for persona performance

**Implementation Order:**

1. Start with assessment-only (no auto-improvement)
2. Add role research after 2-3 months of operational data
3. Persona creation always gated - never auto-create
