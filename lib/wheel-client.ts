/* ─────────────────────────────────────────────────────────────────
   WHEEL API — reusable GraphQL client
   Mirrors the local gql() pattern used in every Magento route, but
   appends ?user_key=… to the URL instead of an Authorization header.
   The Wheel API must NEVER receive the key as a header or body field.
───────────────────────────────────────────────────────────────── */

import { APP_CONFIG } from "@/src/config/app-config";
import type { WheelApiResponse } from "@/lib/wheel-types";

/** Standard JSON headers — no auth header; key goes in the URL. */
const WHEEL_HEADERS: HeadersInit = {
  Accept:         "application/json",
  "Content-Type": "application/json",
};

/**
 * Build the authenticated Wheel API URL.
 * Appends `?user_key=<key>` as required by the API contract.
 * Throws at call-time if WHEEL_USER_KEY is not configured.
 */
function wheelEndpoint(): string {
  const key = APP_CONFIG.wheel.userKey;
  if (!key) {
    throw new Error(
      "WHEEL_USER_KEY is not set. Add it to your environment variables.",
    );
  }
  return `${APP_CONFIG.wheel.graphqlUrl}?user_key=${encodeURIComponent(key)}`;
}

/**
 * Execute a Wheel API GraphQL query or mutation.
 *
 * Usage:
 *   const result = await wheelGql<WheelMakesData>(WHEEL_MAKES_QUERY);
 *   const makes  = result.data?.makes ?? [];
 *
 * @param query     - GraphQL query string (from lib/wheel-queries.ts)
 * @param variables - Optional query variables (never include user_key here)
 * @param options   - Optional fetch init overrides (e.g. next.revalidate)
 */
export async function wheelGql<T = Record<string, unknown>>(
  query: string,
  variables?: Record<string, unknown>,
  options?: { revalidate?: number },
): Promise<WheelApiResponse<T>> {
  const url = wheelEndpoint();

  const fetchInit: RequestInit = {
    method:  "POST",
    headers: WHEEL_HEADERS,
    body:    JSON.stringify({ query, variables: variables ?? {} }),
  };

  if (options?.revalidate !== undefined) {
    (fetchInit as RequestInit & { next?: { revalidate: number } }).next = {
      revalidate: options.revalidate,
    };
  } else {
    fetchInit.cache = "no-store";
  }

  const res = await fetch(url, fetchInit);

  if (!res.ok) {
    return {
      errors: [{ message: `Wheel API HTTP ${res.status}: ${res.statusText}` }],
    };
  }

  return (await res.json().catch((): WheelApiResponse<T> => ({
    errors: [{ message: "Wheel API returned invalid JSON" }],
  }))) as WheelApiResponse<T>;
}

/** Extract the first error message from a Wheel API response, or undefined. */
export function wheelError(res: WheelApiResponse<unknown>): string | undefined {
  return res.errors?.[0]?.message;
}
