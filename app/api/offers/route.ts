import { NextRequest, NextResponse } from "next/server";
import { OFFERS_AGGREGATION_QUERY, OFFERS_PRODUCTS_QUERY } from "@/lib/queries";
import { parseGraphqlResponse } from "@/lib/magento";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";
export interface OfferOption {
  label: string;
  value: string;
  count: number;
}

/* GET /api/offers
 *   → returns { offers: OfferOption[] }
 *
 * GET /api/offers?offer=Budget+Deals&pageSize=12&page=1
 *   → returns { products, total, totalPages, currentPage }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const offerValue  = searchParams.get("offer");
  const store       = searchParams.get("store") ?? "default";
  const pageSize    = Math.min(Number(searchParams.get("pageSize") ?? 12) || 12, 48);
  const currentPage = Math.max(Number(searchParams.get("page") ?? 1) || 1, 1);

  /* ── Product listing for a selected offer ── */
  if (offerValue) {
    try {
      const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
        method: "POST",
        headers: magentoHeaders(store),
        body: JSON.stringify({
          query: OFFERS_PRODUCTS_QUERY,
          variables: { offerValue, pageSize, currentPage },
        }),
        next: { revalidate: 300 },
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || json?.errors?.length) {
        return NextResponse.json(
          { products: [], total: 0, error: json?.errors?.[0]?.message ?? `HTTP ${res.status}` },
          { status: res.ok ? 200 : res.status }
        );
      }

      const pd = json?.data?.products;
      return NextResponse.json(
        {
          products:    parseGraphqlResponse({ data: { products: pd } }),
          total:       pd?.total_count ?? 0,
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

  /* ── Offers aggregation list ── */
  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method: "POST",
      headers: magentoHeaders(store),
      body: JSON.stringify({ query: OFFERS_AGGREGATION_QUERY, variables: { categoryUid: APP_CONFIG.magento.tyresCategoryUid } }),
      next: { revalidate: 3600 },
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || json?.errors?.length) {
      return NextResponse.json(
        { offers: [], error: json?.errors?.[0]?.message ?? `HTTP ${res.status}` },
        { status: res.ok ? 200 : res.status }
      );
    }

    const aggs: { attribute_code: string; options: OfferOption[] }[] =
      json?.data?.products?.aggregations ?? [];

    const offers: OfferOption[] = (
      aggs.find((a) => a.attribute_code === "offers")?.options ?? []
    ).map((o) => ({
      label: o.label,
      value: o.value,
      count: Number(o.count ?? 0),
    }));

    return NextResponse.json(
      { offers },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" } }
    );
  } catch (err) {
    return NextResponse.json(
      { offers: [], error: err instanceof Error ? err.message : "Network error" },
      { status: 502 }
    );
  }
}
