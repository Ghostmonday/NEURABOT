import { callGateway } from "../../gateway/call.js";
import { GATEWAY_CLIENT_MODES, GATEWAY_CLIENT_NAMES } from "../../utils/message-channel.js";

export const DEFAULT_GATEWAY_URL = "ws://127.0.0.1:18789";

export type GatewayCallOptions = {
  gatewayUrl?: string;
  gatewayToken?: string;
  timeoutMs?: number;
};

export function resolveGatewayOptions(opts?: GatewayCallOptions) {
  // Prefer an explicit override; otherwise let callGateway choose based on config.
  const url =
    typeof opts?.gatewayUrl === "string" && opts.gatewayUrl.trim()
      ? opts.gatewayUrl.trim()
      : undefined;
  const token =
    typeof opts?.gatewayToken === "string" && opts.gatewayToken.trim()
      ? opts.gatewayToken.trim()
      : undefined;
  const timeoutMs =
    typeof opts?.timeoutMs === "number" && Number.isFinite(opts.timeoutMs)
      ? Math.max(1, Math.floor(opts.timeoutMs))
      : 30_000;
  return { url, token, timeoutMs };
}

export async function callGatewayTool<T = Record<string, unknown>>(
  method: string,
  opts: GatewayCallOptions,
  params?: unknown,
  extra?: { expectFinal?: boolean },
) {
  const gateway = resolveGatewayOptions(opts);
  const maxRetries = 2;
  const backoffMs = [1_000, 3_000];
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callGateway<T>({
        url: gateway.url,
        token: gateway.token,
        method,
        params,
        timeoutMs: gateway.timeoutMs,
        expectFinal: extra?.expectFinal,
        clientName: GATEWAY_CLIENT_NAMES.GATEWAY_CLIENT,
        clientDisplayName: "agent",
        mode: GATEWAY_CLIENT_MODES.BACKEND,
      });
    } catch (err) {
      lastError = err;
      const isTimeout = String(err).includes("timeout");
      if (!isTimeout || attempt >= maxRetries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, backoffMs[attempt] ?? 3_000));
    }
  }
  throw lastError;
}
