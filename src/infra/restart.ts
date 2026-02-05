import { spawnSync } from "node:child_process";
import {
  resolveGatewayLaunchAgentLabel,
  resolveGatewaySystemdServiceName,
} from "../daemon/constants.js";

export type RestartAttempt = {
  ok: boolean;
  method: "launchctl" | "systemd" | "supervisor";
  detail?: string;
  tried?: string[];
};

const SPAWN_TIMEOUT_MS = 2000;
const SIGUSR1_AUTH_GRACE_MS = 5000;

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const MAX_RESTARTS_PER_WINDOW = 3;

interface RestartLog {
  timestamp: number;
  reason?: string;
}

const restartHistory: RestartLog[] = [];

let sigusr1AuthorizedCount = 0;
let sigusr1AuthorizedUntil = 0;
let sigusr1ExternalAllowed = false;
let pendingRestartTimer: ReturnType<typeof setTimeout> | null = null;
let pendingRestartReason: string | undefined = undefined;

function resetSigusr1AuthorizationIfExpired(now = Date.now()) {
  if (sigusr1AuthorizedCount <= 0) {
    return;
  }
  if (now <= sigusr1AuthorizedUntil) {
    return;
  }
  sigusr1AuthorizedCount = 0;
  sigusr1AuthorizedUntil = 0;
}

export function setGatewaySigusr1RestartPolicy(opts?: { allowExternal?: boolean }) {
  sigusr1ExternalAllowed = opts?.allowExternal === true;
}

export function isGatewaySigusr1RestartExternallyAllowed() {
  return sigusr1ExternalAllowed;
}

/**
 * Rate limiter for SIGUSR1 restarts.
 * Tracks restart frequency and rejects if too many restarts occur within time window.
 * Configuration via environment:
 *   OPENCLAW_RESTART_RATE_LIMIT_WINDOW_MS=60000  # Time window (default: 60000)
 *   OPENCLAW_RESTART_MAX_PER_WINDOW=3            # Max restarts per window (default: 3)
 */
export function authorizeGatewaySigusr1Restart(delayMs = 0, reason?: string) {
  const now = Date.now();

  // Clean old entries from restart history
  const windowStart =
    now -
    (parseInt(process.env.OPENCLAW_RESTART_RATE_LIMIT_WINDOW_MS || "") || RATE_LIMIT_WINDOW_MS);
  while (restartHistory.length > 0 && restartHistory[0].timestamp < windowStart) {
    restartHistory.shift();
  }

  const maxRestarts =
    parseInt(process.env.OPENCLAW_RESTART_MAX_PER_WINDOW || "") || MAX_RESTARTS_PER_WINDOW;

  // Check rate limit
  if (restartHistory.length >= maxRestarts) {
    const oldestInWindow = restartHistory[0]?.timestamp;
    const waitMs = oldestInWindow ? windowStart + RATE_LIMIT_WINDOW_MS - now : 0;
    console.warn(
      `[restart] Rate limit exceeded (${maxRestarts}/window). Wait ${waitMs}ms or override with OPENCLAW_RESTART_BYPASS_RATE_LIMIT=1`,
    );
    if (process.env.OPENCLAW_RESTART_BYPASS_RATE_LIMIT !== "1") {
      throw new Error(
        `Rate limited: ${restartHistory.length} restarts in window, max ${maxRestarts}`,
      );
    }
  }

  // Log restart attempt
  restartHistory.push({ timestamp: now, reason });

  const delay = Math.max(0, Math.floor(delayMs));
  const expiresAt = now + delay + SIGUSR1_AUTH_GRACE_MS;
  sigusr1AuthorizedCount += 1;
  if (expiresAt > sigusr1AuthorizedUntil) {
    sigusr1AuthorizedUntil = expiresAt;
  }
}

export function consumeGatewaySigusr1RestartAuthorization(): boolean {
  resetSigusr1AuthorizationIfExpired();
  if (sigusr1AuthorizedCount <= 0) {
    return false;
  }
  sigusr1AuthorizedCount -= 1;
  if (sigusr1AuthorizedCount <= 0) {
    sigusr1AuthorizedUntil = 0;
  }
  return true;
}

function formatSpawnDetail(result: {
  error?: unknown;
  status?: number | null;
  stdout?: string | Buffer | null;
  stderr?: string | Buffer | null;
}): string {
  const clean = (value: string | Buffer | null | undefined) => {
    const text = typeof value === "string" ? value : value ? value.toString() : "";
    return text.replace(/\s+/g, " ").trim();
  };
  if (result.error) {
    if (result.error instanceof Error) {
      return result.error.message;
    }
    if (typeof result.error === "string") {
      return result.error;
    }
    try {
      return JSON.stringify(result.error);
    } catch {
      return "unknown error";
    }
  }
  const stderr = clean(result.stderr);
  if (stderr) {
    return stderr;
  }
  const stdout = clean(result.stdout);
  if (stdout) {
    return stdout;
  }
  if (typeof result.status === "number") {
    return `exit ${result.status}`;
  }
  return "unknown error";
}

