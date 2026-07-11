import { NextRequest, NextResponse } from "next/server";
import { PRODUCT_DETAIL_QUERY, PRODUCT_DETAIL_BY_URLKEY_QUERY } from "@/lib/queries";
import { parseProductDetail, type GqlProductDetailResponse } from "@/lib/magento";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sku     = searchParams.get("sku")     ?? "";
  const urlKey  = searchParams.get("urlKey")  ?? "";
  const store   = searchParams.get("store")   ?? "default";

  if (!sku && !urlKey) {
    return NextResponse.json({ product: null, error: "Missing sku or urlKey" }, { status: 400 });
  }

  const query     = urlKey ? PRODUCT_DETAIL_BY_URLKEY_QUERY : PRODUCT_DETAIL_QUERY;
  const variables = urlKey ? { urlKey } : { sku };

  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method:  "POST",
      headers: magentoHeaders(store),
      body:    JSON.stringify({ query, variables }),
      next:    { revalidate: 300 },
    });

    const raw = (await res.json().catch(() => null)) as GqlProductDetailResponse | null;

    if (!res.ok || raw?.errors?.length) {
      return NextResponse.json(
        { product: null, error: raw?.errors?.[0]?.message ?? `HTTP ${res.status}` },
        { status: res.ok ? 200 : res.status }
      );
    }

    const product = parseProductDetail(raw);
    if (!product) {
      return NextResponse.json({ product: null, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(
      { product },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } }
    );
  } catch (err) {
    return NextResponse.json(
      { product: null, error: err instanceof Error ? err.message : "Network error" },
      { status: 502 }
    );
  }
}
