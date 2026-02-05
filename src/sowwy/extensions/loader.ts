import type { ExtensionFoundation, ExtensionLifecycle } from "./integration.js";
import { startOverseer, stopOverseer } from "./overseer/index.js";
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

    // Initialize all
    for (const extension of this.extensions) {
      try {
        await extension.initialize(this.foundation);
      } catch (error: unknown) {
        console.error(`Failed to initialize extension: ${String(error)}`);
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

export { recordPattern, getPatternSuccessRate, getOverseerStatus } from "./overseer/index.js";
