import { NextRequest, NextResponse } from "next/server";
import {
  PRODUCTS_QUERY,
  parseGraphqlResponse,
  parseAggregations,
  type GqlProductsResponse,
} from "@/lib/magento";

/* ─────────────────────────────────────────────────────────────────
   GraphQL proxy — all product data comes from Magento GraphQL.
   Endpoint: MAGENTO_GRAPHQL_URL (.env.local)
───────────────────────────────────────────────────────────────── */
const GRAPHQL_URL =
  (process.env.MAGENTO_GRAPHQL_URL ?? "https://www.tyrescart.ae/graphql").replace(/\/$/, "");
const MAGENTO_TOKEN = process.env.MAGENTO_API_TOKEN ?? "";

// Default category: "Tyres" (Magento uid base64 of id 18 = "MTg=").
const DEFAULT_CATEGORY_UID = process.env.MAGENTO_DEFAULT_CATEGORY_UID ?? "MTg=";

/** Reserved query params — everything else is treated as an attribute filter. */
const RESERVED = new Set([
  "query", "search", "categoryId", "categoryUid", "pageSize", "page", "sort",
]);

/** Encode a numeric Magento category id → GraphQL uid (base64). */
function toCategoryUid(id: string): string {
  try {
    return Buffer.from(String(id)).toString("base64");
  } catch {
    return DEFAULT_CATEGORY_UID;
  }
}

/** Map the UI sort value → a valid Magento ProductAttributeSortInput. */
function buildSort(sort: string | null): Record<string, "ASC" | "DESC"> {
  // Only `position` and `relevance` are valid sort fields on this store.
  if (sort === "relevance") return { relevance: "DESC" };
  return { position: "ASC" }; // featured / default
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const search      = searchParams.get("search") ?? searchParams.get("query") ?? "";
  const pageSize    = Number(searchParams.get("pageSize") ?? 24) || 24;
  const currentPage = Number(searchParams.get("page") ?? 1) || 1;

  // Resolve category uid: explicit uid > legacy numeric id > default.
  const categoryUid =
    searchParams.get("categoryUid") ??
    (searchParams.get("categoryId") ? toCategoryUid(searchParams.get("categoryId")!) : null) ??
    DEFAULT_CATEGORY_UID;

  /* ── Build the attribute filter object ──────────────────────────
     category_uid scopes the listing; every non-reserved query param
     is a Magento attribute filter applied as { in: [...] }.         */
  const filter: Record<string, unknown> = { category_uid: { eq: categoryUid } };
  for (const [key, value] of searchParams.entries()) {
    if (RESERVED.has(key) || !value) continue;
    const values = value.split(",").map((v) => v.trim()).filter(Boolean);
    if (values.length) filter[key] = { in: values };
  }

  const variables: Record<string, unknown> = {
    pageSize,
    currentPage,
    filter,
    sort: buildSort(searchParams.get("sort")),
  };
  if (search.trim()) variables.search = search.trim();

  /* ── Request headers ───────────────────────────────────────────── */
  const headers: HeadersInit = {
    Accept:         "application/json",
    "Content-Type": "application/json",
  };
  if (MAGENTO_TOKEN) headers["Authorization"] = `Bearer ${MAGENTO_TOKEN}`;

  /* ── Call Magento GraphQL ──────────────────────────────────────── */
  let raw: GqlProductsResponse | null = null;
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: PRODUCTS_QUERY, variables }),
      next: { revalidate: 300 },   // cache for 5 minutes
    });

    raw = (await res.json().catch(() => null)) as GqlProductsResponse | null;

    if (res.status === 401) {
      return NextResponse.json(
        {
          source:   "api",
          products: [],
          total:    0,
          error:    "Magento GraphQL authentication failed. Add MAGENTO_API_TOKEN to .env.local.",
          raw,
        },
        { status: 401 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { source: "api", products: [], total: 0, error: `Magento GraphQL returned HTTP ${res.status}`, raw },
        { status: res.status }
      );
    }

    if (raw?.errors?.length) {
      return NextResponse.json(
        { source: "api", products: [], total: 0, error: raw.errors[0].message, raw },
        { status: 200 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      {
        source:   "api",
        products: [],
        total:    0,
        error:    err instanceof Error ? err.message : "Network error reaching Magento GraphQL",
        raw:      null,
      },
      { status: 502 }
    );
  }

  /* ── Adapt GraphQL → our types ─────────────────────────────────── */
  const products = parseGraphqlResponse(raw);
  const pd       = raw?.data?.products;

  return NextResponse.json(
    {
      source:       "api",
      products,
      total:        pd?.total_count ?? products.length,
      totalPages:   pd?.page_info?.total_pages ?? 1,
      currentPage:  pd?.page_info?.current_page ?? currentPage,
      aggregations: parseAggregations(raw),
      raw,          // useful during development — remove in production
    },
    {
      status: 200,
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
    }
  );
}
