import { NextRequest, NextResponse } from "next/server";
import { FILTERS_QUERY } from "@/lib/queries";
import { parseAggregations, type GqlProductsResponse } from "@/lib/magento";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";
export async function GET(req: NextRequest) {
  const search = new URL(req.url).searchParams.get("search") ?? "";

  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method: "POST",
      headers: magentoHeaders(),
      body: JSON.stringify({ query: FILTERS_QUERY, variables: { search } }),
      next: { revalidate: 300 },
    });

    const raw = (await res.json().catch(() => null)) as GqlProductsResponse | null;

    if (!res.ok || raw?.errors?.length) {
      return NextResponse.json(
        { aggregations: [], error: raw?.errors?.[0]?.message ?? `HTTP ${res.status}` },
        { status: res.ok ? 200 : res.status }
      );
    }

    return NextResponse.json(
      { aggregations: parseAggregations(raw) },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } }
    );
  } catch (err) {
    return NextResponse.json(
      { aggregations: [], error: err instanceof Error ? err.message : "Network error" },
      { status: 502 }
    );
  }
}
