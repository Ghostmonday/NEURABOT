#!/usr/bin/env node
/**
 * Generate Secure Token
 * 
 * Generates a cryptographically secure token for gateway authentication.
 * Outputs token in format suitable for environment variables.
 * 
 * Usage:
 *   node scripts/generate-secure-token.ts
 *   # Output: OPENCLAW_GATEWAY_TOKEN=...
 */

import { randomBytes } from "node:crypto";

const token = randomBytes(32).toString("base64url");
console.log(`OPENCLAW_GATEWAY_TOKEN=${token}`);
console.error(`\n⚠️  Save this token securely. Do not commit it to version control.`);
