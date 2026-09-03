/* ─────────────────────────────────────────────────────────────────
   CENTRALIZED MAGENTO GRAPHQL CLIENT
   The single place every server-side Magento call flows through.
   Handles: store header, customer token, Next.js cache policy,
   one automatic retry on transient network / 5xx failures, and a
   uniform result shape so callers never re-implement fetch boilerplate.

   Server-only: imported by API route handlers and (later) Server
   Components. Never import from a Client Component.
───────────────────────────────────────────────────────────────── */
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

/**
 * A GraphQL error as Magento returns it.
 *
 * Magento hides the useful detail in `extensions.debugMessage` and leaves
 * `message` as a generic string — a backend exception arrives as
 * `message: "Internal server error"` while `debugMessage` names the actual
 * failing plugin or attribute. Reading only `message` makes those faults
 * effectively undiagnosable from the frontend.
 */
export interface MagentoGraphqlError {
  message: string;
  extensions?: {
    debugMessage?: string;
    category?: string;
  };
}

export interface MagentoResult<T> {
  /** The GraphQL `data` payload (already unwrapped), or null on failure. */
  data: T | null;
  /** GraphQL `errors`, if any. Present even when `data` is partially valid. */
  errors?: MagentoGraphqlError[];
  /** True when the HTTP request succeeded (2xx). */
  ok: boolean;
  /** HTTP status (0/502 for network errors after retry). */
  status: number;
}

/** The most informative text available for one GraphQL error. */
export function errorDetail(e: MagentoGraphqlError): string {
  const debug = e.extensions?.debugMessage?.trim();
  return debug ? debug : e.message;
}

export interface MagentoFetchOptions {
  /** Magento store code / locale (mapped via storeView → `Store` header). */
  store?: string;
  /** Customer bearer token, forwarded as `Authorization` (server-side only). */
  token?: string;
  /** Next.js Data Cache revalidation window in seconds. */
  revalidate?: number;
  /** Bypass the Data Cache entirely (`cache: "no-store"`). */
  noStore?: boolean;
}

/**
 * First message from a GraphQL error array, or a HTTP fallback.
 * Prefers `extensions.debugMessage` and falls back to `message`.
 */
export function firstError(r: MagentoResult<unknown>): string | undefined {
  if (r.errors?.length) return errorDetail(r.errors[0]);
  if (!r.ok) return `HTTP ${r.status}`;
  return undefined;
}

/**
 * Execute a GraphQL operation against Magento.
 * Never throws — always resolves to a `MagentoResult` so callers branch
 * uniformly on `ok` / `errors` / `data`.
 */
export async function magentoFetch<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
  opts: MagentoFetchOptions = {},
): Promise<MagentoResult<T>> {
  const headers: Record<string, string> = { ...(magentoHeaders(opts.store) as Record<string, string>) };
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;

  const cacheInit: RequestInit = opts.noStore
    ? { cache: "no-store" }
    : ({ next: { revalidate: opts.revalidate ?? APP_CONFIG.cache.products } } as RequestInit);

  let lastError = "Network error";

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ query, variables }),
        ...cacheInit,
      });

      // Retry once on transient upstream failures.
      if (!res.ok && res.status >= 500 && attempt === 0) {
        lastError = `HTTP ${res.status}`;
        continue;
      }

      const json = (await res.json().catch(() => null)) as
        | { data?: T; errors?: MagentoGraphqlError[] }
        | null;

      // Log the detail Magento buries in extensions.debugMessage, so a
      // backend-side fault is diagnosable instead of just "Internal server error".
      if (json?.errors?.length) {
        for (const e of json.errors) {
          const debug = e.extensions?.debugMessage?.trim();
          console.error(
            debug
              ? `[magento-graphql] ${e.message} — debugMessage: ${debug}`
              : `[magento-graphql] ${e.message}`,
          );
        }
      }

      return {
        data: (json?.data ?? null) as T | null,
        errors: json?.errors,
        ok: res.ok,
        status: res.status,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Network error";
      if (attempt === 0) continue; // retry once on network error
    }
  }

  return { data: null, ok: false, status: 502, errors: [{ message: lastError }] };
}
