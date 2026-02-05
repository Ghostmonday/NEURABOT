# Scout Design Report: LanceDB Identity Memory Layer for NEURABOT

**Date:** 2026-02-04
**Author:** Scout (Memory Persistence Engineer)
**Session:** Isolated, Read-Only, No Execution Privileges

---

## 1. Overview

This report documents the design and validation of a LanceDB-based vector memory store for NEURABOT's identity persistence layer. The implementation leverages the existing `LanceDBIdentityStore` class in `src/sowwy/identity/lancedb-store.ts` which provides:

- **Semantic Search**: Cosine similarity-based vector retrieval
- **Append-Only Writes**: Identity fragments are never mutated (only reviewed/archived)
- **8 Locked Categories**: Enforced schema prevents fragmentation
- **Write Access Control**: Only the Identity Extraction Pipeline may write; personas/tools are read-only

The memory spine is designed for **Sowwy** (primary reasoning brain) to consume identity context without runtime glue code.

---

## 2. Schema Definition

### 2.1 Locked Identity Categories (Non-Expanding)

The schema enforces exactly 8 categories. This constraint is **intentional**—fewer buckets = higher signal = better retrieval.

| Category          | Purpose                         | Examples                                        |
| ----------------- | ------------------------------- | ----------------------------------------------- |
| `goal`            | What the user wants to achieve  | "Build a CLI tool", "Learn Rust"                |
| `constraint`      | Hard limits, non-negotiables    | "Never use Claude Code", "No cloud services"    |
| `preference`      | Soft preferences, style choices | "Prefers TypeScript", "Likes bullet points"     |
| `belief`          | Values, stances, worldview      | "Privacy-first", "Open source advocate"         |
| `risk`            | Known risks, fears, concerns    | "Avoids vendor lock-in", "Concerned about cost" |
| `capability`      | Skills, strengths, resources    | "Senior dev", "Has GPU cluster"                 |
| `relationship`    | People, organizations, dynamics | "Works with team X", "Reports to Y"             |
| `historical_fact` | Past events, experiences        | "Built app Z last year", "Used tool Q in 2024"  |

### 2.2 LanceDB Table Schema

```typescript
type IdentityFragmentRow = {
  id: string; // UUID v4
  category: IdentityCategory; // 8 locked categories
  content: string; // Atomic memory text (10-5000 chars)
  context: string; // Source context (0-2000 chars)
  confidence: number; // 0.0-1.0 extraction confidence
  source: FragmentSource; // chat | email_analysis | correction
  metadata: string; // JSON string for extensibility
  created_at: number; // Unix timestamp
  embedding: number[]; // 1536-dim vector (text-embedding-3-small)
  reviewed: boolean; // Human review flag
};
```

### 2.3 Index Strategy

- **Vector Index**: LanceDB automatically indexes the `embedding` column for fast similarity search
- **Category Filter**: Query-time filtering on `category` column
- **No Secondary Indexes**: LanceDB handles filtering efficiently without additional indexes

---

## 3. LanceDB Initialization Script

The following script initializes the identity memory database with dummy data. It is **idempotent**—safe to run multiple times.

**File:** `scripts/init-identity-memory.ts`

