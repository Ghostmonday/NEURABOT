# Sowwy Memory & Identity Research Report

**Executive Summary for Decision Making**

---

## 1. OpenClaw Memory System (Baseline)

OpenClaw provides a simple but effective memory workflow:

### Memory Flow

```
Session Start → Context Injection → Agent produces messages → Memory Flush → Session End
```

### Memory Files

| File                   | Purpose                   | Read Frequency    |
| ---------------------- | ------------------------- | ----------------- |
| `memory/YYYY-MM-DD.md` | Daily conversation log    | Every session     |
| `MEMORY.md`            | Curated long-term memory  | Main session only |
| `BOOTSTRAP.md`         | One-time first-run ritual | First run only    |

### Current Limitations

- **No automatic extraction** - Humans must write memory
- **No identity learning** - No preference extraction
- **No decision tracking** - Past decisions not remembered
- **No context synthesis** - No summary of accumulated knowledge

---

## 2. Sowwy's Identity Foundation (What We Have)

### Identity Schema (8 LOCKED Categories)

```typescript
const IdentityCategory = {
  goal: "goal", // What Amir wants to achieve
  constraint: "constraint", // Hard limits, non-negotiables
  preference: "preference", // Soft preferences, style choices
  belief: "belief", // Values, stances, worldview
  risk: "risk", // Known risks, fears, concerns
  capability: "capability", // Skills, strengths, resources
  relationship: "relationship", // People, organizations, dynamics
  historical_fact: "historical_fact", // Past events, experiences
} as const;
```

### Existing Infrastructure

- ✅ Identity fragment schema
- ✅ Category validation
- ✅ WRITE rule (only extraction pipeline may write)
- ❌ LanceDB vector store (not implemented)
- ❌ Extraction pipeline (not implemented)
- ❌ Memory synthesis (not implemented)

---

## 3. Research Findings: Best Practices for AI Memory

### A. Memory Architecture Patterns

#### Short-Term Memory (Session)

- **Purpose**: Current conversation context
- **Storage**: In-memory (context window)
- **Duration**: Single session
- **Size**: Limited by model context

#### Working Memory (Daily)

- **Purpose**: Recent interactions and progress
- **Storage**: `memory/YYYY-MM-DD.md`
- **Duration**: 7-30 days
- **Size**: ~2000 tokens/day

#### Long-Term Memory (Permanent)

- **Purpose**: Identity, preferences, key decisions
- **Storage**: `MEMORY.md` + LanceDB vectors
- **Duration**: Indefinite
- **Size**: Curated, high-value only

### B. Identity Learning Strategies

#### Passive Learning

- Observe user corrections
- Track which suggestions are accepted
- Note communication patterns
- Monitor task completion rates

#### Active Learning

- Explicit preference queries
- Post-task feedback requests
- Periodic identity reviews
- Hypothesis testing ("Do you prefer X or Y?")

#### Conflict Resolution

- Detect contradictory preferences
- Prioritize recent over old
- Flag conflicts for human resolution

### C. Memory Extraction Techniques

#### Rule-Based Extraction

```typescript
function extractFragments(conversation: Message[]): IdentityFragment[] {
  // Pattern matching for known categories
  // Regex for explicit statements
  // Keyword detection
}
```

#### LLM-Based Extraction

```typescript
async function extractWithLLM(conversation: Message[]): Promise<IdentityFragment[]> {
  const prompt = `Extract identity fragments from this conversation...
                  Categories: goal, constraint, preference, belief, risk, capability, relationship`;
  return await llm.complete(prompt);
}
```

#### Hybrid Approach (RECOMMENDED)

- Rule-based for explicit statements
- LLM for implicit preferences
- Human review for critical items

### D. Memory Consolidation

#### Daily Workflow

1. **Morning**: Read yesterday's memory + MEMORY.md
2. **During Session**: Append notable items to daily log
3. **End of Session**: Extract fragments, update vectors
4. **Weekly**: Consolidate daily logs into MEMORY.md

#### Consolidation Rules

- Merge similar fragments
- Remove outdated information
- Prioritize by frequency of confirmation
- Keep only actionable insights

---

## 4. Decision Memory Framework

### What to Remember About Decisions

| Category      | Example                                   | Retention |
| ------------- | ----------------------------------------- | --------- |
| **Decision**  | "Chose PostgreSQL over MongoDB"           | Permanent |
| **Rationale** | "Need ACID compliance for financial data" | Permanent |
| **Outcome**   | "Migration completed successfully"        | 90 days   |
| **Lessons**   | "Need better backup strategy"             | Permanent |
| **Regrets**   | "Should have used Docker from start"      | 30 days   |

### Decision Tracking Schema

```typescript
interface Decision {
  id: string;
  timestamp: Date;
  question: string; // What was decided
  options: string[]; // Alternatives considered
  choice: string; // What was chosen
  rationale: string; // Why this choice
  expectedOutcome: string; // What was expected
  actualOutcome?: string; // What happened
  lessonsLearned?: string[]; // Post-mortem
  confidence: number; // 0.0 - 1.0
  status: "pending" | "fulfilled" | "failed" | "regretted";
}
```

---

## 5. Performance Optimization Strategies

### A. Token Management

