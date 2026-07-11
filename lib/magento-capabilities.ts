/* ─────────────────────────────────────────────────────────────────
   MagentoCapabilities — dynamic feature detection for the Magento
   backend. SERVER-SIDE ONLY: import from API route handlers, never
   from client components.

   Nothing is hardcoded: capabilities are discovered at runtime from
   (a) GraphQL schema introspection (which modules are installed) and
   (b) live config probes (which features are enabled in Admin).
   Results are cached in-memory for CAPABILITY_TTL_MS, so a feature
   toggled in Magento Admin activates here automatically within one
   cache window — no code changes required.

   If schema introspection is disabled on the backend (common in
   production), operation checks degrade to optimistic: the call is
   attempted and Magento's own error is handled gracefully.
───────────────────────────────────────────────────────────────── */

import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";
import {
  RECAPTCHA_V3_CONFIG_QUERY,
  VAULT_CONFIG_QUERY,
  PAYMENT_CONFIG_QUERY,
} from "@/lib/queries";

const CAPABILITY_TTL_MS = 5 * 60_000;

type Gql = { data?: Record<string, unknown>; errors?: { message: string }[] };

async function gql(query: string, variables?: Record<string, unknown>, token?: string): Promise<Gql> {
  try {
    const headers = magentoHeaders() as Record<string, string>;
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method:  "POST",
      headers,
      body:    JSON.stringify({ query, variables: variables ?? {} }),
      cache:   "no-store",
    });
    return (await res.json().catch(() => ({}))) as Gql;
  } catch {
    return { errors: [{ message: "Magento unreachable" }] };
  }
}

/* ── Capability model ─────────────────────────────────────────── */

export type MagentoCapabilities = {
  /** Whether schema introspection succeeded (false ⇒ operation lists are unknown, checks are optimistic) */
  introspectionAvailable: boolean;
  operations: { queries: string[]; mutations: string[] };
  paypal:    { installed: boolean; enabled: boolean };
  vault:     { installed: boolean; enabled: boolean; threeDsMode: string | null };
  recaptcha: { installed: boolean; enabled: boolean; websiteKey: string | null; forms: string[] };
  /** Product types the platform can add to cart (schema-derived, not catalog contents) */
  productTypes: string[];
  detectedAt: string;
};

let cache: { caps: MagentoCapabilities; at: number } | null = null;

/* ── Detection ────────────────────────────────────────────────── */

async function introspectOperations(): Promise<{ queries: Set<string>; mutations: Set<string> } | null> {
  const j = await gql(`{
    q: __type(name: "Query")    { fields { name } }
    m: __type(name: "Mutation") { fields { name } }
  }`);
  const q = (j.data?.q as { fields?: { name: string }[] } | null)?.fields;
  const m = (j.data?.m as { fields?: { name: string }[] } | null)?.fields;
  if (!q?.length || !m?.length) return null;
  return {
    queries:   new Set(q.map(f => f.name)),
    mutations: new Set(m.map(f => f.name)),
  };
}

