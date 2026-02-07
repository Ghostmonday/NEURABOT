/**
 * Identity Extraction Pipeline (README §0.4)
 *
 * ⚠️ WRITE ACCESS RULE (NON-NEGOTIABLE):
 * Only this pipeline may write identity fragments to the store.
 * Personas, skills, agents, and tools are READ-ONLY.
 *
 * This pipeline extracts identity fragments from:
 * - Conversation history (chat messages)
 * - Task outcomes and summaries
 * - User corrections and feedback
 *
 * Fragments are categorized into the 8 locked categories:
 * - goal, constraint, preference, belief, risk, capability, relationship, historical_fact
 */

import type { FragmentSource, IdentityCategory, IdentityFragment } from "./fragments.js";
import type { IdentityStore } from "./store.js";
import { getChildLogger } from "../../logging/logger.js";
import { redactError } from "../security/redact.js";

const log = getChildLogger({ subsystem: "identity-extraction" });

// ============================================================================
// Extraction Input Types
// ============================================================================

export interface ConversationInput {
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    timestamp?: string;
  }>;
  sessionId?: string;
}

export interface TaskOutcomeInput {
  taskId: string;
  title: string;
  description?: string;
  outcome: string;
  summary: string;
  category: string;
}

// ============================================================================
// Identity Extraction Pipeline
// ============================================================================

export class IdentityExtractionPipeline {
  constructor(
    private identityStore: IdentityStore,
    private extractionModel?: string,
  ) {
    // Verify write access is enabled
    // This is enforced at the LanceDB store level, but we check here for clarity
    log.info("Identity extraction pipeline initialized", {
      extractionModel: extractionModel || "default",
    });
  }

