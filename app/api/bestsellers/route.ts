import { NextRequest, NextResponse } from "next/server";
import { BESTSELLERS_QUERY } from "@/lib/queries";
import { adaptGqlProduct, type GqlProduct } from "@/lib/magento";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

/* GET /api/bestsellers?pageSize=12&page=1&store=default
 *
 * Returns bestselling products from the MagePlaza SMTP extension.
 * Ordered by qty_ordered descending (handled by the extension). */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pageSize    = Math.min(Number(searchParams.get("pageSize") ?? 12) || 12, 48);
  const currentPage = Math.max(Number(searchParams.get("page") ?? 1) || 1, 1);
  const store       = searchParams.get("store") ?? "default";

  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method:  "POST",
      headers: magentoHeaders(store) as Record<string, string>,
      body:    JSON.stringify({
        query:     BESTSELLERS_QUERY,
        variables: { pageSize, currentPage },
      }),
      next: { revalidate: 1800 },
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || json?.errors?.length) {
      return NextResponse.json(
        { products: [], error: json?.errors?.[0]?.message ?? `HTTP ${res.status}` },
        { status: res.ok ? 200 : res.status }
      );
    }

    const result = json?.data?.mpSmtpBestsellers;
    const items  = (result?.items ?? []).map((entry: { product: GqlProduct; qty_ordered: number }) =>
      adaptGqlProduct(entry.product),
    );

    return NextResponse.json(
      {
        products:    items,
        total:       result?.page_info?.total_pages ? items.length : 0,
        currentPage: result?.page_info?.current_page ?? currentPage,
        totalPages:  result?.page_info?.total_pages ?? 1,
      },
      { headers: { "Cache-Control": "s-maxage=1800, stale-while-revalidate=300" } }
    );
  } catch (e) {
    return NextResponse.json(
      { products: [], error: e instanceof Error ? e.message : "Network error" },
      { status: 502 }
    );
  }
}