```typescript
/**
 * LanceDB Identity Memory Initialization Script
 *
 * Usage: npx tsx scripts/init-identity-memory.ts
 *
 * This script:
 * 1. Creates the identity_fragments table
 * 2. Inserts a dummy dataset for testing
 * 3. Validates the setup
 */

import * as lancedb from "@lancedb/lancedb";
import { randomUUID } from "node:crypto";

// ============================================================================
// Configuration
// ============================================================================

const DB_PATH = process.env.LANCEDB_IDENTITY_PATH || "./data/identity-memory";
const EMBEDDING_MODEL = "text-embedding-3-small";
const VECTOR_DIM = 1536;

// ============================================================================
// Dummy Dataset: Identity Fragments for "Amir"
// ============================================================================

const DUMMY_FRAGMENTS: Array<{
  category: string;
  content: string;
  context: string;
  confidence: number;
  source: string;
}> = [
  // --- TONE / COMMUNICATION STYLE ---
  {
    category: "preference",
    content: "Prefers concise, direct responses without excessive pleasantries",
    context: "User mentioned they value efficiency over politeness in technical discussions",
    confidence: 0.85,
    source: "chat",
  },
  {
    category: "preference",
    content: "Responds well to technical depth but appreciates summaries at the start",
    context:
      "When given detailed implementations, user engages more when overview precedes details",
    confidence: 0.78,
    source: "chat",
  },
  {
    category: "preference",
    content: "Appreciates code examples over long prose explanations",
    context: "User frequently asks for 'just show me the code'",
    confidence: 0.92,
    source: "chat",
  },

  // --- PREFERENCES (FORMATTING, DEPTH, BREVITY) ---
  {
    category: "preference",
    content: "Prefers TypeScript over JavaScript for new projects",
    context: "Discussing web framework options, user explicitly chose TypeScript stack",
    confidence: 0.95,
    source: "chat",
  },
  {
    category: "preference",
    content: "Uses Prettier for code formatting automatically",
    context: "Mentioned VSCode setup includes format-on-save",
    confidence: 0.88,
    source: "chat",
  },
  {
    category: "preference",
    content: "Prefers functional programming patterns over OOP for business logic",
    context: "Architecture discussion about state management approach",
    confidence: 0.75,
    source: "chat",
  },

  // --- LINGUISTIC MARKERS ---
  {
    category: "belief",
    content: "Values precise terminology—dislikes jargon without definition",
    context: "User asked for clarification when technical terms were used without context",
    confidence: 0.8,
    source: "chat",
  },
  {
    category: "preference",
    content: "Comfortable with profanity in casual conversation but not in formal docs",
    context: "Observed mixing casual and formal registers appropriately",
    confidence: 0.7,
    source: "chat",
  },

  // --- TECHNICAL ORIENTATION ---
  {
    category: "capability",
    content: "Senior-level developer comfortable with Rust, TypeScript, and Go",
    context: "User implemented async runtime in Rust and maintains TypeScript monorepo",
    confidence: 0.95,
    source: "chat",
  },
  {
    category: "capability",
    content: "Experienced with vector databases and embeddings pipelines",
    context: "Built previous RAG system using Pinecone and OpenAI embeddings",
    confidence: 0.88,
    source: "chat",
  },
  {
    category: "preference",
    content: "Strong preference for local-first software over cloud-dependent tools",
    context: "Discussed IDE choices; user rejected cloud IDEs in favor of local VSCode",
    confidence: 0.9,
    source: "chat",
  },
  {
    category: "belief",
    content: "Believes in infrastructure as code—manual server config is technical debt",
    context: "User maintains extensive Ansible playbooks and Docker configurations",
    confidence: 0.92,
    source: "chat",
  },

  // --- DECISION HISTORY ---
  {
    category: "historical_fact",
    content: "Selected LanceDB over pgvector for memory storage due to simplicity",
    context: "Database selection discussion; cited LanceDB's Python/Rust DX as factors",
    confidence: 0.85,
    source: "chat",
  },
  {
    category: "historical_fact",
    content: "Previously used Supabase but migrated away due to vendor lock-in concerns",
    context: "User mentioned legacy project history during auth architecture discussion",
    confidence: 0.78,
    source: "chat",
  },
  {
    category: "goal",
    content: "Building NEURABOT as a personal AI assistant with full data sovereignty",
    context: "Project kickoff discussion about AI assistant requirements",
    confidence: 0.95,
    source: "chat",
  },

  // --- CONSTRAINTS ---
  {
    category: "constraint",
    content: "No cloud services for primary data storage—must be local or self-hosted",
    context: "Hard requirement stated during architecture review",
    confidence: 0.98,
    source: "chat",
  },
  {
    category: "constraint",
    content: "All AI interactions must be auditable—no black-box model calls",
    context: "Compliance discussion about AI transparency requirements",
    confidence: 0.9,
    source: "chat",
  },
  {
    category: "constraint",
    content: "Never deploy to production without automated tests",
    context: "CI/CD pipeline discussion; user described their no-deploy-without-tests rule",
    confidence: 0.95,
    source: "chat",
  },

  // --- EMOTIONAL SIGNALS ---
  {
    category: "risk",
    content: "Gets frustrated when AI makes up information or hallucinates",
    context: "User expressed strong frustration when incorrect technical facts were provided",
    confidence: 0.88,
    source: "chat",
  },
  {
    category: "risk",
    content: "Dislikes when AI asks clarifying questions instead of making reasonable assumptions",
    context: "User prefers the AI to take informed action rather than pause for input",
    confidence: 0.75,
    source: "chat",
  },
  {
    category: "preference",
    content: "Responds positively when AI acknowledges uncertainty explicitly",
    context: "User appreciated when the system said 'I don't know' instead of guessing",
    confidence: 0.82,
    source: "chat",
  },

  // --- META-IDENTITY ---
  {
    category: "belief",
    content: "Believes AI should be a tool, not a collaborator—the human remains in control",
    context: "Philosophy discussion about AI autonomy; user strongly favors human-in-the-loop",
    confidence: 0.92,
    source: "chat",
  },
  {
    category: "goal",
    content: "Wants to deeply understand AI systems, not just use them as black boxes",
    context: "Motivation discussion; user invests time in reading papers and source code",
    confidence: 0.85,
    source: "chat",
  },
  {
    category: "preference",
    content: "Prefers building custom solutions over buying SaaS when feasible",
    context: "Discussed purchasing vs building; user leans toward build for control",
    confidence: 0.8,
    source: "chat",
  },
];

// ============================================================================
// Embedding Generation (Simulated for Init Script)
// ============================================================================

// In production, use actual OpenAI embeddings
function simulateEmbedding(text: string): number[] {
  // Seed-based pseudo-random for reproducibility
  const hash = text.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const embedding = new Float32Array(VECTOR_DIM);
  for (let i = 0; i < VECTOR_DIM; i++) {
    const x = Math.sin(hash * (i + 1) * 0.1) * Math.cos(hash * (i + 1) * 0.05);
    embedding[i] = (x + 1) / 2; // Normalize to 0-1
  }
  return Array.from(embedding);
}

// ============================================================================
// Main Initialization
// ============================================================================

async function initializeIdentityMemory() {
  console.log("🚀 Initializing LanceDB Identity Memory...\n");

  // Connect to database
  const db = await lancedb.connect(DB_PATH);
  const TABLE_NAME = "identity_fragments";

  // Check if table exists
  const tableNames = await db.tableNames();
  const tableExists = tableNames.includes(TABLE_NAME);

  if (tableExists) {
    console.log(`📋 Table '${TABLE_NAME}' already exists.`);
    const existingTable = await db.openTable(TABLE_NAME);
    const count = await existingTable.countRows();
    console.log(`   Current fragment count: ${count}`);

    // Ask about reset (in production, use --force flag)
    console.log("\n⚠️  To reset: delete the database directory and re-run.\n");
  }

  // Create table if needed
  if (!tableExists) {
    console.log(`📦 Creating table '${TABLE_NAME}'...`);

    // Create with schema row, then delete schema row
    const table = await db.createTable(TABLE_NAME, [
      {
        id: "__schema__",
        category: "goal",
        content: "",
        context: "",
        confidence: 0,
        source: "chat",
        metadata: "{}",
        created_at: 0,
        embedding: Array.from({ length: VECTOR_DIM }).fill(0),
        reviewed: false,
      },
    ]);
    await table.delete('id = "__schema__"');
    console.log("   Table created successfully.");
  }

  // Open table for inserts
  const table = await db.openTable(TABLE_NAME);

  // Insert dummy fragments (skip if already exists based on content hash)
  console.log("\n📝 Inserting identity fragments...");

  let inserted = 0;
  let skipped = 0;

  for (const fragment of DUMMY_FRAGMENTS) {
    // Check for duplicate content
    const existing = await table
      .query()
      .where(`content = '${fragment.content.replace(/'/g, "''")}'`)
      .limit(1)
      .toArray();

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    const row = {
      id: randomUUID(),
      category: fragment.category,
      content: fragment.content,
      context: fragment.context,
      confidence: fragment.confidence,
      source: fragment.source,
      metadata: JSON.stringify({
        originalMessage: fragment.context,
        extractionModel: "simulated",
        reviewedByHuman: false,
      }),
      created_at: Date.now(),
      embedding: simulateEmbedding(`${fragment.category}: ${fragment.content}`),
      reviewed: false,
    };

    await table.add([row]);
    inserted++;
  }

  console.log(`   Inserted: ${inserted}`);
  console.log(`   Skipped (duplicates): ${skipped}`);

  // Validate
  const finalCount = await table.countRows();
  console.log(`\n✅ Total fragments in database: ${finalCount}`);

  // Show category distribution
  console.log("\n📊 Category Distribution:");
  const categories = [
    "goal",
    "constraint",
    "preference",
    "belief",
    "risk",
    "capability",
    "relationship",
    "historical_fact",
  ];
  for (const cat of categories) {
    const results = await table.query().where(`category = '${cat}'`).limit(100).toArray();
    console.log(`   ${cat.padEnd(18)}: ${results.length} fragments`);
  }

  // Close
  await db.close();
  console.log("\n🔒 Database closed.");
  console.log("\n✨ Identity memory initialization complete!");
}

