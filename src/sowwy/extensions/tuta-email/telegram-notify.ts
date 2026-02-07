/**
 * Telegram Notifier for Tuta Email
 *
 * Sends important email notifications via Telegram channel.
 */

import type { ExtensionFoundation } from "../integration.js";
import type { EmailMessage } from "./imap-adapter.js";

export class TelegramNotifier {
  constructor(private foundation: ExtensionFoundation) {}

  async notifyImportantEmail(email: EmailMessage): Promise<void> {
    // Create a task to send Telegram notification
    // The ChiefOfStaff executor will handle sending via Telegram channel
    const taskStore = this.foundation.getTaskStore();
    await taskStore.create({
      title: `Important email: ${email.subject}`,
      description: `From: ${email.sender}\nSubject: ${email.subject}\n\n${email.body.substring(0, 500)}`,
      category: "EMAIL",
      personaOwner: "ChiefOfStaff",
      urgency: 5,
      importance: 5,
      risk: 1,
      stressCost: 1,
      requiresApproval: false,
      maxRetries: 1,
      dependencies: [],
      contextLinks: {},
      payload: {
        action: "notify_telegram",
        email: {
          sender: email.sender,
          subject: email.subject,
          body: email.body,
          date: email.date.toISOString(),
        },
      },
      createdBy: "tuta-email-extension",
    });
  }
}
