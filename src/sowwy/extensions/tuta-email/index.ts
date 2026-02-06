/**
 * Tuta Mail Extension for Sowwy
 *
 * Provides email reading, importance classification, Telegram notifications,
 * and email sending (approval-gated) via Tuta Mail IMAP/SMTP bridge.
 */

import type { Task } from "../../mission-control/schema.js";
import type {
  ExecutorResult,
  ExtensionFoundation,
  ExtensionLifecycle,
  PersonaExecutor,
} from "../integration.js";
import { AGENT_LANE_NESTED } from "../../../agents/lanes.js";
import { runAgentStep } from "../../../agents/tools/agent-step.js";
import { ImportanceClassifier } from "./classifier.js";
import { ImapAdapter } from "./imap-adapter.js";
import { TelegramNotifier } from "./telegram-notify.js";

export class TutaEmailExtension implements ExtensionLifecycle {
  private foundation: ExtensionFoundation | null = null;
  private imapAdapter: ImapAdapter | null = null;
  private classifier: ImportanceClassifier | null = null;
  private notifier: TelegramNotifier | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  async initialize(foundation: ExtensionFoundation): Promise<void> {
    this.foundation = foundation;

    const imapHost = process.env.TUTA_IMAP_HOST;
    const imapPort = parseInt(process.env.TUTA_IMAP_PORT || "993", 10);
    const imapUser = process.env.TUTA_IMAP_USER;
    const imapPassword = process.env.TUTA_IMAP_PASSWORD;

    if (!imapHost || !imapUser || !imapPassword) {
      console.warn("Tuta Email Extension: Missing IMAP credentials in environment variables.");
      return;
    }

    // Initialize components
    this.imapAdapter = new ImapAdapter({
      host: imapHost,
      port: imapPort,
      user: imapUser,
      password: imapPassword,
    });

    this.classifier = new ImportanceClassifier({
      importantSenders: process.env.TUTA_IMPORTANT_SENDERS?.split(",") || [],
      importantKeywords: process.env.TUTA_IMPORTANT_KEYWORDS?.split(",") || [],
    });

    this.notifier = new TelegramNotifier(foundation);

    // Register persona executor for email tasks
    foundation.registerPersonaExecutor("ChiefOfStaff", this.createExecutor());

    // Start polling for new emails
    const pollIntervalMs = parseInt(process.env.TUTA_POLL_INTERVAL_MS || "60000", 10);
    this.pollInterval = setInterval(() => {
      this.pollForNewEmails().catch((error) => {
        console.error("[TutaEmail] Poll error:", error);
      });
    }, pollIntervalMs);

    // Initial poll
    await this.pollForNewEmails();

    console.log("Tuta Email Extension: Initialized successfully.");
  }

  async shutdown(): Promise<void> {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.imapAdapter) {
      await this.imapAdapter.close();
      this.imapAdapter = null;
    }
    this.foundation = null;
  }

  async tick(): Promise<void> {
    // Polling handled by setInterval
  }

  private async pollForNewEmails(): Promise<void> {
    if (!this.imapAdapter || !this.classifier || !this.notifier || !this.foundation) {
      return;
    }

    try {
      const emails = await this.imapAdapter.fetchNewEmails();
      for (const email of emails) {
        const isImportant = await this.classifier.isImportant(email);
        if (isImportant) {
          await this.notifier.notifyImportantEmail(email);
        }
      }
    } catch (error) {
      console.error("[TutaEmail] Error polling emails:", error);
    }
  }

  private createExecutor(): PersonaExecutor {
    return {
      persona: "ChiefOfStaff",
      canHandle: (task: Task) => task.category === "EMAIL",
      execute: async (task, context) => {
        if (!this.foundation) {
          return {
            success: false,
            outcome: "FAILED",
            summary: "Extension not initialized",
            confidence: 0,
            error: "Extension not initialized",
          };
        }

        // Check SMT quota
        if (!this.foundation.canProceed("tuta_email.execute")) {
          return {
            success: false,
            outcome: "BLOCKED",
            summary: "SMT quota exhausted",
            confidence: 0,
            error: "SMT throttled",
          };
        }

        context.smt.recordUsage("tuta_email.execute");

        try {
          const systemPrompt = `You are NEURABOT ChiefOfStaff persona handling email tasks.

Task: ${task.title}
${task.description ? `Description: ${task.description}` : ""}
${task.payload ? `Payload: ${JSON.stringify(task.payload)}` : ""}

${context.identityContext ? `\nUser Context:\n${context.identityContext}` : ""}

IMPORTANT: All email sends require approval. Draft the email content and request approval before sending.`;

          const sessionKey = `tuta-email-${task.taskId}-${Date.now()}`;
          const replyText = await runAgentStep({
            sessionKey,
            message: task.description || task.title,
            extraSystemPrompt: systemPrompt,
            timeoutMs: 120_000,
            lane: AGENT_LANE_NESTED,
          });

          await context.audit.log({
            action: "tuta_email_executed",
            details: {
              taskId: task.taskId,
              summary: replyText?.substring(0, 200) || "No reply",
            },
          });

          return {
            success: true,
            outcome: "COMPLETED",
            summary: replyText || "Task executed",
            confidence: replyText ? 0.8 : 0.5,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          await context.audit.log({
            action: "tuta_email_execution_failed",
            details: {
              taskId: task.taskId,
              error: errorMessage,
            },
          });

          return {
            success: false,
            outcome: "ABORTED",
            summary: `Execution failed: ${errorMessage}`,
            confidence: 0,
            error: errorMessage,
          };
        }
      },
    };
  }
}
