/**
 * Gateway Error Handler
 * 
 * Provides safe error formatting that never leaks sensitive information
 * to clients. All errors are logged internally with full details (redacted),
 * but clients receive generic error messages.
 */

import { randomUUID } from "node:crypto";
import { redactError, redactString } from "../sowwy/security/redact.js";

/**
 * Safe error response format
 */
export type SafeErrorResponse = {
  error: string;
  code?: string;
  requestId?: string;
};

/**
 * Format error for client response (never exposes internal details)
 * 
 * Logs full error details internally (with redaction), but returns
 * generic message to client to prevent information leakage.
 * 
 * @param error - Error to format
 * @param requestId - Optional request ID for correlation
 * @returns Safe error response
 */
export function formatSafeError(
  error: unknown,
  requestId?: string,
): SafeErrorResponse {
  const id = requestId ?? randomUUID().slice(0, 8);

  // Log full error internally (redacted)
  console.error(`[${id}] Internal error:`, redactError(error));

  // Return generic message to client
  return {
    error: "An internal error occurred",
    code: "INTERNAL_ERROR",
    requestId: id,
  };
}

/**
 * Format client-facing error (for known/expected errors)
 * 
 * Use this for validation errors, authentication failures, etc.
 * where the error message is safe to expose to clients.
 * 
 * @param message - Error message (will be redacted)
 * @param code - Error code
 * @param requestId - Optional request ID
 * @returns Safe error response
 */
export function formatClientError(
  message: string,
  code: string,
  requestId?: string,
): SafeErrorResponse {
  return {
    error: redactString(message),
    code,
    requestId,
  };
}

/**
 * Format rate limit error
 * 
 * @param retryAfter - Seconds until retry allowed
 * @param requestId - Optional request ID
 * @returns Safe error response
 */
export function formatRateLimitError(
  retryAfter: number,
  requestId?: string,
): SafeErrorResponse {
  return {
    error: "Rate limit exceeded",
    code: "RATE_LIMIT_EXCEEDED",
    requestId,
    // Include retryAfter in response (not in error field to avoid confusion)
  } as SafeErrorResponse & { retryAfter: number };
}

/**
 * Send safe error response to client
 * 
 * @param res - HTTP response object
 * @param statusCode - HTTP status code
 * @param error - Error response object
 */
export function sendSafeError(
  res: import("node:http").ServerResponse,
  statusCode: number,
  error: SafeErrorResponse,
): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(error));
}
