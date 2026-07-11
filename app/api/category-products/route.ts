import { NextRequest, NextResponse } from "next/server";
import { getCategoryProducts, type SortInput } from "@/lib/services/category.service";

function buildSort(order: string): SortInput | undefined {
  switch (order) {
    case "recommended":  return { position: "ASC" };
    // price sort is unsupported by this Magento's ProductAttributeSortInput
    // (only mst_sort / position / relevance are valid).
    // Price ordering is applied client-side after the page is fetched.
    default:             return undefined;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const categoryUid = searchParams.get("categoryUid") ?? "";
  const store       = searchParams.get("store") ?? "default";
  const pageSize    = Math.min(Number(searchParams.get("pageSize") ?? 12) || 12, 48);
  const currentPage = Math.max(Number(searchParams.get("page") ?? 1) || 1, 1);
  const sort        = buildSort(searchParams.get("sort") ?? "");

  if (!categoryUid) {
    return NextResponse.json(
      { products: [], total: 0, error: "categoryUid is required" },
      { status: 400 },
    );
  }

  /* Build filter input — always include category_uid, add any attribute filters */
  const filters: Record<string, unknown> = { category_uid: { eq: categoryUid } };
  // stock_status / quantity_and_stock_status are not filterable on this store
  const BLOCKED_FILTERS = new Set(["stock_status", "quantity_and_stock_status"]);
  for (const [key, value] of searchParams.entries()) {
    if (["categoryUid", "store", "pageSize", "page", "sort"].includes(key)) continue;
    if (BLOCKED_FILTERS.has(key)) continue;
    const values = value.split(",").filter(Boolean);
    if (values.length === 1) {
      filters[key] = { eq: values[0] };
    } else if (values.length > 1) {
      filters[key] = { in: values };
    }
  }

  const r = await getCategoryProducts({ categoryUid, filters, sort, pageSize, currentPage, store });

  if (!r.ok) {
    return NextResponse.json({ products: [], total: 0, error: r.error }, { status: r.status });
  }
  if (r.error) {
    return NextResponse.json({ products: [], total: 0, error: r.error }, { status: 200 });
  }

  return NextResponse.json(
    {
      category:    r.category,
      products:    r.products,
      total:       r.total,
      totalPages:  r.totalPages,
      currentPage: r.currentPage,
    },
    { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } },
  );
}
