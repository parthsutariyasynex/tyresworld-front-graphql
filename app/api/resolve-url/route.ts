import { NextRequest, NextResponse } from "next/server";
import { ROUTE_QUERY } from "@/lib/queries";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

/* GET /api/resolve-url?url=<path>
 *
 * Uses the Magento `route` query to resolve a URL path to its underlying
 * entity type (product, category, or CMS page) and identifier.
 * Useful for dynamic routing without hardcoding URL structure.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url   = searchParams.get("url");
  const store = searchParams.get("store") ?? "default";

  if (!url) return NextResponse.json({ route: null, error: "url param required" }, { status: 400 });

  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method:  "POST",
      headers: magentoHeaders(store) as Record<string, string>,
      body:    JSON.stringify({ query: ROUTE_QUERY, variables: { url } }),
      next:    { revalidate: 3600 },
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || json?.errors?.length) {
      return NextResponse.json(
        { route: null, error: json?.errors?.[0]?.message ?? `HTTP ${res.status}` },
        { status: res.ok ? 200 : res.status }
      );
    }

    return NextResponse.json(
      { route: json?.data?.route ?? null },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" } }
    );
  } catch (e) {
    return NextResponse.json(
      { route: null, error: e instanceof Error ? e.message : "Network error" },
      { status: 502 }
    );
  }
}
