/**
 * README.md Section 12 Parser
 *
 * Extracts and parses the "Where to Go from Here" roadmap section to determine
 * track completion status for autonomous task generation.
 */

export type TrackStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export type Track = {
  id: string;
  name: string;
  status: TrackStatus;
  phases: TrackPhase[];
};

export type TrackPhase = {
  id: string;
  title: string;
  completed: boolean;
  requiresApproval: boolean;
};

export type RoadmapParse = {
  tracks: Track[];
  lastUpdated: Date;
};

/**
 * Extract Section 12 from README.md
 */
export function extractSection12(readmeContent: string): string | null {
  // Find "## Where to Go from Here" section
  const section12Match = readmeContent.match(
    /##\s+Where to Go from Here\s*\n([\s\S]*?)(?=\n##\s+|$)/i,
  );

  if (!section12Match) {
    return null;
  }

  return section12Match[1].trim();
}

/**
 * Parse track status from section content
 */
export function parseTrackStatus(sectionContent: string): Track[] {
  const tracks: Track[] = [];

  // Track 1: iOS App Development
  const iosMatch = sectionContent.match(/###\s+iOS App Development[:\s]+([^#]*?)(?=###|$)/is);
  if (iosMatch) {
    tracks.push({
      id: "track-1-ios",
      name: "iOS App Development: Desk.in, Xcode, and Cursor",
      status: detectTrackStatus(iosMatch[1]),
      phases: parsePhases(iosMatch[1], "ios"),
    });
  }

  // Track 2: Tuta Mail
  const tutaMatch = sectionContent.match(/###\s+Tuta Mail[:\s]+([^#]*?)(?=###|$)/is);
  if (tutaMatch) {
    tracks.push({
      id: "track-2-tuta",
      name: "Tuta Mail: Archive, Respond, and Live Alerts via Telegram",
      status: detectTrackStatus(tutaMatch[1]),
      phases: parsePhases(tutaMatch[1], "tuta"),
    });
  }

  // Track 3: Calendar
  const calendarMatch = sectionContent.match(
    /###\s+Calendar[,\s]+Reminders[^#]*?([^#]*?)(?=###|$)/is,
  );
  if (calendarMatch) {
    tracks.push({
      id: "track-3-calendar",
      name: "Calendar, Reminders, and Appointments from Email",
      status: detectTrackStatus(calendarMatch[1]),
      phases: parsePhases(calendarMatch[1], "calendar"),
    });
  }

  return tracks;
}

/**
 * Detect track status from content keywords and patterns
 */
function detectTrackStatus(content: string): TrackStatus {
  const lowerContent = content.toLowerCase();

  // More specific completion indicators (must include status keyword)
  if (/\b(status:|completed|done|finished|✓|✅)\b/.test(lowerContent)) {
    return "COMPLETED";
  }

  // Look for active work indicators (not just "implementation" text)
  if (/\b(currently|actively|now working|in progress)\b/.test(lowerContent)) {
    return "IN_PROGRESS";
  }

  // Default to PENDING for tracks with phases to implement
  return "PENDING";
}

/**
 * Parse phases/steps from track content
 */
function parsePhases(content: string, trackType: string): TrackPhase[] {
  const phases: TrackPhase[] = [];

  // Look for checklist items: - [ ] or - [x]
  const checklistMatches = content.matchAll(/- \[([ xX])\]\s+(.+?)(?=\n|$)/g);
  let phaseIndex = 0;

  for (const match of checklistMatches) {
    const completed = match[1].toLowerCase() === "x";
    const title = match[2].trim();

    // Detect high-risk operations that need approval
    const requiresApproval =
      title.toLowerCase().includes("app store") ||
      title.toLowerCase().includes("submit") ||
      title.toLowerCase().includes("deploy") ||
      title.toLowerCase().includes("production") ||
      title.toLowerCase().includes("email") ||
      title.toLowerCase().includes("send");

    phases.push({
      id: `${trackType}-phase-${++phaseIndex}`,
      title,
      completed,
      requiresApproval,
    });
  }

  // If no checklists found, look for numbered/heading steps
  if (phases.length === 0) {
    const stepMatches = content.matchAll(/(?:####\s+|Step\s+\d+[:\s]+|\d+\.\s+)(.+?)(?=\n|$)/gi);
    phaseIndex = 0;

    for (const match of stepMatches) {
      const title = match[1].trim();
      if (title.length > 5) {
        // Avoid false matches
        const requiresApproval =
          title.toLowerCase().includes("app store") ||
          title.toLowerCase().includes("submit") ||
          title.toLowerCase().includes("deploy") ||
          title.toLowerCase().includes("email");

        phases.push({
          id: `${trackType}-phase-${++phaseIndex}`,
          title,
          completed: false, // Can't detect completion without checklists
          requiresApproval,
        });
      }
    }
  }

  return phases;
}

/**
 * Main parse function
 */
export function parseRoadmap(readmeContent: string): RoadmapParse | null {
  const section12 = extractSection12(readmeContent);
  if (!section12) {
    return null;
  }

  const tracks = parseTrackStatus(section12);

  return {
    tracks,
    lastUpdated: new Date(),
  };
}