async function detect(): Promise<MagentoCapabilities> {
  const ops = await introspectOperations();

  const has = (name: string, kind: "query" | "mutation"): boolean =>
    ops ? (kind === "query" ? ops.queries.has(name) : ops.mutations.has(name)) : true;

  // Config probes run in parallel; each only if the module is present.
  const [recaptchaRes, vaultRes, paymentCfgRes] = await Promise.all([
    has("recaptchaV3Config", "query")  ? gql(RECAPTCHA_V3_CONFIG_QUERY) : Promise.resolve(null),
    has("getVaultConfig", "query")     ? gql(VAULT_CONFIG_QUERY)        : Promise.resolve(null),
    has("getPaymentConfig", "query")   ? gql(PAYMENT_CONFIG_QUERY, { location: "CHECKOUT" }) : Promise.resolve(null),
  ]);

  const recaptchaCfg = recaptchaRes?.data?.recaptchaV3Config as
    { is_enabled?: boolean; website_key?: string; forms?: string[] } | null | undefined;
  const vaultCfg = (vaultRes?.data?.getVaultConfig as
    { credit_card?: { is_vault_enabled?: boolean; three_ds_mode?: string } } | null | undefined)?.credit_card;
  const paymentCfg = paymentCfgRes?.data?.getPaymentConfig as
    Record<string, { is_visible?: boolean } | null> | null | undefined;

  // PayPal is "enabled" when any payment-services component is visible at checkout.
  const paypalVisible = !!paymentCfg &&
    Object.values(paymentCfg).some(c => c?.is_visible === true);

  const paypalInstalled =
    has("createPaypalExpressToken", "mutation") ||
    has("getPaymentConfig", "query");

  const productTypes = ["SIMPLE", "CONFIGURABLE"].concat(
    has("addBundleProductsToCart", "mutation")       ? ["BUNDLE"] : [],
    has("addVirtualProductsToCart", "mutation")      ? ["VIRTUAL"] : [],
    has("addDownloadableProductsToCart", "mutation") ? ["DOWNLOADABLE"] : [],
  );

  return {
    introspectionAvailable: ops !== null,
    operations: {
      queries:   ops ? [...ops.queries].sort() : [],
      mutations: ops ? [...ops.mutations].sort() : [],
    },
    paypal: { installed: paypalInstalled, enabled: paypalVisible },
    vault: {
      installed:  has("getVaultConfig", "query"),
      enabled:    vaultCfg?.is_vault_enabled === true,
      threeDsMode: vaultCfg?.three_ds_mode ?? null,
    },
    recaptcha: {
      installed:  has("recaptchaV3Config", "query"),
      enabled:    recaptchaCfg?.is_enabled === true && !!recaptchaCfg?.website_key,
      websiteKey: recaptchaCfg?.website_key || null,
      forms:      recaptchaCfg?.forms ?? [],
    },
    productTypes,
    detectedAt: new Date().toISOString(),
  };
}

/* ── Public API ───────────────────────────────────────────────── */

export async function getCapabilities(force = false): Promise<MagentoCapabilities> {
  if (!force && cache && Date.now() - cache.at < CAPABILITY_TTL_MS) return cache.caps;
  const caps = await detect();
  cache = { caps, at: Date.now() };
  return caps;
}

export async function availableGraphQLOperations(): Promise<{ queries: string[]; mutations: string[] }> {
  return (await getCapabilities()).operations;
}

/** True when the operation exists in the schema. Optimistic (true) when introspection is unavailable. */
export async function hasOperation(name: string, kind: "query" | "mutation"): Promise<boolean> {
  const caps = await getCapabilities();
  if (!caps.introspectionAvailable) return true;
  const list = kind === "query" ? caps.operations.queries : caps.operations.mutations;
  return list.includes(name);
}

export async function isPaypalEnabled(): Promise<boolean> {
  return (await getCapabilities()).paypal.enabled;
}

export async function isVaultEnabled(): Promise<boolean> {
  return (await getCapabilities()).vault.enabled;
}

export async function isRecaptchaEnabled(): Promise<boolean> {
  return (await getCapabilities()).recaptcha.enabled;
}

export async function supportedProductTypes(): Promise<string[]> {
  return (await getCapabilities()).productTypes;
}

/**
 * Payment methods are cart-scoped in Magento, so a cart id is required.
 * Returns null when the cart cannot be read (expired / wrong store).
 */
export async function getAvailablePaymentMethods(
  cartId: string,
  token?: string,
): Promise<{ code: string; title: string }[] | null> {
  const j = await gql(
    `query($cartId: String!) { cart(cart_id: $cartId) { available_payment_methods { code title } } }`,
    { cartId },
    token,
  );
  const methods = (j.data?.cart as { available_payment_methods?: { code: string; title: string }[] } | null)
    ?.available_payment_methods;
  return methods ?? null;
}

/** Standard response body for a feature that is not enabled in Magento Admin. */
export function featureUnavailable(feature: string) {
  return {
    supported: false as const,
    data:      null,
    error:     `${feature} is not enabled on this store. Enable it in Magento Admin and it will activate automatically.`,
  };
}
