/**
 * Sowwy Memory - Extraction Pipeline
 *
 * Extracts preferences, decisions, and identity fragments from conversations.
 * Uses rule-based patterns and LLM-based extraction for comprehensive coverage.
 *
 * ⚠️ WRITE ACCESS:
 * Only this pipeline may write to memory stores (enforced by stores).
 */

import type { LanceDBMemoryStore } from "./lancedb-store.js";
import type { IdentityCategory, PostgresMemoryStore } from "./pg-store.js";

// ============================================================================
// Types
// ============================================================================

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

export interface ExtractedPreference {
  category: IdentityCategory;
  preference: string;
  strength: number; // -1 to 1
  evidence: Array<{ source: string; timestamp: Date }>;
}

export interface ExtractedDecision {
  decision: string;
  context: string | null;
  confidence: number | null;
}

export interface ExtractedMemory {
  category: IdentityCategory;
  content: string;
  confidence: number;
  source: string;
}

// ============================================================================
// Extraction Pipeline
// ============================================================================

export class MemoryExtractionPipeline {
  constructor(
    private pgStore: PostgresMemoryStore,
    private lanceStore: LanceDBMemoryStore,
  ) {}

  /**
   * Process conversation and extract memory fragments
   */
  async processConversation(
    messages: Message[],
    source: string = "conversation",
  ): Promise<{
    preferences: ExtractedPreference[];
    decisions: ExtractedDecision[];
    memories: ExtractedMemory[];
  }> {
    // Extract explicit preferences
    const preferences = this.extractPreferences(messages, source);

    // Extract decisions
    const decisions = this.extractDecisions(messages);

    // Extract general memory fragments
    const memories = this.extractMemories(messages, source);

    // Store in PostgreSQL
    for (const pref of preferences) {
      await this.pgStore.upsertPreference(pref);
    }

    for (const decision of decisions) {
      await this.pgStore.createDecision({
        decision: decision.decision,
        context: decision.context ?? undefined,
        confidence: decision.confidence ?? undefined,
      });
    }

    // Store memory entries with embeddings
    for (const memory of memories) {
      const memoryId = await this.pgStore.upsertMemoryEntry({
        category: memory.category,
        content: memory.content,
        confidence: memory.confidence,
        source: memory.source,
      });

      // Generate and store embedding
      await this.lanceStore.addEmbedding(memoryId, memory.category, memory.content);
    }

    return { preferences, decisions, memories };
  }

  /**
   * Extract preferences from messages using pattern matching
   */
  private extractPreferences(messages: Message[], source: string): ExtractedPreference[] {
    const preferences: ExtractedPreference[] = [];
    const patterns = [
      {
        regex: /I (?:prefer|like|want|need|always|never)\s+(.+?)(?:\.|$)/gi,
        category: "preference" as IdentityCategory,
        strength: 0.7,
      },
      {
        regex: /(?:please|always|never)\s+(.+?)(?:\.|$)/gi,
        category: "preference" as IdentityCategory,
        strength: 0.8,
      },
      {
        regex: /my (?:preference|style|approach) is\s+(.+?)(?:\.|$)/gi,
        category: "preference" as IdentityCategory,
        strength: 0.9,
      },
      {
        regex: /I (?:don't|do not) (?:like|want|need)\s+(.+?)(?:\.|$)/gi,
        category: "preference" as IdentityCategory,
        strength: -0.7,
      },
      {
        regex: /(?:must|should|have to)\s+(.+?)(?:\.|$)/gi,
        category: "constraint" as IdentityCategory,
        strength: 1.0,
      },
      {
        regex: /(?:cannot|cannot|can't|must not)\s+(.+?)(?:\.|$)/gi,
        category: "constraint" as IdentityCategory,
        strength: -1.0,
      },
    ];

    for (const message of messages) {
      if (message.role !== "user") {
        continue;
      }

      for (const pattern of patterns) {
        const matches = [...message.content.matchAll(pattern.regex)];
        for (const match of matches) {
          const preference = match[1]?.trim();
          if (!preference || preference.length < 3) {
            continue;
          }

          preferences.push({
            category: pattern.category,
            preference,
            strength: pattern.strength,
            evidence: [
              {
                source,
                timestamp: message.timestamp ?? new Date(),
              },
            ],
          });
        }
      }
    }

    return preferences;
  }

  /**
   * Extract decisions from messages
   */
  private extractDecisions(messages: Message[]): ExtractedDecision[] {
    const decisions: ExtractedDecision[] = [];
    const patterns = [
      {
        regex: /(?:decided|choosing|going with|selected)\s+(.+?)(?:\.|$)/gi,
        confidence: 0.8,
      },
      {
        regex: /(?:let's|we should|I'll)\s+(.+?)(?:\.|$)/gi,
        confidence: 0.7,
      },
      {
        regex: /(?:will|going to)\s+(.+?)(?:\.|$)/gi,
        confidence: 0.6,
      },
    ];

    for (const message of messages) {
      if (message.role !== "user") {
        continue;
      }

      for (const pattern of patterns) {
        const matches = [...message.content.matchAll(pattern.regex)];
        for (const match of matches) {
          const decision = match[1]?.trim();
          if (!decision || decision.length < 3) {
            continue;
          }

          // Try to extract context from surrounding messages
          const context = this.extractContext(messages, message);

          decisions.push({
            decision,
            context,
            confidence: pattern.confidence,
          });
        }
      }
    }

    return decisions;
  }

  /**
   * Extract general memory fragments
   */
  private extractMemories(messages: Message[], source: string): ExtractedMemory[] {
    const memories: ExtractedMemory[] = [];

    // Look for factual statements
    const factPatterns = [
      {
        regex: /(?:I|we|my|our)\s+(?:am|is|are|have|had|was|were)\s+(.+?)(?:\.|$)/gi,
        category: "historical_fact" as IdentityCategory,
        confidence: 0.7,
      },
      {
        regex: /(?:I|we)\s+(?:can|know|understand|believe)\s+(.+?)(?:\.|$)/gi,
        category: "capability" as IdentityCategory,
        confidence: 0.8,
      },
      {
        regex: /(?:goal|objective|aim)\s+(?:is|to)\s+(.+?)(?:\.|$)/gi,
        category: "goal" as IdentityCategory,
        confidence: 0.9,
      },
    ];

    for (const message of messages) {
      if (message.role !== "user") {
        continue;
      }

      for (const pattern of factPatterns) {
        const matches = [...message.content.matchAll(pattern.regex)];
        for (const match of matches) {
          const content = match[1]?.trim();
          if (!content || content.length < 5) {
            continue;
          }

          memories.push({
            category: pattern.category,
            content,
            confidence: pattern.confidence,
            source,
          });
        }
      }
    }

    return memories;
  }

  /**
   * Extract context from surrounding messages
   */
  private extractContext(messages: Message[], currentMessage: Message): string | null {
    const currentIndex = messages.indexOf(currentMessage);
    if (currentIndex === -1) {
      return null;
    }

    // Get previous 2 messages for context
    const contextMessages = messages.slice(Math.max(0, currentIndex - 2), currentIndex);

    if (contextMessages.length === 0) {
      return null;
    }

    return contextMessages
      .map((m) => m.content)
      .join(" ")
      .slice(0, 500); // Limit context length
  }
}
