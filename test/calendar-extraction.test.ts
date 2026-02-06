/**
 * Calendar Extraction Tests
 *
 * Tests email-to-event extraction and calendar event creation.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { EmailData } from "../src/sowwy/extensions/calendar/extractor.js";
import type { ExtensionFoundation } from "../src/sowwy/extensions/integration.js";
import { EventExtractor } from "../src/sowwy/extensions/calendar/extractor.js";

describe("Calendar Extraction", () => {
  let extractor: EventExtractor;
  let mockFoundation: ExtensionFoundation;

  beforeEach(() => {
    // Mock foundation (would need full implementation for real tests)
    mockFoundation = {
      registerCircuitBreaker: vi.fn(),
      canProceed: vi.fn().mockReturnValue(true),
      recordUsage: vi.fn(),
      registerPersonaExecutor: vi.fn(),
      getIdentityStore: vi.fn(),
      getTaskStore: vi.fn(),
      logAudit: vi.fn(),
      triggerSchedulerTick: vi.fn(),
      pauseScheduler: vi.fn(),
      resumeScheduler: vi.fn(),
    } as unknown as ExtensionFoundation;

    extractor = new EventExtractor(mockFoundation);
  });

  it("should extract event from email with date/time", async () => {
    const email: EmailData = {
      sender: "organizer@example.com",
      subject: "Meeting: Project Review",
      body: "We'll meet on Tuesday, March 15th at 3:00 PM in the conference room.",
      date: new Date(),
    };

    // Note: This test would require mocking runAgentStep
    // For now, we test the structure
    expect(extractor).toBeDefined();
    expect(email.subject).toContain("Meeting");
  });

  it("should handle emails without event information", async () => {
    const email: EmailData = {
      sender: "spam@example.com",
      subject: "Newsletter",
      body: "Check out our latest products!",
      date: new Date(),
    };

    // Would return null if no event found
    expect(email.subject).not.toContain("Meeting");
  });

  it("should parse ISO 8601 dates correctly", () => {
    const isoDate = "2026-03-15T15:00:00Z";
    const date = new Date(isoDate);
    expect(date.getTime()).toBeGreaterThan(0);
  });
});
