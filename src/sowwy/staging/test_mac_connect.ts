/**
 * Track 1 (iOS App Factory) — Phase 1: Remote Mac connectivity test.
 *
 * Sandbox script: verifies SSH connectivity to the host defined by REMOTE_MAC_HOST
 * by running `sw_vers` (macOS version). Used to validate "Remote Hand Architecture"
 * (README §12.1) before attempting builds.
 *
 * Constraints: Staging only. Do NOT edit ecosystem.config.cjs. Do NOT deploy to active_tools.
 *
 * Usage:
 *   REMOTE_MAC_HOST=user@mac.local pnpm exec tsx src/sowwy/staging/test_mac_connect.ts
 *   # or after build:
 *   REMOTE_MAC_HOST=user@mac.local node dist/sowwy/staging/test_mac_connect.js
 */

import { spawn } from "node:child_process";

const REMOTE_MAC_HOST = process.env.REMOTE_MAC_HOST?.trim();
const REMOTE_MAC_IDENTITY = process.env.REMOTE_MAC_IDENTITY?.trim();

function main(): void {
  if (!REMOTE_MAC_HOST) {
    console.error("Missing REMOTE_MAC_HOST. Set it in .env or:");
    console.error("  REMOTE_MAC_HOST=user@host pnpm exec tsx src/sowwy/staging/test_mac_connect.ts");
    process.exit(1);
  }

  // Avoid argument injection: target must not look like an SSH option
  if (REMOTE_MAC_HOST.startsWith("-")) {
    console.error("Invalid REMOTE_MAC_HOST: must not start with '-'");
    process.exit(1);
  }

  const args: string[] = [
    "-o",
    "BatchMode=yes",
    "-o",
    "ConnectTimeout=10",
    REMOTE_MAC_HOST,
    "sw_vers",
  ];
  if (REMOTE_MAC_IDENTITY) {
    args.unshift("-i", REMOTE_MAC_IDENTITY);
  }

  const proc = spawn("ssh", args, {
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  proc.stdout?.on("data", (chunk: Buffer) => {
    stdout += chunk.toString();
  });
  proc.stderr?.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });

  proc.on("close", (code, signal) => {
    if (code === 0) {
      console.log("macOS version (sw_vers):");
      console.log(stdout.trim());
      process.exit(0);
    }
    console.error("SSH command failed.");
    if (stderr) console.error("stderr:", stderr.trim());
    if (stdout) console.error("stdout:", stdout.trim());
    console.error("Exit code:", code ?? "null", signal ? `signal: ${signal}` : "");
    process.exit(code ?? 1);
  });

  proc.on("error", (err) => {
    console.error("Failed to run ssh:", err.message);
    console.error("Ensure ssh is installed and REMOTE_MAC_HOST is reachable.");
    process.exit(1);
  });
}

main();
