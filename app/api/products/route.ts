import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/services/product.service";
import { APP_CONFIG } from "@/src/config/app-config";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const search      = searchParams.get("search") ?? searchParams.get("query") ?? "tyre";
  const pageSize    = Number(searchParams.get("pageSize") ?? 24) || 24;
  const currentPage = Number(searchParams.get("page") ?? 1) || 1;
  const store       = searchParams.get("locale") ?? searchParams.get("store") ?? "en";
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