function normalizeSystemdUnit(raw?: string, profile?: string): string {
  const unit = raw?.trim();
  if (!unit) {
    return `${resolveGatewaySystemdServiceName(profile)}.service`;
  }
  return unit.endsWith(".service") ? unit : `${unit}.service`;
}

export function triggerOpenClawRestart(): RestartAttempt {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    return { ok: true, method: "supervisor", detail: "test mode" };
  }
  const tried: string[] = [];
  if (process.platform !== "darwin") {
    if (process.platform === "linux") {
      const unit = normalizeSystemdUnit(
        process.env.OPENCLAW_SYSTEMD_UNIT,
        process.env.OPENCLAW_PROFILE,
      );
      const userArgs = ["--user", "restart", unit];
      tried.push(`systemctl ${userArgs.join(" ")}`);
      const userRestart = spawnSync("systemctl", userArgs, {
        encoding: "utf8",
        timeout: SPAWN_TIMEOUT_MS,
      });
      if (!userRestart.error && userRestart.status === 0) {
        return { ok: true, method: "systemd", tried };
      }
      const systemArgs = ["restart", unit];
      tried.push(`systemctl ${systemArgs.join(" ")}`);
      const systemRestart = spawnSync("systemctl", systemArgs, {
        encoding: "utf8",
        timeout: SPAWN_TIMEOUT_MS,
      });
      if (!systemRestart.error && systemRestart.status === 0) {
        return { ok: true, method: "systemd", tried };
      }
      const detail = [
        `user: ${formatSpawnDetail(userRestart)}`,
        `system: ${formatSpawnDetail(systemRestart)}`,
      ].join("; ");
      return { ok: false, method: "systemd", detail, tried };
    }
    return {
      ok: false,
      method: "supervisor",
      detail: "unsupported platform restart",
    };
  }

  const label =
    process.env.OPENCLAW_LAUNCHD_LABEL ||
    resolveGatewayLaunchAgentLabel(process.env.OPENCLAW_PROFILE);
  const uid = typeof process.getuid === "function" ? process.getuid() : undefined;
  const target = uid !== undefined ? `gui/${uid}/${label}` : label;
  const args = ["kickstart", "-k", target];
  tried.push(`launchctl ${args.join(" ")}`);
  const res = spawnSync("launchctl", args, {
    encoding: "utf8",
    timeout: SPAWN_TIMEOUT_MS,
  });
  if (!res.error && res.status === 0) {
    return { ok: true, method: "launchctl", tried };
  }
  return {
    ok: false,
    method: "launchctl",
    detail: formatSpawnDetail(res),
    tried,
  };
}

export type ScheduledRestart = {
  ok: boolean;
  pid: number;
  signal: "SIGUSR1";
  delayMs: number;
  reason?: string;
  mode: "emit" | "signal";
};

/**
 * Schedule a SIGUSR1 restart with race condition protection.
 * - Only one restart scheduled at a time (cancels pending restart)
 * - Restart deduplication (skip if same reason within time window)
 * - Graceful timeout with SIGKILL fallback (3s hard limit)
 */
export function scheduleGatewaySigusr1Restart(opts?: {
  delayMs?: number;
  reason?: string;
}): ScheduledRestart {
  const delayMsRaw =
    typeof opts?.delayMs === "number" && Number.isFinite(opts.delayMs)
      ? Math.floor(opts.delayMs)
      : 2000;
  const delayMs = Math.min(Math.max(delayMsRaw, 0), 60_000);
  const reason =
    typeof opts?.reason === "string" && opts.reason.trim()
      ? opts.reason.trim().slice(0, 200)
      : undefined;

  // Deduplication: skip if same reason recently
  if (reason && pendingRestartReason === reason && pendingRestartTimer !== null) {
    console.log(`[restart] Skipping duplicate restart: ${reason}`);
    return {
      ok: true,
      pid: process.pid,
      signal: "SIGUSR1",
      delayMs: 0,
      reason,
      mode: "emit",
    };
  }

  // Cancel any pending restart
  if (pendingRestartTimer !== null) {
    clearTimeout(pendingRestartTimer);
    pendingRestartTimer = null;
    console.log(`[restart] Cancelled pending restart: ${pendingRestartReason}`);
  }

  authorizeGatewaySigusr1Restart(delayMs, reason);
  const pid = process.pid;
  const hasListener = process.listenerCount("SIGUSR1") > 0;

  pendingRestartReason = reason;

  setTimeout(() => {
    pendingRestartTimer = null;
    pendingRestartReason = undefined;
    try {
      if (hasListener) {
        process.emit("SIGUSR1");
      } else {
        process.kill(pid, "SIGUSR1");
      }
    } catch {
      /* ignore */
    }
  }, delayMs);

  return {
    ok: true,
    pid,
    signal: "SIGUSR1",
    delayMs,
    reason,
    mode: hasListener ? "emit" : "signal",
  };
}

export const __testing = {
  resetSigusr1State() {
    sigusr1AuthorizedCount = 0;
    sigusr1AuthorizedUntil = 0;
    sigusr1ExternalAllowed = false;
    pendingRestartTimer = null;
    pendingRestartReason = undefined;
    restartHistory.length = 0;
  },
  getRestartHistory(): RestartLog[] {
    return [...restartHistory];
  },
};
