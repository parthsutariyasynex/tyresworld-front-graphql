/* ─────────────────────────────────────────────────────────────────
   ROUTE SERVICE
   Resolves any storefront URL to its Magento entity (product /
   category / CMS page) via the `urlResolver` (`route`) query.
   This is what makes routing fully dynamic: a new category or CMS
   page created in Magento Admin resolves automatically — no frontend
   route needs to be added.
───────────────────────────────────────────────────────────────── */
import { magentoFetch } from "@/lib/graphql/client";
import { ROUTE_QUERY } from "@/lib/queries";

export type RouteType = "PRODUCT" | "CATEGORY" | "CMS_PAGE";

export interface ResolvedRoute {
  type: RouteType | string;
  uid?: string;
  url_key?: string;
  sku?: string;
  name?: string;
  identifier?: string;
  title?: string;
}

/**
 * Resolve a URL path (bare slug, no store prefix, no ".html" suffix) to
 * its underlying Magento entity. Returns null when nothing matches.
 */
export async function resolveRoute(url: string, store?: string): Promise<ResolvedRoute | null> {
  const r = await magentoFetch<{ route?: ResolvedRoute | null }>(
    ROUTE_QUERY,
    { url },
    { store, revalidate: 3600 },
  );
  if (!r.ok || !r.data?.route) return null;
  return r.data.route;
}
