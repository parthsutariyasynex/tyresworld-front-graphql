import { NextRequest, NextResponse } from "next/server";
import { CATEGORY_PAGE_QUERY, CATEGORY_UID_BY_URL_KEY_QUERY } from "@/lib/queries";
import { parseGraphqlResponse, parseAggregations } from "@/lib/magento";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";
import { findBrandLogo } from "@/lib/brandLogoScan";
type SortInput = Record<string, "ASC" | "DESC">;

function buildSort(order: string): SortInput | undefined {
  switch (order) {
    case "recommended":
    case "position":
      return { position: "ASC" };
    default:
      return undefined;
  }
}

/**
 * Fill in each product's `brandLogoUrl` from the local mgs_brand mirror.
 *
 * Magento exposes no `brand_logo_url` on ProductInterface, so the field
 * always arrives empty and the card falls back to `getBrandLogo(product.brand)`
 * — a numeric lookup that only covers the 32 brands still listed in
 * lib/brandLogos.ts, leaving the other ~180 rendering a text name.
 *
 * findBrandLogo() already derives brand -> file from public/brands/mgs_brand,
 * so resolving here (server-side; the scanner needs `fs`) gives the card a
 * real URL through its existing `product.brandLogoUrl ?? …` chain. Products
 * whose brand has no file are left untouched — nothing is substituted.
 */
function withBrandLogos<T extends { brandName?: unknown; brandLogoUrl?: string }>(products: T[]): T[] {
  const cache = new Map<string, string | null>();

  return products.map((product) => {
    /* `brandName` is typed as a string but the adapter falls back to the raw
       `mgs_brand` value, which is numeric — coerce rather than assume. */
    const name = String(product.brandName ?? "").trim();
    if (!name || product.brandLogoUrl) return product;

    if (!cache.has(name)) cache.set(name, findBrandLogo(name)?.logo ?? null);
    const logo = cache.get(name);

    return logo ? { ...product, brandLogoUrl: logo } : product;
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const urlKey      = searchParams.get("urlKey") ?? "";
  const store       = searchParams.get("store") ?? "default";
  const pageSize    = Math.min(Number(searchParams.get("pageSize") ?? 12) || 12, 48);
  const currentPage = Math.max(Number(searchParams.get("page") ?? 1) || 1, 1);
  const sort        = buildSort(searchParams.get("sort") ?? "");
  const search      = searchParams.get("q") ?? searchParams.get("search") ?? "";

  if (!urlKey) {
    return NextResponse.json({ error: "urlKey is required" }, { status: 400 });
  }

  /* Resolve category urlKey → category UID using route query and fallback */
  let categoryUid: string | null = null;
  try {
    const lookup = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method: "POST",
      headers: magentoHeaders(store),
      body: JSON.stringify({
        query: `query($url: String!) {
          route(url: $url) {
            type
            ... on CategoryInterface {
              uid
            }
          }
        }`,
        variables: { url: urlKey },
      }),
      next: { revalidate: APP_CONFIG.cache.category },
    });
    const lj = await lookup.json().catch(() => null);
    categoryUid = lj?.data?.route?.uid ?? null;

    if (!categoryUid) {
      const fallbackKey = urlKey.split("/").pop() ?? urlKey;
      const fRes = await fetch(APP_CONFIG.magento.graphqlUrl, {
        method: "POST",
        headers: magentoHeaders(store),
        body: JSON.stringify({
          query: CATEGORY_UID_BY_URL_KEY_QUERY,
          variables: { urlKey: fallbackKey },
        }),
        next: { revalidate: APP_CONFIG.cache.category },
      });
      const fj = await fRes.json().catch(() => null);
      categoryUid = fj?.data?.categories?.items?.[0]?.uid ?? null;
    }
  } catch {
    categoryUid = null;
  }

  if (!categoryUid) {
    return NextResponse.json(
      { error: `Category "${urlKey}" not found` },
      { status: 404 },
    );
  }

  /* Build product filter using category_uid and all dynamic filterable attributes */
  const filters: Record<string, unknown> = {
    category_uid: { eq: categoryUid },
  };

  const RESERVED = new Set(["urlKey", "store", "pageSize", "page", "sort", "q", "search"]);

  for (const [key, value] of searchParams.entries()) {
    if (RESERVED.has(key)) continue;
    const values = value.split(",").filter(Boolean);
    if (values.length === 1) filters[key] = { eq: values[0] };
    else if (values.length > 1) filters[key] = { in: values };
  }

  const leafUrlKey = urlKey.split("/").pop() ?? urlKey;
  const variables: Record<string, unknown> = { urlKey: leafUrlKey, filters, pageSize, currentPage };
  if (sort) variables.sort = sort;
  if (search) variables.search = search;

  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method: "POST",
      headers: magentoHeaders(store),
      body: JSON.stringify({ query: CATEGORY_PAGE_QUERY, variables }),
      next: { revalidate: 300 },
    });

    const json = await res.json().catch(() => null);

    // Hard failure: HTTP error with no data body
    if (!res.ok && !json?.data) {
      return NextResponse.json(
        { error: json?.errors?.[0]?.message ?? `HTTP ${res.status}` },
        { status: res.status }
      );
    }
    // Magento returned data:null — query-level failure (e.g. invalid variable)
    if (json && json.data === null) {
      const msg = (json.errors as { message: string }[] | undefined)?.[0]?.message ?? "Magento query failed";
      console.error("[category-page] Magento returned null data:", msg);
      return NextResponse.json({ error: msg }, { status: 200 });
    }
    if (json?.errors?.length) {
      console.warn("[category-page] GraphQL warnings:", (json.errors as { message: string }[]).map(e => e.message));
    }

    const cat = json?.data?.categories?.items?.[0];
    const pd  = json?.data?.products;

    return NextResponse.json(
      {
        category: cat ? {
          uid:             cat.uid,
          name:            cat.name,
          description:     cat.description ?? null,
          metaTitle:       cat.meta_title ?? null,
          metaDescription: cat.meta_description ?? null,
          urlKey:          cat.url_key,
        } : null,
        products:    withBrandLogos(parseGraphqlResponse({ data: { products: pd } })),
        /* Layered-nav options for the sidebar come back on this same
           response, so the listing needs no second request. */
        filters:     parseAggregations({ data: { products: pd } }),
        total:       pd?.total_count ?? 0,
        totalPages:  pd?.page_info?.total_pages ?? 1,
        currentPage: pd?.page_info?.current_page ?? currentPage,
      },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Network error" },
      { status: 502 }
    );
  }
}
