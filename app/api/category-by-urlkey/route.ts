/* Deprecated — use /api/category-page instead */
import { NextRequest, NextResponse } from "next/server";
import { CATEGORY_PAGE_QUERY } from "@/lib/queries";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const urlKey = searchParams.get("urlKey") ?? "run-flat-tires";
  const store  = searchParams.get("store") ?? "default";

  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method: "POST",
      headers: magentoHeaders(store),
      body: JSON.stringify({
        query: CATEGORY_PAGE_QUERY,
        variables: { urlKey, filters: { category_url_path: { eq: urlKey } }, pageSize: 1, currentPage: 1 },
      }),
      next: { revalidate: 3600 },
    });

    const json = await res.json().catch(() => null);
    const cat  = json?.data?.categories?.items?.[0];

    if (!cat?.uid) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    return NextResponse.json({
      uid: cat.uid, name: cat.name, description: cat.description ?? null,
      metaTitle: cat.meta_title ?? null, metaDescription: cat.meta_description ?? null,
      urlKey: cat.url_key, urlPath: cat.url_key,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Network error" }, { status: 502 });
  }
}
