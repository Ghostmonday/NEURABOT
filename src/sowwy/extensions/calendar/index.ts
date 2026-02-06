/**
 * Calendar Extension for Sowwy
 *
 * Provides calendar integration (Google Calendar), email-to-event extraction,
 * and reminder scheduling via Telegram.
 */

import type { ExtensionFoundation, ExtensionLifecycle } from "../integration.js";
import { EventExtractor } from "./extractor.js";
import { CalendarProvider } from "./provider.js";
import { ReminderScheduler } from "./reminders.js";

export class CalendarExtension implements ExtensionLifecycle {
  private foundation: ExtensionFoundation | null = null;
  private provider: CalendarProvider | null = null;
  private extractor: EventExtractor | null = null;
  private reminderScheduler: ReminderScheduler | null = null;

  async initialize(foundation: ExtensionFoundation): Promise<void> {
    this.foundation = foundation;

    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      console.warn("Calendar Extension: Missing Google Calendar credentials.");
      return;
    }

    this.provider = new CalendarProvider({
      clientId,
      clientSecret,
      refreshToken,
    });

    this.extractor = new EventExtractor(foundation);
    this.reminderScheduler = new ReminderScheduler(foundation, this.provider);

    // Start reminder scheduler
    await this.reminderScheduler.start();

    console.log("Calendar Extension: Initialized successfully.");
  }

  async shutdown(): Promise<void> {
    if (this.reminderScheduler) {
      await this.reminderScheduler.stop();
    }
    this.foundation = null;
  }

  async tick(): Promise<void> {
    // Reminder scheduler handles its own timing
  }
}
