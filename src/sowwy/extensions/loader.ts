import type { ExtensionFoundation, ExtensionLifecycle } from "./integration.js";
import { getChildLogger } from "../../logging/logger.js";
import { ContinuousSelfModifyExtension } from "./continuous-self-modify/index.js";
import { IdentityExtractionExtension } from "./identity-extraction/index.js";
import { startOverseer, stopOverseer } from "./overseer/index.js";
import { PersonaChiefOfStaffExtension } from "./persona-cos/index.js";
import { PersonaDevExtension } from "./persona-dev/index.js";
import { PersonaLegalOpsExtension } from "./persona-legal/index.js";
import { PersonaRnDExtension } from "./persona-rnd/index.js";
import { RoadmapObserverExtension } from "./roadmap-observer/index.js";
import { TutaEmailExtension } from "./tuta-email/index.js";
import { TwilioSMSExtension } from "./twilio-sms.js";

/**
 * @fileoverview Extension Loader
 *
 * Manages the lifecycle of all Sowwy extensions.
 * Provides initialization, shutdown, and periodic tick functionality.
 *
 * Features:
 * - Extension registration and initialization
 * - Persona executor registration (Dev, ChiefOfStaff, LegalOps, RnD)
 * - Foundry Overseer for autonomous self-improvement
 *
 * Foundry Overseer: Hourly scheduler for autonomous self-improvement.
 * - Prunes stale patterns (unused > 7 days)
 * - Tracks tool sequence success rates
 * - Crystallizes high-value patterns (>80% success) to extensions/foundry-crystallized/
 */
export class ExtensionLoader {
  private readonly log = getChildLogger({ subsystem: "extension-loader" });
  private extensions: ExtensionLifecycle[] = [];

  constructor(private foundation: ExtensionFoundation) {}
  /**
   * Creates a new ExtensionLoader with the given foundation.
   * @param foundation - The ExtensionFoundation instance for extensions to use
   */

  async load(): Promise<void> {
    // Register extensions here
    this.extensions.push(new TwilioSMSExtension());
    this.extensions.push(new RoadmapObserverExtension());
    this.extensions.push(new ContinuousSelfModifyExtension());

    // Identity extraction (must have write access to identity store)
    this.extensions.push(new IdentityExtractionExtension());

    // Persona executors
    this.extensions.push(new PersonaDevExtension());
    this.extensions.push(new PersonaChiefOfStaffExtension());
    this.extensions.push(new PersonaLegalOpsExtension());
    this.extensions.push(new PersonaRnDExtension());

    // Email integration
    this.extensions.push(new TutaEmailExtension());

    // Initialize all
    for (const extension of this.extensions) {
      try {
        await extension.initialize(this.foundation);
      } catch (error: unknown) {
        this.log.error("Extension failed to initialize", {
          extension: extension.constructor.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Start Foundry Overseer for autonomous self-improvement
    startOverseer();
  }

  async shutdown(): Promise<void> {
    stopOverseer();
    for (const extension of this.extensions) {
      await extension.shutdown();
    }
    this.extensions = [];
  }

  async tick(): Promise<void> {
    for (const extension of this.extensions) {
      await extension.tick();
    }
  }

  /**
   * Get all loaded extensions (for wiring purposes).
   */
  getExtensions(): ExtensionLifecycle[] {
    return [...this.extensions];
  }
}

export { getOverseerStatus, getPatternSuccessRate, recordPattern } from "./overseer/index.js";