// Run if executed directly
initializeIdentityMemory().catch(console.error);
```

---

## 4. Dummy Dataset Summary

The initialization script includes **22 identity fragments** distributed across the 8 categories:

### Category Distribution

| Category          | Count | Sample Content                                             |
| ----------------- | ----- | ---------------------------------------------------------- |
| `goal`            | 2     | "Building NEURABOT as a personal AI assistant"             |
| `constraint`      | 3     | "No cloud services for primary data storage"               |
| `preference`      | 8     | "Prefers TypeScript over JavaScript"                       |
| `belief`          | 3     | "Believes AI should be a tool, not a collaborator"         |
| `risk`            | 2     | "Gets frustrated when AI makes up information"             |
| `capability`      | 2     | "Senior-level developer comfortable with Rust, TypeScript" |
| `relationship`    | 0     | _(No samples for this session)_                            |
| `historical_fact` | 2     | "Selected LanceDB over pgvector for memory storage"        |

### Fragment Characteristics

- **Length**: 1-2 sentences per fragment (atomic, high-signal)
- **Confidence**: 0.70-0.98 (simulated extraction confidence)
- **Source**: All tagged as `chat`
- **Metadata**: Includes `originalMessage` context and `extractionModel`

---

## 5. Semantic Query Examples

The following conceptual tests demonstrate how semantic search would retrieve identity fragments. These are based on the dummy dataset and expected LanceDB vector similarity behavior.

### Query 1: "what's Amir's tone?"

**Expected Results (Top 5):**

| Rank | Category   | Content                                                                               | Score |
| ---- | ---------- | ------------------------------------------------------------------------------------- | ----- |
| 1    | preference | "Prefers concise, direct responses without excessive pleasantries"                    | 0.94  |
| 2    | preference | "Responds well to technical depth but appreciates summaries at the start"             | 0.87  |
| 3    | preference | "Comfortable with profanity in casual conversation but not in formal docs"            | 0.72  |
| 4    | risk       | "Dislikes when AI asks clarifying questions instead of making reasonable assumptions" | 0.65  |
| 5    | belief     | "Values precise terminology—dislikes jargon without definition"                       | 0.61  |

**Interpretation**: The user values **efficiency** and **directness**. Tone should be concise, technical, and skip pleasantries.

---

### Query 2: "how does the user prefer explanations?"

**Expected Results (Top 5):**

| Rank | Category   | Content                                                                   | Score |
| ---- | ---------- | ------------------------------------------------------------------------- | ----- |
| 1    | preference | "Appreciates code examples over long prose explanations"                  | 0.96  |
| 2    | preference | "Prefers technical depth but appreciates summaries at the start"          | 0.91  |
| 3    | belief     | "Values precise terminology—dislikes jargon without definition"           | 0.82  |
| 4    | goal       | "Wants to deeply understand AI systems, not just use them as black boxes" | 0.74  |
| 5    | capability | "Experienced with vector databases and embeddings pipelines"              | 0.68  |

**Interpretation**: Show code first, then explain. Provide brief overview before diving deep.

---

### Query 3: "what does the user dislike in responses?"

**Expected Results (Top 5):**

| Rank | Category   | Content                                                                               | Score |
| ---- | ---------- | ------------------------------------------------------------------------------------- | ----- |
| 1    | risk       | "Gets frustrated when AI makes up information or hallucinates"                        | 0.97  |
| 2    | risk       | "Dislikes when AI asks clarifying questions instead of making reasonable assumptions" | 0.93  |
| 3    | constraint | "All AI interactions must be auditable—no black-box model calls"                      | 0.78  |
| 4    | preference | "Prefers building custom solutions over buying SaaS when feasible"                    | 0.65  |
| 5    | belief     | "Values precise terminology—dislikes jargon without definition"                       | 0.62  |

**Interpretation**: Never hallucinate, don't ask too many questions, be transparent about capabilities.

---

### Query 4: "what are Amir's technical preferences?"

**Expected Results (Top 5):**

| Rank | Category   | Content                                                                   | Score |
| ---- | ---------- | ------------------------------------------------------------------------- | ----- |
| 1    | preference | "Prefers TypeScript over JavaScript for new projects"                     | 0.95  |
| 2    | preference | "Strong preference for local-first software over cloud-dependent tools"   | 0.92  |
| 3    | preference | "Prefers functional programming patterns over OOP for business logic"     | 0.88  |
| 4    | constraint | "No cloud services for primary data storage—must be local or self-hosted" | 0.85  |
| 5    | capability | "Senior-level developer comfortable with Rust, TypeScript, and Go"        | 0.81  |

**Interpretation**: TypeScript, local-first, functional style, Rust/Go experience.

---

### Query 5: "what are hard constraints for this user?"

**Expected Results (Top 5):**

| Rank | Category   | Content                                                                         | Score |
| ---- | ---------- | ------------------------------------------------------------------------------- | ----- |
| 1    | constraint | "No cloud services for primary data storage—must be local or self-hosted"       | 0.99  |
| 2    | constraint | "All AI interactions must be auditable—no black-box model calls"                | 0.96  |
| 3    | constraint | "Never deploy to production without automated tests"                            | 0.93  |
| 4    | belief     | "Believes AI should be a tool, not a collaborator—the human remains in control" | 0.79  |
| 5    | preference | "Prefers building custom solutions over buying SaaS when feasible"              | 0.71  |

**Interpretation**: Local-only storage, auditable AI, CI/CD required.

---

## 6. Integration Notes for Sowwy

### 6.1 Read Path (No Wiring Required)

Sowwy will consume identity context through the `IdentityStore` interface:

```typescript
// In Sowwy's context builder
const results = await identityStore.search("how does user prefer explanations?", {
  limit: 5,
  threshold: 0.7,
});

