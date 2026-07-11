import { NextRequest, NextResponse } from "next/server";
import { STORE_CONFIG_QUERY, AVAILABLE_STORES_QUERY, CURRENCY_QUERY } from "@/lib/queries";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

const QUERY_MAP: Record<string, string> = {
  config:   STORE_CONFIG_QUERY,
  stores:   AVAILABLE_STORES_QUERY,
  currency: CURRENCY_QUERY,
};

const DATA_KEY_MAP: Record<string, string> = {
  config:   "storeConfig",
  stores:   "availableStores",
  currency: "currency",
};

/* GET /api/store-config?type=config|stores|currency&store=default */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type  = searchParams.get("type") ?? "config";
  const store = searchParams.get("store") ?? "default";

  const query = QUERY_MAP[type];
  if (!query) {
    return NextResponse.json({ data: null, error: `Unknown type: ${type}` }, { status: 400 });
  }

  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method:  "POST",
      headers: magentoHeaders(store),
      body:    JSON.stringify({ query }),
      next:    { revalidate: 3600 },
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || json?.errors?.length) {
      return NextResponse.json(
        { data: null, error: json?.errors?.[0]?.message ?? `HTTP ${res.status}` },
        { status: res.ok ? 200 : res.status },
      );
    }

    return NextResponse.json(
      { data: json?.data?.[DATA_KEY_MAP[type]] ?? null },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" } },
    );
  } catch (e) {
    return NextResponse.json(
      { data: null, error: e instanceof Error ? e.message : "Network error" },
      { status: 502 },
    );
  }
}
