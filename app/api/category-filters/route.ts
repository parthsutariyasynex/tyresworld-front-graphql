import { NextRequest, NextResponse } from "next/server";
import { CATEGORY_FILTERS_QUERY } from "@/lib/queries";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

// Exclude internal category UIDs, unfilterable stock fields, and dimensions (height/width/rim) from layered nav
const EXCLUDED = new Set([
  "category_id",
  "category_uid",
  "price",
  "stock_status",
  "quantity_and_stock_status",
  "height",
  "width",
  "rim",
  "tyre_height",
  "tyre_width",
  "tyre_rim",
  "rim_size",
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryUid = searchParams.get("categoryUid") ?? "";
  const store       = searchParams.get("store") ?? "default";

  if (!categoryUid) {
    return NextResponse.json({ filters: [] }, { status: 400 });
  }

  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method: "POST",
      headers: magentoHeaders(store),
      body: JSON.stringify({ query: CATEGORY_FILTERS_QUERY, variables: { categoryUid } }),
      next: { revalidate: 600 },
    });

    const json = await res.json().catch(() => null);
    const aggs = json?.data?.products?.aggregations ?? [];

    // Pure dynamic mapping directly from Magento GraphQL aggregations
    const filters = aggs
      .filter((a: { attribute_code?: string }) =>
        a.attribute_code && !EXCLUDED.has(a.attribute_code)
      )
      .map((a: { attribute_code: string; label: string; options: { label: string; value: string; count: number }[] }) => ({
        code:    a.attribute_code,
        label:   a.label || a.attribute_code,
        options: (a.options ?? [])
          .filter((o: { value?: string; label?: string }) => o.value != null && o.label)
          .map((o: { label: string; value: string; count: number }) => ({
            label: o.label,
            value: String(o.value),
            count: Number(o.count ?? 0),
          })),
      }))
      .filter((g: { options: unknown[] }) => g.options.length > 0);

    return NextResponse.json(
      { filters },
      { headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=120" } }
    );
  } catch (err) {
    return NextResponse.json(
      { filters: [], error: err instanceof Error ? err.message : "Network error" },
      { status: 502 }
    );
  }
}