| Strategy              | Savings | Implementation               |
| --------------------- | ------- | ---------------------------- |
| **Summarization**     | 60-80%  | LLM summarize old memories   |
| **Selective Loading** | 40-60%  | Only load relevant memories  |
| **Compression**       | 20-30%  | Structured format over prose |
| **Tiered Access**     | 50-70%  | Index vectors, load on match |

### B. Vector Search (LanceDB)

```typescript
// Store embeddings for semantic search
await vectorStore.upsert({
  id: fragment.id,
  vector: await embedder.encode(fragment.content),
  payload: fragment,
});

// Query: "What does Amir prefer for databases?"
const results = await vectorStore.query({
  query: await embedder.encode("database preferences"),
  topK: 5,
});
```

### C. Memory Index

```typescript
interface MemoryIndex {
  goals: string[];
  constraints: string[];
  preferences: Record<string, string>; // "editor" -> "VSCode"
  beliefs: string[];
  risks: string[];
  recentDecisions: Decision[];
  capabilityProfile: string[];
  relationships: Record<string, string>;
}
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Week 1)

| Task                       | Effort | Priority |
| -------------------------- | ------ | -------- |
| Implement pg-store.ts      | 4h     | HIGH     |
| Implement lancedb-store.ts | 4h     | HIGH     |
| Memory extraction pipeline | 8h     | HIGH     |
| Daily memory logger        | 2h     | MEDIUM   |

### Phase 2: Intelligence (Week 2)

| Task                     | Effort | Priority |
| ------------------------ | ------ | -------- |
| Decision tracking system | 6h     | HIGH     |
| Preference auto-learning | 8h     | HIGH     |
| Memory consolidation     | 6h     | MEDIUM   |
| Context synthesis        | 8h     | MEDIUM   |

### Phase 3: Optimization (Week 3)

| Task                     | Effort | Priority |
| ------------------------ | ------ | -------- |
| Vector search tuning     | 4h     | MEDIUM   |
| Token optimization       | 4h     | MEDIUM   |
| Performance benchmarking | 2h     | LOW      |

---

## 7. Quick Wins (Under 1 Hour)

### A. Memory Reading Automation

```bash
# Add to session startup
READ_TODAY=$(cat memory/$(date +%Y-%m-%d).md 2>/dev/null || echo "")
READ_YESTERDAY=$(cat memory/$(date -d "yesterday" +%Y-%m-%d).md 2>/dev/null || echo "")
READ_MEMORY=$(cat MEMORY.md 2>/dev/null || echo "")
```

### B. Simple Preference Extraction

```typescript
// Detect explicit preferences
const preferencePatterns = [/I (prefer|like|love|hate|dislike) (.+)/i, /Always (.+)/, /Never (.+)/];
```

### C. Decision Logging

```typescript
function logDecision(question: string, choice: string, rationale: string) {
  const entry = `
## Decision: ${question}
- **Choice**: ${choice}
- **Rationale**: ${rationale}
- **Date**: ${new Date().toISOString()}
`;
  fs.appendFileSync("memory/decisions.md", entry);
}
```

---

## 8. Risks and Mitigations

| Risk                    | Likelihood | Impact   | Mitigation                      |
| ----------------------- | ---------- | -------- | ------------------------------- |
| Memory bloat            | HIGH       | MEDIUM   | Aggressive consolidation        |
| False preferences       | MEDIUM     | HIGH     | Human review for critical items |
| Context leakage         | LOW        | CRITICAL | Strict access controls          |
| Performance degradation | MEDIUM     | MEDIUM   | Tiered memory access            |

---

## 9. Recommendations

### Immediate Actions (This Week)

1. ✅ Implement `pg-store.ts` for task persistence
2. ✅ Implement `lancedb-store.ts` for identity vectors
3. ✅ Create simple memory extraction pipeline
4. ✅ Add automatic memory reading to session start

### Short-Term (Next 2 Weeks)

1. Decision tracking system
2. Preference auto-learning
3. Memory consolidation workflow

### Long-Term (Month 2+)

1. Full identity synthesis
2. Context-aware memory retrieval
3. Learning from outcomes

---

## 10. Key Metrics to Track

| Metric              | Target   | Measurement             |
| ------------------- | -------- | ----------------------- |
| Preference accuracy | >90%     | Human feedback          |
| Memory relevance    | >80%     | Query hit rate          |
| Context continuity  | 100%     | Session memory presence |
| Decision recall     | >95%     | Decision query hits     |
| Token efficiency    | <50% ctx | Memory vs context       |

---

## Summary Decision Points

### Q: Should we implement LanceDB or stick with file-based?

**A: Implement LanceDB.** Vector search is critical for semantic preference retrieval. Start simple, scale as needed.

### Q: How often should we consolidate memory?

**A: Daily extraction, weekly consolidation.** Extract fragments after each session, consolidate weekly.

### Q: Should decisions be auto-learned or human-reviewed?

**A: Hybrid.** Auto-extract decisions, human-review high-stakes ones.

### Q: What's the minimum viable memory system?

**A:** Daily logs + preference extraction + decision tracking. That's 80% of value with 20% of effort.

---

**Prepared by:** Sowwy Research  
**Date:** 2026-02-03  
**Confidence Level:** High (based on industry patterns + OpenClaw baseline)
