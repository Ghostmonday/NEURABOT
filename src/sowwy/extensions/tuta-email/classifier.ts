/**
 * Importance Classifier for Tuta Email
 *
 * Determines if an email is important based on sender allowlist and keywords.
 */

import type { EmailMessage } from "./imap-adapter.js";

export interface ImportanceClassifierConfig {
  importantSenders: string[];
  importantKeywords: string[];
}

export class ImportanceClassifier {
  constructor(private config: ImportanceClassifierConfig) {}

  async isImportant(email: EmailMessage): Promise<boolean> {
    // Check sender allowlist
    for (const sender of this.config.importantSenders) {
      if (email.sender.toLowerCase().includes(sender.toLowerCase())) {
        return true;
      }
    }

    // Check keywords in subject or body
    const text = `${email.subject} ${email.body}`.toLowerCase();
    for (const keyword of this.config.importantKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        return true;
      }
    }

    return false;
  }
}
