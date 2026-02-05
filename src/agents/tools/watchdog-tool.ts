/**
 * Watchdog Control Tool
 *
 * Allows agents to control the gateway watchdog daemon.
 * Used for ensuring gateway restarts during self-modification.
 */

import { Type } from "@sinclair/typebox";
import { execSync } from "node:child_process";
import { stringEnum } from "../schema/typebox.js";
import { type AnyAgentTool, jsonResult, readStringParam } from "./common.js";

const WATCHDOG_ACTIONS = ["start", "stop", "status", "restart-gateway"] as const;

const WatchdogToolSchema = Type.Object({
  action: stringEnum(WATCHDOG_ACTIONS),
});

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve watchdog script relative to this file
const WATCHDOG_SCRIPT = join(
  __dirname,
  "..",
  "..",
  "..",
  "scripts",
  "systemd",
  "gateway-watchdog.sh",
);

// Project root for cwd (3 levels up from src/agents/tools/)
const PROJECT_ROOT = join(__dirname, "..", "..", "..");

export function createWatchdogTool(): AnyAgentTool {
  return {
    label: "Watchdog",
    name: "watchdog",
    description: `Control the gateway watchdog daemon that monitors and restarts the gateway.

ACTIONS:
- start: Start the watchdog daemon (monitors gateway, auto-restarts if down)
- stop: Stop the watchdog daemon
- status: Check if watchdog is running and gateway status
- restart-gateway: Manually trigger gateway restart

USE CASE:
When you request a self-modification reload, you can:
1. Start watchdog before reload (ensures restart happens)
2. Request self_modify reload
3. Stop watchdog after successful restart (optional)

The watchdog automatically:
- Checks gateway every 30 seconds
- Builds UI assets and TypeScript if needed
- Restarts gateway if it goes down
- Logs to /tmp/openclaw-watchdog.log`,
    parameters: WatchdogToolSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const action = readStringParam(params, "action", { required: true });

      try {
        let result: string;

        switch (action) {
          case "start": {
            // Start watchdog with auto-stop disabled (keep running)
            result = execSync(`${WATCHDOG_SCRIPT} start`, {
              encoding: "utf-8",
              cwd: PROJECT_ROOT,
            }).trim();
            return jsonResult({
              ok: true,
              message: "Watchdog started",
              output: result,
            });
          }

          case "stop": {
            result = execSync(`${WATCHDOG_SCRIPT} stop`, {
              encoding: "utf-8",
              cwd: PROJECT_ROOT,
            }).trim();
            return jsonResult({
              ok: true,
              message: "Watchdog stopped",
              output: result,
            });
          }

          case "status": {
            try {
              result = execSync(`${WATCHDOG_SCRIPT} status`, {
                encoding: "utf-8",
                cwd: PROJECT_ROOT,
              }).trim();
              const isRunning = !result.includes("not running");
              return jsonResult({
                ok: true,
                running: isRunning,
                message: result,
              });
            } catch {
              return jsonResult({
                ok: true,
                running: false,
                message: "Watchdog is not running",
              });
            }
          }

          case "restart-gateway": {
            result = execSync(`${WATCHDOG_SCRIPT} restart-gateway`, {
              encoding: "utf-8",
              cwd: PROJECT_ROOT,
            }).trim();
            return jsonResult({
              ok: true,
              message: "Gateway restart triggered",
              output: result,
            });
          }

          default:
            throw new Error(`Unknown action: ${action}`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return jsonResult({
          ok: false,
          error: errorMsg,
        });
      }
    },
  };
}
