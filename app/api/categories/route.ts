import { NextRequest, NextResponse } from "next/server";
import { MENU_QUERY, CATEGORY_META_BY_URL_KEY_QUERY } from "@/lib/queries";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const urlKey = searchParams.get("urlKey");
  const locale = searchParams.get("locale") ?? "en";
  const store = searchParams.get("store") ?? (locale === "ar" ? "ar" : "default");

  try {
    if (urlKey) {
      const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
        method: "POST",
        headers: magentoHeaders(store),
        body: JSON.stringify({
          query: CATEGORY_META_BY_URL_KEY_QUERY,
          variables: { urlKey },
        }),
      });

      const json = await res.json().catch(() => null);
      const cat = json?.data?.categories?.items?.[0];

      if (!cat) {
        return NextResponse.json({ error: `Category with urlKey "${urlKey}" not found` }, { status: 404 });
      }

      return NextResponse.json(
        {
          category: {
            uid: cat.uid,
            name: cat.name,
            urlKey: cat.url_key,
            description: cat.description ?? null,
            metaTitle: cat.meta_title ?? null,
            metaDescription: cat.meta_description ?? null,
          },
        },
        { headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=120" } }
      );
    }

    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method: "POST",
      headers: magentoHeaders(store),
      body: JSON.stringify({
        query: MENU_QUERY,
      }),
    });

    const json = await res.json().catch(() => null);
    const items = json?.data?.categories?.items ?? [];

    return NextResponse.json(
      { categories: items, total: items.length },
      { headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=120" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Network error" },
      { status: 502 }
    );
  }
}
