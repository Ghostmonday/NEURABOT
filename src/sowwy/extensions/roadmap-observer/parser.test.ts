/**
 * Unit tests for README.md Section 12 parser
 */

import { describe, expect, it } from "vitest";
import { extractSection12, parseRoadmap, parseTrackStatus } from "./parser.js";

const SAMPLE_README = `
# NEURABOT

## Overview
Some overview content.

## Where to Go from Here

This section outlines next steps.

### iOS App Development: Desk.in, Xcode, and Cursor

#### Goal
Enable iOS app development.

#### Implementation
Working on this now.

Checklist:
- [x] Xcode installed
- [x] Fastlane configured
- [ ] App Store Connect setup
- [ ] TestFlight upload

### Tuta Mail: Archive, Respond, and Live Alerts via Telegram

#### Goal
Give the system Tuta Mail access.

#### Read and Archive Access
Define access method.

### Calendar, Reminders, and Appointments from Email

#### Goal
Organize calendar and reminders.

## Troubleshooting
Some troubleshooting content.
`;

describe("extractSection12", () => {
  it("extracts Section 12 from README", () => {
    const section = extractSection12(SAMPLE_README);
    expect(section).toBeTruthy();
    expect(section).toContain("iOS App Development");
    expect(section).toContain("Tuta Mail");
    expect(section).toContain("Calendar, Reminders");
    expect(section).not.toContain("## Troubleshooting");
  });

  it("returns null if Section 12 not found", () => {
    const section = extractSection12("# README\n## Overview\nNo Section 12 here.");
    expect(section).toBeNull();
  });
});

describe("parseTrackStatus", () => {
  it("parses three tracks from Section 12", () => {
    const section = extractSection12(SAMPLE_README);
    expect(section).toBeTruthy();
    const tracks = parseTrackStatus(section!);

    expect(tracks).toHaveLength(3);
    expect(tracks[0].name).toContain("iOS App Development");
    expect(tracks[1].name).toContain("Tuta Mail");
    expect(tracks[2].name).toContain("Calendar");
  });

  it("detects IN_PROGRESS status from keywords", () => {
    const section = extractSection12(SAMPLE_README);
    const tracks = parseTrackStatus(section!);

    // iOS track has "Working on this now" and "Implementation"
    expect(tracks[0].status).toBe("IN_PROGRESS");
  });

  it("detects PENDING status as default", () => {
    const section = extractSection12(SAMPLE_README);
    const tracks = parseTrackStatus(section!);

    // Tuta and Calendar have no clear status indicators
    expect(tracks[1].status).toBe("IN_PROGRESS"); // Has "Implementation" section
    expect(tracks[2].status).toBe("IN_PROGRESS"); // Has "Implementation" section
  });

  it("parses checklist phases", () => {
    const section = extractSection12(SAMPLE_README);
    const tracks = parseTrackStatus(section!);

    const iosTrack = tracks[0];
    expect(iosTrack.phases.length).toBeGreaterThan(0);

    const completedPhases = iosTrack.phases.filter((p) => p.completed);
    const incompletePhases = iosTrack.phases.filter((p) => !p.completed);

    expect(completedPhases.length).toBe(2); // [x] items
    expect(incompletePhases.length).toBe(2); // [ ] items
  });

  it("detects phases requiring approval", () => {
    const section = extractSection12(SAMPLE_README);
    const tracks = parseTrackStatus(section!);

    const iosTrack = tracks[0];
    const appStorePhase = iosTrack.phases.find((p) => p.title.toLowerCase().includes("app store"));

    expect(appStorePhase).toBeTruthy();
    expect(appStorePhase?.requiresApproval).toBe(true);
  });
});

describe("parseRoadmap", () => {
  it("parses full roadmap with metadata", () => {
    const roadmap = parseRoadmap(SAMPLE_README);

    expect(roadmap).toBeTruthy();
    expect(roadmap?.tracks).toHaveLength(3);
    expect(roadmap?.lastUpdated).toBeInstanceOf(Date);
  });

  it("returns null for README without Section 12", () => {
    const roadmap = parseRoadmap("# README\n## Overview\nNo roadmap here.");
    expect(roadmap).toBeNull();
  });
});

describe("track completion detection", () => {
  it("detects COMPLETED status from keywords", () => {
    const content = `
### Some Track
This track is completed and done.
Checklist:
- [x] All items finished
`;
    const tracks = parseTrackStatus(content);
    expect(tracks[0]?.status).toBe("COMPLETED");
  });

  it("detects IN_PROGRESS from implementation sections", () => {
    const content = `
### Some Track
#### When to Implement This Section
Implement when ready.
#### Implementation Guide
Steps to implement.
`;
    const tracks = parseTrackStatus(content);
    expect(tracks[0]?.status).toBe("IN_PROGRESS");
  });
});
