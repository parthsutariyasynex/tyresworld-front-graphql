/* ─────────────────────────────────────────────────────────────────
   SITEMAP SERVICE
   Sources category and product URLs from Magento so the sitemap stays
   in sync with the catalog automatically.
───────────────────────────────────────────────────────────────── */
import { magentoFetch } from "@/lib/graphql/client";
import { SITEMAP_CATEGORIES_QUERY, SITEMAP_PRODUCTS_QUERY } from "@/lib/queries";
import { APP_CONFIG } from "@/src/config/app-config";

export const PRODUCT_CHUNK_SIZE = 5000;

/** Single-segment category url_paths (nested paths omitted — not routable yet). */
export async function getSitemapCategoryPaths(store?: string): Promise<string[]> {
  const r = await magentoFetch<{ categories?: { items?: Array<{ url_path?: string }> } }>(
    SITEMAP_CATEGORIES_QUERY,
    undefined,
    { store, revalidate: 3600 },
  );
  return (r.data?.categories?.items ?? [])
    .map((c) => c.url_path)
    .filter((p): p is string => !!p && !p.includes("/"));
}

export async function getProductCount(store?: string): Promise<number> {
  const r = await magentoFetch<{ products?: { total_count?: number } }>(
    SITEMAP_PRODUCTS_QUERY,
    { uid: APP_CONFIG.rootCategoryUid, pageSize: 1, currentPage: 1 },
    { store, revalidate: 3600 },
  );
  return r.data?.products?.total_count ?? 0;
}

/** One page of product url_keys (1-indexed page). */
export async function getProductUrlKeys(page: number, store?: string): Promise<string[]> {
  const r = await magentoFetch<{ products?: { items?: Array<{ url_key?: string }> } }>(
    SITEMAP_PRODUCTS_QUERY,
    { uid: APP_CONFIG.rootCategoryUid, pageSize: PRODUCT_CHUNK_SIZE, currentPage: page },
    { store, revalidate: 3600 },
  );
  return (r.data?.products?.items ?? [])
    .map((p) => p.url_key)
    .filter((k): k is string => !!k);
}
