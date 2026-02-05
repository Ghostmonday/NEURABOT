/**
 * Sowwy Security - Environment Variable Validation
 *
 * Validates all SOWWY_* and related env vars at bootstrap.
 * Fails fast with clear errors if misconfigured.
 */

import { z } from "zod";

// ============================================================================
// Environment Schemas
// ============================================================================

const PostgresConfigSchema = z.object({
  host: z.string().min(1, "SOWWY_POSTGRES_HOST is required"),
  port: z.number().int().min(1).max(65535),
  user: z.string().min(1),
  password: z.string().min(1, "SOWWY_POSTGRES_PASSWORD is required"),
  database: z.string().min(1),
  max: z.number().int().positive().optional(),
});

const MiniMaxConfigSchema = z.object({
  apiKey: z
    .string()
    .regex(/^sk-cp-[A-Za-z0-9_-]{40,}$/, "Invalid MiniMax API key format (must start with sk-cp-)"),
});

const SMTConfigSchema = z.object({
  windowMs: z.number().int().positive(),
  maxPrompts: z.number().int().positive(),
  targetUtilization: z.number().min(0).max(1),
  reservePercent: z.number().min(0).max(1),
});

const SchedulerConfigSchema = z.object({
  pollIntervalMs: z.number().int().positive(),
  maxRetries: z.number().int().nonnegative(),
  stuckTaskThresholdMs: z.number().int().positive(),
});

// ============================================================================
// Validation Functions
// ============================================================================

export interface ValidatedEnv {
  postgres?: z.infer<typeof PostgresConfigSchema>;
  minimax: z.infer<typeof MiniMaxConfigSchema>;
  smt: z.infer<typeof SMTConfigSchema>;
  scheduler: z.infer<typeof SchedulerConfigSchema>;
  identityPath: string;
  killSwitch: boolean;
  requireApproval: boolean;
}

/**
 * Validate and parse all Sowwy environment variables
 *
 * Returns validated config or throws with clear error messages.
 * Postgres is optional - if SOWWY_POSTGRES_HOST is not set, postgres will be undefined.
 */
