import type { ExtensionFoundation, ExtensionLifecycle } from "./integration.js";
import { TwilioSMSExtension } from "./twilio-sms.js";

/**
 * Extension Loader
 *
 * Manages the lifecycle of all Sowwy extensions.
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
  }

  async shutdown(): Promise<void> {
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
