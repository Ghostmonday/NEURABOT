#!/usr/bin/env node
/**
 * PM2 Crash-Loop Sentinel
 *
 * Monitors PM2 process events and detects crash loops.
 * If neurabot-gateway restarts 5+ times within 60 seconds, triggers rollback.
 */

const pm2 = require("pm2");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const GATEWAY_APP_NAME = "neurabot-gateway";
const CRASH_THRESHOLD = 5; // Restarts before triggering rollback
const CRASH_WINDOW_MS = 60000; // 60 seconds
const LOG_FILE = path.join(__dirname, "../logs/sentinel.log");

// Track restart timestamps
const restartTimestamps = [];

function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logLine);
  console.log(`[sentinel] ${message}`);
}

function getLastKnownGoodCommit() {
  try {
    // Try to read from restart sentinel if it exists
    const sentinelPath = path.join(
      process.env.HOME || "/home/amir",
      ".openclaw/restart-sentinel.json",
    );
    if (fs.existsSync(sentinelPath)) {
      const sentinel = JSON.parse(fs.readFileSync(sentinelPath, "utf8"));
      if (sentinel.stats?.before?.rollbackCommit) {
        return sentinel.stats.before.rollbackCommit;
      }
    }
    // Fallback: use HEAD~1 (previous commit)
    return execSync("git rev-parse HEAD~1", { cwd: __dirname + "/..", encoding: "utf8" }).trim();
  } catch (err) {
    log(`ERROR: Could not determine last known good commit: ${err.message}`);
    return null;
  }
}

function triggerRollback(commit) {
  log(`⚠️  CRASH LOOP DETECTED! Triggering rollback to commit ${commit}`);
  try {
    const repoRoot = path.join(__dirname, "..");
    execSync(`git checkout ${commit}`, { cwd: repoRoot, stdio: "inherit" });
    log(`✅ Rollback complete. Restarting gateway...`);
    pm2.restart(GATEWAY_APP_NAME, (err) => {
      if (err) {
        log(`ERROR: Failed to restart gateway: ${err.message}`);
      } else {
        log(`Gateway restarted after rollback`);
      }
    });
  } catch (err) {
    log(`ERROR: Rollback failed: ${err.message}`);
  }
}

function checkCrashLoop() {
  const now = Date.now();
  // Remove timestamps outside the window
  while (restartTimestamps.length > 0 && now - restartTimestamps[0] > CRASH_WINDOW_MS) {
    restartTimestamps.shift();
  }

  if (restartTimestamps.length >= CRASH_THRESHOLD) {
    log(`🚨 Crash loop detected: ${restartTimestamps.length} restarts in ${CRASH_WINDOW_MS}ms`);
    const commit = getLastKnownGoodCommit();
    if (commit) {
      triggerRollback(commit);
    } else {
      log(`ERROR: Cannot rollback - no known good commit`);
    }
    // Clear timestamps after triggering rollback
    restartTimestamps.length = 0;
  }
}

// Connect to PM2
pm2.connect((err) => {
  if (err) {
    console.error(`[sentinel] Failed to connect to PM2: ${err.message}`);
    process.exit(1);
  }

  log(`Sentinel started, monitoring ${GATEWAY_APP_NAME}`);

  // Listen to PM2 events
  pm2.launchBus((err, bus) => {
    if (err) {
      console.error(`[sentinel] Failed to launch PM2 bus: ${err.message}`);
      process.exit(1);
    }

    bus.on("process:event", (packet) => {
      if (packet.process?.name === GATEWAY_APP_NAME) {
        if (packet.event === "restart") {
          const timestamp = Date.now();
          restartTimestamps.push(timestamp);
          log(`Gateway restarted (${restartTimestamps.length} restarts in window)`);
          checkCrashLoop();
        } else if (packet.event === "online") {
          log(`Gateway online`);
        } else if (packet.event === "stop") {
          log(`Gateway stopped`);
        }
      }
    });

    log(`Listening for PM2 events...`);
  });
});

// Graceful shutdown
process.on("SIGINT", () => {
  log(`Shutting down...`);
  pm2.disconnect();
  process.exit(0);
});
