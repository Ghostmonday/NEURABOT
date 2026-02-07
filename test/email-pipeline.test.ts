/**
 * Email Pipeline Tests
 *
 * Tests the email processing pipeline: IMAP -> classifier -> Telegram notification.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { EmailMessage } from "../src/sowwy/extensions/tuta-email/imap-adapter.js";
import { ExtensionFoundationImpl } from "../src/sowwy/extensions/foundation.js";
import { ImportanceClassifier } from "../src/sowwy/extensions/tuta-email/classifier.js";
import { TelegramNotifier } from "../src/sowwy/extensions/tuta-email/telegram-notify.js";
import { createStubIdentityStore } from "../src/sowwy/identity/store-stub.js";
import { TaskScheduler } from "../src/sowwy/mission-control/scheduler.js";
import { createInMemoryStores } from "../src/sowwy/mission-control/store.js";
import { SMTThrottler } from "../src/sowwy/smt/throttler.js";

describe("Email Pipeline", () => {
  let classifier: ImportanceClassifier;
  let notifier: TelegramNotifier;
  let foundation: ExtensionFoundationImpl;

  beforeEach(() => {
    const stores = createInMemoryStores();
    const identityStore = createStubIdentityStore();
    const smt = new SMTThrottler({
      windowMs: 60000,
      maxPrompts: 100,
      targetUtilization: 0.8,
      reservePercent: 0.1,
    });
    const scheduler = new TaskScheduler(stores.tasks, identityStore, smt, {
      pollIntervalMs: 1000,
      maxRetries: 3,
      stuckTaskThresholdMs: 1000,
      maxConcurrentPerPersona: 1,
    });

    foundation = new ExtensionFoundationImpl(
      scheduler,
      smt,
      identityStore,
      stores.tasks,
      stores.audit,
    );

    classifier = new ImportanceClassifier({
      importantSenders: ["important@example.com", "boss@company.com"],
      importantKeywords: ["urgent", "invoice", "meeting"],
    });

    notifier = new TelegramNotifier(foundation);
  });

  it("should classify important emails by sender", async () => {
    const email: EmailMessage = {
      uid: 1,
      sender: "important@example.com",
      subject: "Regular subject",
      body: "Regular body",
      date: new Date(),
    };

    const isImportant = await classifier.isImportant(email);
    expect(isImportant).toBe(true);
  });

  it("should classify important emails by keyword", async () => {
    const email: EmailMessage = {
      uid: 2,
      sender: "someone@example.com",
      subject: "URGENT: Meeting tomorrow",
      body: "Please attend",
      date: new Date(),
    };

    const isImportant = await classifier.isImportant(email);
    expect(isImportant).toBe(true);
  });

  it("should not classify regular emails as important", async () => {
    const email: EmailMessage = {
      uid: 3,
      sender: "spam@example.com",
      subject: "Regular newsletter",
      body: "Check out our products",
      date: new Date(),
    };

    const isImportant = await classifier.isImportant(email);
    expect(isImportant).toBe(false);
  });

  it("should create notification task for important emails", async () => {
    const email: EmailMessage = {
      uid: 4,
      sender: "important@example.com",
      subject: "Important message",
      body: "This is important",
      date: new Date(),
    };

    await notifier.notifyImportantEmail(email);

    const taskStore = foundation.getTaskStore();
    const tasks = await taskStore.list({ category: "EMAIL" });
    expect(tasks.length).toBeGreaterThan(0);

    const notificationTask = tasks.find((t) => t.title.includes(email.subject));
    expect(notificationTask).toBeDefined();
    expect(notificationTask?.personaOwner).toBe("ChiefOfStaff");
  });
});
