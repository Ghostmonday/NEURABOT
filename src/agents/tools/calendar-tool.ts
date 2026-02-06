/**
 * Calendar Tool for Agents
 *
 * Exposes calendar operations to the agent runner.
 */

import type { Tool } from "../tools.js";

export const calendarTool: Tool = {
  name: "calendar",
  description: "Manage calendar events (create, list, update)",
  parameters: {
    action: {
      type: "string",
      enum: ["create", "list", "update", "delete"],
      description: "Action to perform",
    },
    title: {
      type: "string",
      description: "Event title (required for create/update)",
    },
    start: {
      type: "string",
      description: "Start time (ISO 8601)",
    },
    end: {
      type: "string",
      description: "End time (ISO 8601)",
    },
    description: {
      type: "string",
      description: "Event description",
    },
    location: {
      type: "string",
      description: "Event location",
    },
    eventId: {
      type: "string",
      description: "Event ID (required for update/delete)",
    },
  },
  async execute(params: Record<string, unknown>): Promise<unknown> {
    // TODO: Implement calendar operations via extension
    // This would call the CalendarExtension's provider
    throw new Error("Calendar tool not yet implemented - requires CalendarExtension");
  },
};
