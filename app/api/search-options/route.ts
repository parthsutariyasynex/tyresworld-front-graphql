import { NextRequest, NextResponse } from "next/server";
import { SEARCH_OPTIONS_QUERY } from "@/lib/queries";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") ?? searchParams.get("store") ?? "en";

  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method:  "POST",
      headers: magentoHeaders(locale),
      body:    JSON.stringify({ query: SEARCH_OPTIONS_QUERY, variables: { categoryUid: APP_CONFIG.magento.tyresCategoryUid } }),
      next:    { revalidate: 3600 },
    });

    const raw = await res.json().catch(() => null);

    if (!res.ok || raw?.errors?.length) {
      return NextResponse.json(
        { widths: [], heights: [], rims: [], brands: [], error: raw?.errors?.[0]?.message ?? `HTTP ${res.status}` },
        { status: res.ok ? 200 : res.status }
      );
    }

    const aggs = raw?.data?.products?.aggregations ?? [];

    const getOptions = (code: string) => {
      const agg = aggs.find((a: { attribute_code: string }) => a.attribute_code === code);
      return (agg?.options ?? [])
        .map((o: { label: string; value: string; count: number }) => ({ label: o.label, value: o.value, count: o.count }))
        .filter((o: { label: string; value: string }) => o.label && o.value);
    };

    const widths  = getOptions("width") .sort((a: { value: string }, b: { value: string }) => parseFloat(a.value) - parseFloat(b.value));
    const heights = getOptions("height").sort((a: { value: string }, b: { value: string }) => parseFloat(a.value) - parseFloat(b.value));
    const rims    = getOptions("rim")   .sort((a: { value: string }, b: { value: string }) => parseFloat(a.value) - parseFloat(b.value));
    const brands  = getOptions("mgs_brand").sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label));

    return NextResponse.json(
      { widths, heights, rims, brands },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" } }
    );
  } catch (err) {
    return NextResponse.json(
      { widths: [], heights: [], rims: [], brands: [], error: err instanceof Error ? err.message : "Network error" },
      { status: 502 }
    );
  }
}
