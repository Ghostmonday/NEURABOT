import pkg from "twilio";
import type { Task } from "../mission-control/schema.js";
import type { ExtensionFoundation, ExtensionLifecycle, PersonaExecutor } from "./integration.js";
const { Twilio } = pkg;

/**
 * Twilio SMS Extension for Sowwy
 *
 * Provides sms.send capability via Twilio API.
 */
export class TwilioSMSExtension implements ExtensionLifecycle {
  private client: InstanceType<typeof Twilio> | null = null;
  private foundation: ExtensionFoundation | null = null;
  private breaker: { execute: <T>(fn: () => Promise<T>) => Promise<T> } | null = null;

  async initialize(foundation: ExtensionFoundation): Promise<void> {
    this.foundation = foundation;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !phoneNumber) {
      console.warn("Twilio SMS Extension: Missing credentials in environment variables.");
      return;
    }

    this.client = new Twilio(accountSid, authToken);
    this.breaker = foundation.registerCircuitBreaker("twilio");

    foundation.registerPersonaExecutor("Dev", this.createExecutor());
    foundation.registerPersonaExecutor("Sowwy", this.createExecutor()); // Sowwy persona can also send SMS

    console.log("Twilio SMS Extension: Initialized successfully.");
  }

  async shutdown(): Promise<void> {
    this.client = null;
  }

  async tick(): Promise<void> {
    // No background work needed for now
  }

  private createExecutor(): PersonaExecutor {
    return {
      persona: "Any", // Generic executor or specific persona
      canHandle: (task: Task) => (task.category as string) === "SMS" || task.command === "sms.send",
      execute: async (task, context) => {
        if (!this.client || !this.breaker) {
          return {
            success: false,
            outcome: "FAILED",
            summary: "Twilio client not initialized",
            confidence: 0,
            error: "Twilio client not initialized",
          };
        }

        const { to, body } = task.payload as { to: string; body: string };

        if (!to || !body) {
          return {
            success: false,
            outcome: "INVALID_PAYLOAD",
            summary: "Missing 'to' or 'body' in task payload",
            confidence: 0,
            error: "Missing 'to' or 'body'",
          };
        }

        try {
          const result = await this.breaker.execute(async () => {
            return await this.client!.messages.create({
              body,
              to,
              from: process.env.TWILIO_PHONE_NUMBER,
            });
          });

          await context.audit.log({
            action: "SMS_SENT",
            details: { message: `SMS sent to ${to}`, sid: result.sid, to, body },
          });

          return {
            success: true,
            outcome: "COMPLETED",
            summary: `SMS sent successfully to ${to}. SID: ${result.sid}`,
            confidence: 1.0,
          };
        } catch (error: unknown) {
          return {
            success: false,
            outcome: "FAILED",
            summary: `Failed to send SMS to ${to}`,
            confidence: 0,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    };
  }
}
