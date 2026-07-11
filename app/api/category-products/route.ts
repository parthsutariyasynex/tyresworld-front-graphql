import { NextRequest, NextResponse } from "next/server";
import { parseGraphqlResponse, type GqlProductsResponse } from "@/lib/magento";
import { CATEGORY_PRODUCTS_BY_UID_QUERY } from "@/lib/queries";
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

  const categoryUid = searchParams.get("categoryUid") ?? "";
  const store       = searchParams.get("store") ?? "default";
  const pageSize    = Math.min(Number(searchParams.get("pageSize") ?? 12) || 12, 48);
  const currentPage = Math.max(Number(searchParams.get("page") ?? 1) || 1, 1);
  const sort        = buildSort(searchParams.get("sort") ?? "");

  if (!categoryUid) {
    return NextResponse.json(
      { products: [], total: 0, error: "categoryUid is required" },
      { status: 400 }
    );
  }

  /* Build filter input — always include category_uid, add any attribute filters */
  const filters: Record<string, unknown> = {
    category_uid: { eq: categoryUid },
  };
  // stock_status / quantity_and_stock_status are not filterable on this store
  const BLOCKED_FILTERS = new Set(["stock_status", "quantity_and_stock_status"]);
  for (const [key, value] of searchParams.entries()) {
    if (["categoryUid", "store", "pageSize", "page", "sort"].includes(key)) continue;
    if (BLOCKED_FILTERS.has(key)) continue;
    const values = value.split(",").filter(Boolean);
    if (values.length === 1) {
      filters[key] = { eq: values[0] };
    } else if (values.length > 1) {
      filters[key] = { in: values };
    }
  }

  const variables: Record<string, unknown> = { uid: categoryUid, filters, pageSize, currentPage };
  if (sort) variables.sort = sort;

  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method: "POST",
      headers: magentoHeaders(store),
      body: JSON.stringify({ query: CATEGORY_PRODUCTS_BY_UID_QUERY, variables }),
      next: { revalidate: 300 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = await res.json().catch(() => null);

    if (!res.ok && !json?.data) {
      return NextResponse.json(
        { products: [], total: 0, error: json?.errors?.[0]?.message ?? `HTTP ${res.status}` },
        { status: res.status }
      );
    }
    if (json && json.data === null) {
      const msg = (json.errors as { message: string }[] | undefined)?.[0]?.message ?? "Magento query failed";
      console.error("[category-products] Magento returned null data:", msg);
      return NextResponse.json({ products: [], total: 0, error: msg }, { status: 200 });
    }
    if (json?.errors?.length) {
      console.warn("[category-products] GraphQL warnings:", (json.errors as { message: string }[]).map((e: { message: string }) => e.message));
    }

    const cat      = json?.data?.categories?.items?.[0] ?? null;
    const pd       = json?.data?.products;
    const products = parseGraphqlResponse(json as GqlProductsResponse);

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
        products,
        total:       pd?.total_count ?? products.length,
        totalPages:  pd?.page_info?.total_pages ?? 1,
        currentPage: pd?.page_info?.current_page ?? currentPage,
      },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } }
    );
  } catch (err) {
    return NextResponse.json(
      { products: [], total: 0, error: err instanceof Error ? err.message : "Network error" },
      { status: 502 }
    );
  }
}