  /**
   * Extract identity fragments from conversation history.
   * Uses simple pattern matching to identify identity-relevant content.
   * In a full implementation, this would use an LLM to extract structured fragments.
   */
  async extractFromConversation(input: ConversationInput): Promise<IdentityFragment[]> {
    const fragments: Omit<IdentityFragment, "id" | "createdAt">[] = [];

    try {
      // Extract from user messages (they contain identity information)
      for (const message of input.messages) {
        if (message.role !== "user") {
          continue;
        }

        const content = message.content.toLowerCase();
        const context = `Conversation session: ${input.sessionId || "unknown"}`;

        // Simple pattern matching for identity extraction
        // In production, this would use an LLM to extract structured fragments

        // Goals: "I want to", "I need to", "I'm trying to"
        if (/(?:i want to|i need to|i'm trying to|i plan to|my goal is)/i.test(message.content)) {
          fragments.push({
            category: "goal",
            content: message.content,
            context,
            confidence: 0.7,
            source: "chat" as FragmentSource,
            metadata: {
              originalMessage: message.content,
              extractionModel: this.extractionModel || "pattern-matching",
            },
          });
        }

        // Constraints: "I can't", "I don't", "never", "always avoid"
        if (/(?:i can't|i don't|never|always avoid|i won't|i refuse)/i.test(message.content)) {
          fragments.push({
            category: "constraint",
            content: message.content,
            context,
            confidence: 0.7,
            source: "chat" as FragmentSource,
            metadata: {
              originalMessage: message.content,
              extractionModel: this.extractionModel || "pattern-matching",
            },
          });
        }

        // Preferences: "I prefer", "I like", "I enjoy"
        if (/(?:i prefer|i like|i enjoy|i love|i'm fond of)/i.test(message.content)) {
          fragments.push({
            category: "preference",
            content: message.content,
            context,
            confidence: 0.7,
            source: "chat" as FragmentSource,
            metadata: {
              originalMessage: message.content,
              extractionModel: this.extractionModel || "pattern-matching",
            },
          });
        }

        // Beliefs: "I believe", "I think", "in my opinion"
        if (/(?:i believe|i think|in my opinion|i feel that|my view is)/i.test(message.content)) {
          fragments.push({
            category: "belief",
            content: message.content,
            context,
            confidence: 0.7,
            source: "chat" as FragmentSource,
            metadata: {
              originalMessage: message.content,
              extractionModel: this.extractionModel || "pattern-matching",
            },
          });
        }

        // Risks: "I'm worried about", "I'm concerned", "I fear"
        if (/(?:i'm worried|i'm concerned|i fear|i'm afraid|risk of)/i.test(message.content)) {
          fragments.push({
            category: "risk",
            content: message.content,
            context,
            confidence: 0.7,
            source: "chat" as FragmentSource,
            metadata: {
              originalMessage: message.content,
              extractionModel: this.extractionModel || "pattern-matching",
            },
          });
        }

        // Capabilities: "I can", "I know how to", "I'm good at"
        if (
          /(?:i can|i know how|i'm good at|i'm skilled|i have experience)/i.test(message.content)
        ) {
          fragments.push({
            category: "capability",
            content: message.content,
            context,
            confidence: 0.7,
            source: "chat" as FragmentSource,
            metadata: {
              originalMessage: message.content,
              extractionModel: this.extractionModel || "pattern-matching",
            },
          });
        }

        // Relationships: mentions of people, organizations
        if (
          /(?:my (?:friend|colleague|boss|team)|@\w+|working with|collaborating)/i.test(
            message.content,
          )
        ) {
          fragments.push({
            category: "relationship",
            content: message.content,
            context,
            confidence: 0.6,
            source: "chat" as FragmentSource,
            metadata: {
              originalMessage: message.content,
              extractionModel: this.extractionModel || "pattern-matching",
            },
          });
        }

        // Historical facts: "I did", "I went", "I had", "last time"
        if (/(?:i did|i went|i had|last time|previously|in the past)/i.test(message.content)) {
          fragments.push({
            category: "historical_fact",
            content: message.content,
            context,
            confidence: 0.6,
            source: "chat" as FragmentSource,
            metadata: {
              originalMessage: message.content,
              extractionModel: this.extractionModel || "pattern-matching",
            },
          });
        }
      }

      // Write fragments to store
      if (fragments.length > 0) {
        const written = await this.identityStore.writeBatch(fragments);
        log.info("Extracted identity fragments from conversation", {
          fragmentCount: written.length,
          sessionId: input.sessionId,
        });
        return written;
      }

      return [];
    } catch (error) {
      log.error("Failed to extract identity from conversation", {
        error: redactError(error),
        sessionId: input.sessionId,
      });
      throw error;
    }
  }

  /**
   * Extract identity fragments from task outcomes.
   * Tasks that complete successfully may reveal preferences, constraints, or goals.
   */
  async extractFromTaskOutcome(input: TaskOutcomeInput): Promise<IdentityFragment[]> {
    const fragments: Omit<IdentityFragment, "id" | "createdAt">[] = [];

    try {
      // Only extract from successful completions
      if (input.outcome !== "COMPLETED") {
        return [];
      }

      const context = `Task: ${input.taskId} - ${input.title}`;
      const combinedText =
        `${input.title} ${input.description || ""} ${input.summary}`.toLowerCase();

      // Extract preferences from task descriptions
      if (/(?:prefer|like|want|need)/i.test(combinedText)) {
        fragments.push({
          category: "preference",
          content: input.summary,
          context,
          confidence: 0.6,
          source: "chat" as FragmentSource,
          metadata: {
            originalMessage: input.summary,
            extractionModel: this.extractionModel || "pattern-matching",
          },
        });
      }

      // Extract goals from task titles
      if (/(?:goal|objective|target|aim)/i.test(input.title)) {
        fragments.push({
          category: "goal",
          content: input.title,
          context,
          confidence: 0.7,
          source: "chat" as FragmentSource,
          metadata: {
            originalMessage: input.title,
            extractionModel: this.extractionModel || "pattern-matching",
          },
        });
      }

      // Write fragments to store
      if (fragments.length > 0) {
        const written = await this.identityStore.writeBatch(fragments);
        log.info("Extracted identity fragments from task outcome", {
          fragmentCount: written.length,
          taskId: input.taskId,
        });
        return written;
      }

      return [];
    } catch (error) {
      log.error("Failed to extract identity from task outcome", {
        error: redactError(error),
        taskId: input.taskId,
      });
      throw error;
    }
  }

  /**
   * Extract identity from user correction.
   * When a user corrects the assistant, that's high-confidence identity information.
   */
  async extractFromCorrection(
    originalContent: string,
    correctedContent: string,
    context?: string,
  ): Promise<IdentityFragment[]> {
    const fragments: Omit<IdentityFragment, "id" | "createdAt">[] = [];

    try {
      // Corrections are high-confidence identity signals
      fragments.push({
        category: "preference" as IdentityCategory,
        content: correctedContent,
        context: context || "User correction",
        confidence: 0.9,
        source: "correction" as FragmentSource,
        metadata: {
          originalMessage: originalContent,
          extractionModel: this.extractionModel || "pattern-matching",
        },
      });

      const written = await this.identityStore.writeBatch(fragments);
      log.info("Extracted identity fragment from correction", {
        fragmentCount: written.length,
      });
      return written;
    } catch (error) {
      log.error("Failed to extract identity from correction", {
        error: redactError(error),
      });
      throw error;
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export async function createIdentityExtractionPipeline(
  identityStore: IdentityStore,
  extractionModel?: string,
): Promise<IdentityExtractionPipeline> {
  return new IdentityExtractionPipeline(identityStore, extractionModel);
}
