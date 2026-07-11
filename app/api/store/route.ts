import { NextRequest, NextResponse } from "next/server";
import { STORE_CONFIG_QUERY, AVAILABLE_STORES_QUERY, CURRENCY_QUERY } from "@/lib/queries";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

/* GET /api/store?op=config|stores|currency&store=default */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const op    = searchParams.get("op") ?? "config";
  const store = searchParams.get("store") ?? "default";

  const queryMap: Record<string, string> = {
    config:   STORE_CONFIG_QUERY,
    stores:   AVAILABLE_STORES_QUERY,
    currency: CURRENCY_QUERY,
  };

  const query = queryMap[op];
  if (!query) {
    return NextResponse.json({ error: `Unknown store op: ${op}` }, { status: 400 });
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

    const dataKey = op === "config" ? "storeConfig" : op === "stores" ? "availableStores" : "currency";
    return NextResponse.json(
      { data: json?.data?.[dataKey] ?? null },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" } },
    );
  } catch (e) {
    return NextResponse.json({ data: null, error: e instanceof Error ? e.message : "Network error" }, { status: 502 });
  }
}
