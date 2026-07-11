import { NextRequest, NextResponse } from "next/server";
import { getProductDetail } from "@/lib/services/product.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sku    = searchParams.get("sku")    ?? "";
  const urlKey = searchParams.get("urlKey") ?? "";
  const store  = searchParams.get("store")  ?? "default";

  if (!sku && !urlKey) {
    return NextResponse.json({ product: null, error: "Missing sku or urlKey" }, { status: 400 });
  }

  const r = await getProductDetail({ sku: sku || undefined, urlKey: urlKey || undefined, store });

  if (r.error || !r.product) {
    return NextResponse.json({ product: null, error: r.error ?? "Product not found" }, { status: r.status });
  }

  return NextResponse.json(
    { product: r.product },
    { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } },
  );
}
