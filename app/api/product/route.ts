import { NextRequest, NextResponse } from "next/server";
import { PRODUCT_DETAIL_QUERY, parseProductDetail, type GqlProductDetailResponse } from "@/lib/magento";

/* Single product detail by url_key — proxies Magento GraphQL server-side. */
const GRAPHQL_URL =
  (process.env.MAGENTO_GRAPHQL_URL ?? "https://www.tyrescart.ae/graphql").replace(/\/$/, "");
const MAGENTO_TOKEN = process.env.MAGENTO_API_TOKEN ?? "";

export async function GET(req: NextRequest) {
  const urlKey = new URL(req.url).searchParams.get("urlKey") ?? "";
  if (!urlKey) {
    return NextResponse.json({ product: null, error: "Missing urlKey" }, { status: 400 });
  }

  const headers: HeadersInit = { Accept: "application/json", "Content-Type": "application/json" };
  if (MAGENTO_TOKEN) headers["Authorization"] = `Bearer ${MAGENTO_TOKEN}`;

  try {
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: PRODUCT_DETAIL_QUERY, variables: { urlKey } }),
      next: { revalidate: 300 },
    });
    const raw = (await res.json().catch(() => null)) as GqlProductDetailResponse | null;

    if (!res.ok || raw?.errors?.length) {
      return NextResponse.json(
        { product: null, error: raw?.errors?.[0]?.message ?? `Magento GraphQL returned HTTP ${res.status}` },
        { status: res.ok ? 200 : res.status }
      );
    }

    const product = parseProductDetail(raw);
    return NextResponse.json(
      { product },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } }
    );
  } catch (err) {
    return NextResponse.json(
      { product: null, error: err instanceof Error ? err.message : "Network error reaching Magento GraphQL" },
      { status: 502 }
    );
  }
}