export function validateSowwyEnv(): ValidatedEnv {
  const errors: string[] = [];

  // MiniMax API key (required)
  const minimaxApiKey = process.env.MINIMAX_API_KEY;
  if (!minimaxApiKey) {
    errors.push("MINIMAX_API_KEY is required");
  }

  let minimax: z.infer<typeof MiniMaxConfigSchema> | null = null;
  if (minimaxApiKey) {
    const result = MiniMaxConfigSchema.safeParse({ apiKey: minimaxApiKey });
    if (!result.success) {
      errors.push(
        `MINIMAX_API_KEY validation failed: ${result.error.issues[0]?.message ?? "invalid format"}`,
      );
    } else {
      minimax = result.data;
    }
  }

  // Fail fast if MiniMax key is invalid (required for operation)
  if (!minimax) {
    throw new Error(
      `Sowwy environment validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }

  // PostgreSQL (optional, but validate if provided)
  let postgres: z.infer<typeof PostgresConfigSchema> | undefined;
  const pgHost = process.env.SOWWY_POSTGRES_HOST;
  if (pgHost) {
    const pgPort = process.env.SOWWY_POSTGRES_PORT;
    const pgUser = process.env.SOWWY_POSTGRES_USER;
    const pgPassword = process.env.SOWWY_POSTGRES_PASSWORD;
    const pgDb = process.env.SOWWY_POSTGRES_DB;

    if (!pgPort || !pgUser || !pgPassword || !pgDb) {
      errors.push(
        "If SOWWY_POSTGRES_HOST is set, all PostgreSQL vars are required: SOWWY_POSTGRES_PORT, SOWWY_POSTGRES_USER, SOWWY_POSTGRES_PASSWORD, SOWWY_POSTGRES_DB",
      );
    } else {
      const result = PostgresConfigSchema.safeParse({
        host: pgHost,
        port: parseInt(pgPort, 10),
        user: pgUser,
        password: pgPassword,
        database: pgDb,
        max: process.env.SOWWY_POSTGRES_POOL_MAX
          ? parseInt(process.env.SOWWY_POSTGRES_POOL_MAX, 10)
          : undefined,
      });

      if (!result.success) {
        errors.push(
          `PostgreSQL config validation failed: ${result.error.issues.map((e: z.ZodIssue) => e.message).join(", ")}`,
        );
      } else if (isNaN(result.data.port)) {
        errors.push(`SOWWY_POSTGRES_PORT must be a number, got: ${pgPort}`);
      } else {
        postgres = result.data;
      }
    }
  }

  // SMT Config
  const smtWindowMs = process.env.SOWWY_SMT_WINDOW_MS;
  const smtMaxPrompts = process.env.SOWWY_SMT_MAX_PROMPTS;
  const smtTargetUtil = process.env.SOWWY_SMT_TARGET_UTILIZATION;
  const smtReserve = process.env.SOWWY_SMT_RESERVE_PERCENT;

  const smtResult = SMTConfigSchema.safeParse({
    windowMs: smtWindowMs ? parseInt(smtWindowMs, 10) : 18000000,
    maxPrompts: smtMaxPrompts ? parseInt(smtMaxPrompts, 10) : 100,
    targetUtilization: smtTargetUtil ? parseFloat(smtTargetUtil) : 0.8,
    reservePercent: smtReserve ? parseFloat(smtReserve) : 0.2,
  });

  if (!smtResult.success) {
    errors.push(
      `SMT config validation failed: ${smtResult.error.issues.map((e: z.ZodIssue) => e.message).join(", ")}`,
    );
  }

  // Scheduler Config
  const schedulerPoll = process.env.SOWWY_SCHEDULER_POLL_MS;
  const schedulerRetries = process.env.SOWWY_SCHEDULER_MAX_RETRIES;
  const schedulerStuck = process.env.SOWWY_SCHEDULER_STUCK_THRESHOLD_MS;

  const schedulerResult = SchedulerConfigSchema.safeParse({
    pollIntervalMs: schedulerPoll ? parseInt(schedulerPoll, 10) : 5000,
    maxRetries: schedulerRetries ? parseInt(schedulerRetries, 10) : 3,
    stuckTaskThresholdMs: schedulerStuck ? parseInt(schedulerStuck, 10) : 3600000,
  });

  if (!schedulerResult.success) {
    errors.push(
      `Scheduler config validation failed: ${schedulerResult.error.issues.map((e: z.ZodIssue) => e.message).join(", ")}`,
    );
  }

  // Identity path
  const identityPath = process.env.SOWWY_IDENTITY_PATH || "./data/sowwy-identity";

  // Security flags
  const killSwitch = process.env.SOWWY_KILL_SWITCH === "true";
  const requireApproval = process.env.SOWWY_REQUIRE_APPROVAL !== "false";

  // Fail fast if critical errors (Postgres errors are non-fatal if pgHost not set)
  if (errors.length > 0 && pgHost) {
    throw new Error(
      `Sowwy environment validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`,
    );
  }

  if (!smtResult.success || !schedulerResult.success) {
    throw new Error(
      `SMT or Scheduler config validation failed:\n${
        smtResult.success
          ? ""
          : `  - SMT: ${smtResult.error.issues.map((e: z.ZodIssue) => e.message).join(", ")}\n`
      }${
        schedulerResult.success
          ? ""
          : `  - Scheduler: ${schedulerResult.error.issues.map((e: z.ZodIssue) => e.message).join(", ")}`
      }`,
    );
  }

  return {
    postgres,
    minimax,
    smt: smtResult.data,
    scheduler: schedulerResult.data,
    identityPath,
    killSwitch,
    requireApproval,
  };
}
