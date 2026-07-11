/* ─────────────────────────────────────────────────────────────────
   Admin-scoped Magento GraphQL operations.

   SERVER-SIDE ONLY. Never import this from a client component and
   never expose these through a public API route: both operations
   require MAGENTO_ADMIN_TOKEN (a Magento integration/admin bearer
   token) and exist for back-office tooling, scripts, and future
   server-to-server integrations.

   Without MAGENTO_ADMIN_TOKEN in the environment every function
   returns a clean "not configured" result instead of throwing, so
   nothing breaks when the token is absent.
───────────────────────────────────────────────────────────────── */

import { ATTRIBUTES_LIST_QUERY } from "@/lib/queries";
import { ADMIN_MUTATIONS } from "@/lib/mutations";
import { hasOperation } from "@/lib/magento-capabilities";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

type Gql = { data?: Record<string, unknown>; errors?: { message: string }[] };

type AdminResult<T> = { data: T | null; error: string | null };

function adminToken(): string | null {
  return process.env.MAGENTO_ADMIN_TOKEN || null;
}

async function adminGql(query: string, variables: Record<string, unknown>): Promise<Gql> {
  const token = adminToken();
  const headers = magentoHeaders() as Record<string, string>;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
    method:  "POST",
    headers,
    body:    JSON.stringify({ query, variables }),
    cache:   "no-store",
  });
  return (await res.json().catch(() => ({}))) as Gql;
}

export type AttributeMetadata = {
  code: string;
  label: string;
  frontend_input: string;
  is_required: boolean;
  is_unique: boolean;
  default_value: string | null;
  options: { label: string; value: string }[];
};

/**
 * attributesList — EAV attribute metadata for an entity type.
 * entityType: CATALOG_PRODUCT | CATALOG_CATEGORY | CUSTOMER | CUSTOMER_ADDRESS
 * Works without the admin token for public attributes; admin token
 * widens the visible set.
 */
export async function attributesList(
  entityType: "CATALOG_PRODUCT" | "CATALOG_CATEGORY" | "CUSTOMER" | "CUSTOMER_ADDRESS",
): Promise<AdminResult<AttributeMetadata[]>> {
  if (!(await hasOperation("attributesList", "query"))) {
    return { data: null, error: "attributesList is not available on this Magento instance." };
  }
  const j = await adminGql(ATTRIBUTES_LIST_QUERY, { entityType });
  const out = j.data?.attributesList as { items?: AttributeMetadata[]; errors?: { message: string }[] } | undefined;
  return {
    data:  out?.items ?? null,
    error: out?.errors?.[0]?.message ?? j.errors?.[0]?.message ?? null,
  };
}

/**
 * generateCustomerTokenAsAdmin — obtain a customer session token for
 * support/impersonation tooling. Requires MAGENTO_ADMIN_TOKEN and, on
 * the Magento side, admin authorization for the bearer.
 */
export async function generateCustomerTokenAsAdmin(
  customerEmail: string,
): Promise<AdminResult<string>> {
  if (!adminToken()) {
    return { data: null, error: "MAGENTO_ADMIN_TOKEN is not configured — admin impersonation is disabled." };
  }
  if (!(await hasOperation("generateCustomerTokenAsAdmin", "mutation"))) {
    return { data: null, error: "generateCustomerTokenAsAdmin is not available on this Magento instance." };
  }
  const j = await adminGql(ADMIN_MUTATIONS.generateCustomerTokenAsAdmin, { customerEmail });
  const out = j.data?.generateCustomerTokenAsAdmin as { customer_token?: string } | undefined;
  return {
    data:  out?.customer_token ?? null,
    error: j.errors?.[0]?.message ?? null,
  };
}
