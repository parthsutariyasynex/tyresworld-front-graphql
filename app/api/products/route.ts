import { NextRequest, NextResponse } from "next/server";
import { PRODUCTS_QUERY } from "@/lib/queries";
import { parseGraphqlResponse, type GqlProductsResponse } from "@/lib/magento";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const search      = searchParams.get("search") ?? searchParams.get("query") ?? "tyre";
  const pageSize    = Number(searchParams.get("pageSize") ?? 24) || 24;
  const currentPage = Number(searchParams.get("page") ?? 1) || 1;
  const locale      = searchParams.get("locale") ?? searchParams.get("store") ?? "en";
  const categoryUid = searchParams.get("categoryUid") ?? undefined;

  const variables = { search, pageSize, currentPage, categoryUid };

  let raw: GqlProductsResponse | null = null;
  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method:  "POST",
      headers: magentoHeaders(locale),
      body:    JSON.stringify({ query: PRODUCTS_QUERY, variables }),
      next:    { revalidate: APP_CONFIG.cache.products },
    });

    raw = (await res.json().catch(() => null)) as GqlProductsResponse | null;

    if (!res.ok) {
      return NextResponse.json(
        { products: [], total: 0, error: `Magento GraphQL HTTP ${res.status}` },
        { status: res.status }
      );
    }
    if (raw?.errors?.length) {
      return NextResponse.json(
        { products: [], total: 0, error: raw.errors[0].message },
        { status: 200 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { products: [], total: 0, error: err instanceof Error ? err.message : "Network error" },
      { status: 502 }
    );
  }

  const products = parseGraphqlResponse(raw);
  const pd       = raw?.data?.products;

  return NextResponse.json(
    {
      products,
      total:       pd?.total_count    ?? products.length,
      totalPages:  pd?.page_info?.total_pages   ?? 1,
      currentPage: pd?.page_info?.current_page  ?? currentPage,
    },
    { headers: { "Cache-Control": `s-maxage=${APP_CONFIG.cache.products}, stale-while-revalidate=60` } }
  );
}
