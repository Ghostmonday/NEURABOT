/**
 * Email-to-Event Extractor
 *
 * Extracts calendar events from email content using LLM.
 */

import type { ExtensionFoundation } from "../integration.js";
import type { CalendarEvent } from "./provider.js";
import { AGENT_LANE_NESTED } from "../../../agents/lanes.js";
import { runAgentStep } from "../../../agents/tools/agent-step.js";

export interface EmailData {
  sender: string;
  subject: string;
  body: string;
  date: Date;
}

export class EventExtractor {
  constructor(private foundation: ExtensionFoundation) {}

  async extractFromEmail(email: EmailData): Promise<CalendarEvent | null> {
    const systemPrompt = `Extract calendar event information from this email.

Email:
From: ${email.sender}
Subject: ${email.subject}
Body: ${email.body}

Return a JSON object with:
- title: Event title
- start: ISO 8601 datetime
- end: ISO 8601 datetime (or null if not specified)
- description: Event description
- location: Location if mentioned
- attendees: Array of attendee emails if mentioned

If no event information is found, return null.`;

    const sessionKey = `event-extract-${Date.now()}`;
    const replyText = await runAgentStep({
      sessionKey,
      message: `Extract event from email:\n\nSubject: ${email.subject}\n\n${email.body}`,
      extraSystemPrompt: systemPrompt,
      timeoutMs: 60_000,
      lane: AGENT_LANE_NESTED,
    });

    if (!replyText) {
      return null;
    }

    try {
      // Try to parse JSON from reply
      const jsonMatch = replyText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const event = JSON.parse(jsonMatch[0]);
        return {
          title: event.title,
          start: new Date(event.start),
          end: event.end ? new Date(event.end) : new Date(event.start),
          description: event.description,
          location: event.location,
          attendees: event.attendees,
        };
      }
    } catch {
      // Parsing failed
    }

    return null;
  }
}
