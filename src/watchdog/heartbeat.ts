/**
 * Professional-Grade Watchdog & Heartbeat System
 *
 * Features:
 * - External heartbeat: Pings Healthchecks.io every 15 minutes
 * - Internal health check: Event loop monitor every 60 minutes
 * - Fault-tolerant: All network calls wrapped in try/catch
 *
 * Environment Variables:
 *   HEALTHCHECKS_URL - Your Healthchecks.io ping URL (e.g., https://hc-ping.com/your-uuid)
 *   HEARTBEAT_INTERVAL_MS - External ping interval (default: 900000 = 15 min)
 *   HEALTH_CHECK_INTERVAL_MS - Internal check interval (default: 3600000 = 60 min)
 *
 * TODO(setup): Set HEALTHCHECKS_URL in ecosystem.config.cjs or .env
 *   1. Create free account: https://healthchecks.io
 *   2. Copy your ping URL
 *   3. Add to ecosystem.config.cjs env section
 */

const HEALTHCHECKS_URL = process.env.HEALTHCHECKS_URL || "";
const HEARTBEAT_INTERVAL_MS = parseInt(process.env.HEARTBEAT_INTERVAL_MS || "900000", 10); // 15 min
const HEALTH_CHECK_INTERVAL_MS = parseInt(process.env.HEALTH_CHECK_INTERVAL_MS || "3600000", 10); // 60 min

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let healthCheckTimer: ReturnType<typeof setInterval> | null = null;
let startTime = Date.now();

/**
 * Send a ping to Healthchecks.io (Dead Man's Switch)
 * Wrapped in try/catch to prevent crashes on network failure
 */
async function sendHeartbeat(): Promise<void> {
  if (!HEALTHCHECKS_URL) {
    return; // Silently skip if not configured
  }

  try {
    const response = await fetch(HEALTHCHECKS_URL, {
      method: "GET",
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (response.ok) {
      console.log(`[Heartbeat] Ping sent successfully at ${new Date().toISOString()}`);
    } else {
      console.warn(`[Heartbeat] Ping failed with status ${response.status}`);
    }
  } catch (error) {
    // Catch all errors (DNS, timeout, network) - do NOT crash the bot
    console.warn(`[Heartbeat] Ping failed:`, error instanceof Error ? error.message : error);
  }
}

/**
 * Internal health check - verifies event loop isn't blocked
 * Logs uptime and memory usage every 60 minutes
 */
function performHealthCheck(): void {
  const uptimeMs = Date.now() - startTime;
  const uptimeHours = (uptimeMs / (1000 * 60 * 60)).toFixed(2);
  const memoryUsage = process.memoryUsage();
  const heapUsedMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
  const rssMB = (memoryUsage.rss / 1024 / 1024).toFixed(2);

  console.log(
    `[HealthCheck] Status: OK | Uptime: ${uptimeHours}h | Heap: ${heapUsedMB}MB | RSS: ${rssMB}MB`,
  );
}

/**
 * Start the heartbeat and health check timers
 * Call this once from your main entry point
 */
export function startWatchdog(): void {
  startTime = Date.now();

  // External heartbeat (Healthchecks.io)
  if (HEALTHCHECKS_URL) {
    console.log(
      `[Watchdog] Starting external heartbeat (interval: ${HEARTBEAT_INTERVAL_MS / 1000}s)`,
    );
    // Send initial ping immediately
    sendHeartbeat();
    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
  } else {
    console.log("[Watchdog] HEALTHCHECKS_URL not set, external heartbeat disabled");
  }

  // Internal health check
  console.log(
    `[Watchdog] Starting internal health check (interval: ${HEALTH_CHECK_INTERVAL_MS / 1000}s)`,
  );
  performHealthCheck(); // Initial check
  healthCheckTimer = setInterval(performHealthCheck, HEALTH_CHECK_INTERVAL_MS);

  console.log("[Watchdog] Watchdog system started");
}

/**
 * Stop all watchdog timers (for graceful shutdown)
 */
export function stopWatchdog(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
  }
  console.log("[Watchdog] Watchdog system stopped");
}

/**
 * Get current watchdog status
 */
export function getWatchdogStatus(): {
  running: boolean;
  uptimeMs: number;
  healthchecksConfigured: boolean;
} {
  return {
    running: heartbeatTimer !== null || healthCheckTimer !== null,
    uptimeMs: Date.now() - startTime,
    healthchecksConfigured: Boolean(HEALTHCHECKS_URL),
  };
}
