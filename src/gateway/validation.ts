/**
 * Gateway Input Validation
 *
 * Provides TypeBox-based validation and string sanitization utilities
 * to prevent injection attacks and malformed input.
 */

import type { TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

/**
 * Validation result
 */
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: string[] };

/**
 * Validate request body against TypeBox schema
 *
 * @param body - Request body to validate
 * @param schema - TypeBox schema
 * @returns Validation result with typed value or error messages
 */
export function validateBody<T>(body: unknown, schema: TSchema): ValidationResult<T> {
  const errors = [...Value.Errors(schema, body)];

  if (errors.length > 0) {
    return {
      ok: false,
      errors: errors.map((e) => `${e.path}: ${e.message}`),
    };
  }

  return { ok: true, value: body as T };
}

/**
 * Sanitize string input to prevent injection attacks
 *
 * Removes potentially dangerous characters and patterns:
 * - HTML angle brackets
 * - javascript: protocol
 * - Leading/trailing whitespace
 *
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .trim();
}

/**
 * Validate and sanitize string input
 *
 * @param input - String to validate and sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string or null if invalid
 */
export function validateAndSanitizeString(
  input: unknown,
  maxLength: number = 10000,
): string | null {
  if (typeof input !== "string") {
    return null;
  }

  if (input.length > maxLength) {
    return null;
  }

  return sanitizeString(input);
}

/**
 * Validate IP address format
 *
 * @param ip - IP address string
 * @returns True if valid IP address
 */
export function isValidIpAddress(ip: string): boolean {
  // IPv4
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4Regex.test(ip)) {
    return true;
  }

  // IPv6 (simplified check)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  if (ipv6Regex.test(ip)) {
    return true;
  }

  // IPv6 compressed format
  if (ip.includes("::")) {
    return true;
  }

  return false;
}
