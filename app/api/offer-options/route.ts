import { NextRequest, NextResponse } from "next/server";
import { OFFER_OPTIONS_QUERY } from "@/lib/queries";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";
/* GET /api/offer-options?store=default
 *
 * Returns { options: Record<string, string> }
 * where keys are Magento option IDs ("4898") and values are labels ("Buy 3 Get 1 Free").
 * This mapping is stable until an admin changes offer options — cached for 1 hour.
 */
export async function GET(req: NextRequest) {
  const store = new URL(req.url).searchParams.get("store") ?? "default";

  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method:  "POST",
      headers: magentoHeaders(store),
      body:    JSON.stringify({ query: OFFER_OPTIONS_QUERY }),
      next:    { revalidate: 3600 },
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || json?.errors?.length) {
      return NextResponse.json(
        { options: {}, error: json?.errors?.[0]?.message ?? `HTTP ${res.status}` },
        { status: res.ok ? 200 : res.status }
      );
    }

    const rawOptions: { value: string; label: string }[] =
      json?.data?.customAttributeMetadataV2?.items?.[0]?.options ?? [];

    const options: Record<string, string> = {};
    for (const o of rawOptions) {
      if (o.value && o.label) options[o.value] = o.label;
    }

    return NextResponse.json(
      { options },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" } }
    );
  } catch (err) {
    return NextResponse.json(
      { options: {}, error: err instanceof Error ? err.message : "Network error" },
      { status: 502 }
    );
  }
}
