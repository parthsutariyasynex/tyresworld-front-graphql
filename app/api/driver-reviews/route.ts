import { NextRequest, NextResponse } from "next/server";
import { KLEVER_DRIVER_REVIEWS_QUERY } from "@/lib/queries";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

/* GET /api/driver-reviews?store=default
 *
 * Returns the DriverReviews (Klever) SDK/widget config. Cached — it only
 * changes when an admin edits config. Per-product data comes from the
 * `driver_reviews` field on products, not here. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const store = searchParams.get("store") ?? "default";

  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method:  "POST",
      headers: magentoHeaders(store),
      body:    JSON.stringify({ query: KLEVER_DRIVER_REVIEWS_QUERY }),
      next:    { revalidate: 3600 },
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || json?.errors?.length) {
      return NextResponse.json(
        { config: null, error: json?.errors?.[0]?.message ?? `HTTP ${res.status}` },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { config: json?.data?.kleverDriverReviews ?? null },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" } },
    );
  } catch (e) {
    return NextResponse.json(
      { config: null, error: e instanceof Error ? e.message : "Network error" },
      { status: 502 },
    );
  }
}
