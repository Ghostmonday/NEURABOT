/**
 * Type Guards
 *
 * Utility functions for runtime type checking and narrowing.
 * Prevents unsafe type assertions and improves type safety.
 */

/**
 * Check if value is an Error instance
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Check if value has a message property
 */
export function hasMessage(value: unknown): value is { message: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as { message: unknown }).message === "string"
  );
}

/**
 * Check if value has a code property
 */
export function hasCode(value: unknown): value is { code: string | number } {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    (typeof (value as { code: unknown }).code === "string" ||
      typeof (value as { code: unknown }).code === "number")
  );
}

/**
 * Check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

/**
 * Check if value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Check if value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Assert never (for exhaustive checks)
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}

/**
 * Type-safe error extraction
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (hasMessage(error)) {
    return error.message;
  }
  if (isString(error)) {
    return error;
  }
  return "Unknown error";
}

/**
 * Type-safe error code extraction
 */
export function getErrorCode(error: unknown): string | number | undefined {
  if (hasCode(error)) {
    return error.code;
  }
  if (isError(error) && "code" in error) {
    return (error as { code: unknown }).code as string | number;
  }
  return undefined;
}
