import { NextRequest, NextResponse } from "next/server";
import { CATEGORY_PAGE_QUERY } from "@/lib/queries";
import { parseGraphqlResponse } from "@/lib/magento";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";
type SortInput = Record<string, "ASC" | "DESC">;

function buildSort(order: string): SortInput | undefined {
  switch (order) {
    case "recommended":  return { position: "ASC" };
    // price sort is unsupported by this Magento's ProductAttributeSortInput
    // (only mst_sort / position / relevance are valid).
    // Price ordering is applied client-side after the page is fetched.
    default:             return undefined;
  }
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

  /* Build product filter — always include category_url_path, merge attribute filters */
  const filters: Record<string, unknown> = {
    category_url_path: { eq: urlKey },
  };
  const RESERVED = new Set(["urlKey", "store", "pageSize", "page", "sort", "q", "search"]);
  const FILTERABLE = new Set([
    "width", "height", "rim", "mgs_brand", "vehicle", "model", "year",
    "price", "offers", "category_uid",
  ]);
  for (const [key, value] of searchParams.entries()) {
    if (RESERVED.has(key) || !FILTERABLE.has(key)) continue;
    const values = value.split(",").filter(Boolean);
    if (values.length === 1) filters[key] = { eq: values[0] };
    else if (values.length > 1) filters[key] = { in: values };
  }

  const variables: Record<string, unknown> = { urlKey, filters, pageSize, currentPage };
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
        products:    parseGraphqlResponse({ data: { products: pd } }),
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
