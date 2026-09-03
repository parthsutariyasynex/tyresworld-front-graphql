import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/services/product.service";
import { APP_CONFIG } from "@/src/config/app-config";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  /* No keyword means no keyword — defaulting to "tyre" narrowed the
     catalogue from 8,522 matches to 7,404 and hid ~1,100 products. */
  const search      = searchParams.get("search") ?? searchParams.get("query") ?? "";
  const pageSize    = Number(searchParams.get("pageSize") ?? 24) || 24;
  const currentPage = Number(searchParams.get("page") ?? 1) || 1;
  const store       = searchParams.get("locale") ?? searchParams.get("store") ?? "en";
  /* Left undefined (never null) when absent — getProducts then omits the
     variable, because `category_uid: { eq: null }` crashes Elasticsuite. */
  const categoryUid = searchParams.get("categoryUid") ?? undefined;

  const r = await getProducts({ search, pageSize, currentPage, categoryUid, store });

  if (r.error) {
    return NextResponse.json({ products: [], total: 0, error: r.error }, { status: r.status });
  }

  return NextResponse.json(
    { products: r.products, total: r.total, totalPages: r.totalPages, currentPage: r.currentPage },
    { headers: { "Cache-Control": `s-maxage=${APP_CONFIG.cache.products}, stale-while-revalidate=60` } },
  );
}
