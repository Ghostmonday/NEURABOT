/**
 * Calendar Provider Interface
 *
 * Abstracts calendar backend (Google Calendar, CalDAV, Apple Calendar).
 */

export interface CalendarEvent {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  attendees?: string[];
}

export interface CalendarProviderConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export class CalendarProvider {
  constructor(private config: CalendarProviderConfig) {}

  async create(event: CalendarEvent): Promise<CalendarEvent> {
    // TODO: Implement Google Calendar API create
    throw new Error("Not implemented");
  }

  async list(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    // TODO: Implement Google Calendar API list
    throw new Error("Not implemented");
  }

  async update(eventId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    // TODO: Implement Google Calendar API update
    throw new Error("Not implemented");
  }

  async delete(eventId: string): Promise<void> {
    // TODO: Implement Google Calendar API delete
    throw new Error("Not implemented");
  }
}