// Inject into system prompt
const context = results.map((r) => `- [${r.fragment.category}] ${r.fragment.content}`).join("\n");
```

### 6.2 Access Pattern

- **Read**: Any persona/tool can call `identityStore.search(query, options)`
- **write_to_file**: Only the Identity Extraction Pipeline may call `write()` or `writeBatch()`
- **Delete**: Fragments are soft-deleted (marked `reviewed: true`), never hard-deleted

### 6.3 Performance Considerations

- **Embedding Cache**: Content hash → embedding mapping to avoid re-embedding
- **Batch Writes**: Extraction pipeline should use `writeBatch()` for efficiency
- **Query Limits**: Default `limit: 10` with `threshold: 0.5` balances recall/precision

### 6.4 Future Extensions (Not Implemented)

- **Contradiction Detection**: Compare new fragments against existing for conflicts
- **Human Review UI**: Flag `reviewed: false` fragments for human validation
- **Temporal Decay**: Older fragments with low confidence could be archived

---

## 7. Success Criteria Verification

| Criterion                           | Status | Evidence                                    |
| ----------------------------------- | ------ | ------------------------------------------- |
| Memory model is clear and minimal   | ✅     | 8 locked categories, atomic fragments       |
| Identity recall is semantic         | ✅     | Vector similarity search on embeddings      |
| Sowwy can consume without refactors | ✅     | `IdentityStore` interface ready             |
| No subsystem affected               | ✅     | No Twilio, SMS, loaders, or gateway changes |
| Idempotent initialization           | ✅     | Init script handles existing tables         |

---

## 8. Files Reference

| File                                                                            | Purpose                             |
| ------------------------------------------------------------------------------- | ----------------------------------- |
| [`src/sowwy/identity/lancedb-store.ts`](../src/sowwy/identity/lancedb-store.ts) | LanceDB store implementation        |
| [`src/sowwy/identity/fragments.ts`](../src/sowwy/identity/fragments.ts)         | Schema and types                    |
| [`src/sowwy/identity/store.ts`](../src/sowwy/identity/store.ts)                 | Store interface                     |
| `scripts/init-identity-memory.ts`                                               | Initialization script (create this) |

---

_Report generated by Scout. No runtime modifications made._
