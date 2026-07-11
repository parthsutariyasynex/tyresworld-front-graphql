import { NextRequest, NextResponse } from "next/server";
import { COUNTRIES_QUERY, COUNTRY_QUERY } from "@/lib/queries";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

/* GET /api/countries            → all countries with regions
 * GET /api/countries?id=AE      → single country by ISO code */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id    = searchParams.get("id");
  const store = searchParams.get("store") ?? "default";

  try {
    if (id) {
      const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
        method:  "POST",
        headers: magentoHeaders(store),
        body:    JSON.stringify({ query: COUNTRY_QUERY, variables: { id } }),
        next:    { revalidate: 86400 },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || json?.errors?.length) {
        return NextResponse.json(
          { country: null, error: json?.errors?.[0]?.message ?? `HTTP ${res.status}` },
          { status: res.ok ? 200 : res.status },
        );
      }

      return NextResponse.json(
        { country: json?.data?.country ?? null },
        { headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600" } },
      );
    }

    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method:  "POST",
      headers: magentoHeaders(store),
      body:    JSON.stringify({ query: COUNTRIES_QUERY }),
      next:    { revalidate: 86400 },
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || json?.errors?.length) {
      return NextResponse.json(
        { countries: [], error: json?.errors?.[0]?.message ?? `HTTP ${res.status}` },
        { status: res.ok ? 200 : res.status },
      );
    }

    return NextResponse.json(
      { countries: json?.data?.countries ?? [] },
      { headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600" } },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Network error" },
      { status: 502 },
    );
  }
}
