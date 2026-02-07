import type { ExtensionFoundation, ExtensionLifecycle } from "./integration.js";
import { ContinuousSelfModifyExtension } from "./continuous-self-modify/index.js";
import { startOverseer, stopOverseer } from "./overseer/index.js";
import { PersonaChiefOfStaffExtension } from "./persona-cos/index.js";
import { PersonaDevExtension } from "./persona-dev/index.js";
import { PersonaLegalOpsExtension } from "./persona-legal/index.js";
import { PersonaRnDExtension } from "./persona-rnd/index.js";
import { RoadmapObserverExtension } from "./roadmap-observer/index.js";
import { TutaEmailExtension } from "./tuta-email/index.js";
import { TwilioSMSExtension } from "./twilio-sms.js";

/**
 * Extension Loader
 *
 * Manages the lifecycle of all Sowwy extensions.
 * Foundry Overseer: Hourly scheduler for autonomous self-improvement.
 * - Prunes stale patterns (unused > 7 days)
 * - Tracks tool sequence success rates
 * - Crystallizes high-value patterns (>80% success) to extensions/foundry-crystallized/
 */
export class ExtensionLoader {
  private extensions: ExtensionLifecycle[] = [];

  constructor(private foundation: ExtensionFoundation) {}

  async load(): Promise<void> {
    // Register extensions here
    this.extensions.push(new TwilioSMSExtension());
    this.extensions.push(new RoadmapObserverExtension());
    this.extensions.push(new ContinuousSelfModifyExtension());

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
        // Silently skip failed extensions
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
}

export { getOverseerStatus, getPatternSuccessRate, recordPattern } from "./overseer/index.js";
