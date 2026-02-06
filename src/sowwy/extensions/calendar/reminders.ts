/**
 * Reminder Scheduler
 *
 * Checks upcoming events and sends Telegram reminders.
 */

import type { ExtensionFoundation } from "../integration.js";
import type { CalendarProvider, CalendarEvent } from "./provider.js";

export class ReminderScheduler {
  private interval: ReturnType<typeof setInterval> | null = null;
  private reminderMinutes: number;

  constructor(
    private foundation: ExtensionFoundation,
    private provider: CalendarProvider,
  ) {
    this.reminderMinutes = parseInt(process.env.CALENDAR_REMINDER_MINUTES || "15", 10);
  }

  async start(): Promise<void> {
    // Check every minute for upcoming events
    this.interval = setInterval(() => {
      this.checkUpcomingEvents().catch((error) => {
        console.error("[ReminderScheduler] Error:", error);
      });
    }, 60_000);

    // Initial check
    await this.checkUpcomingEvents();
  }

  async stop(): Promise<void> {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async checkUpcomingEvents(): Promise<void> {
    const now = new Date();
    const reminderTime = new Date(now.getTime() + this.reminderMinutes * 60 * 1000);

    try {
      const events = await this.provider.list(now, reminderTime);
      for (const event of events) {
        // Check if reminder already sent (would need to track this)
        // For now, send reminder for events starting within reminder window
        const timeUntilEvent = event.start.getTime() - now.getTime();
        if (timeUntilEvent > 0 && timeUntilEvent <= this.reminderMinutes * 60 * 1000) {
          await this.sendReminder(event);
        }
      }
    } catch (error) {
      console.error("[ReminderScheduler] Failed to check events:", error);
    }
  }

  private async sendReminder(event: CalendarEvent): Promise<void> {
    const taskStore = this.foundation.getTaskStore();
    await taskStore.create({
      title: `Reminder: ${event.title}`,
      description: `Event: ${event.title}\nStarts: ${event.start.toISOString()}\n${event.description || ""}`,
      category: "ADMIN",
      personaOwner: "ChiefOfStaff",
      urgency: 5,
      importance: 4,
      risk: 1,
      stressCost: 1,
      requiresApproval: false,
      maxRetries: 1,
      dependencies: [],
      contextLinks: {},
      payload: {
        action: "send_telegram_reminder",
        event: {
          title: event.title,
          start: event.start.toISOString(),
          description: event.description,
        },
      },
      createdBy: "calendar-reminder-scheduler",
    });
  }
}
