import { NextRequest, NextResponse } from "next/server";
import { CMS_PAGE_QUERY, CMS_BLOCKS_QUERY } from "@/lib/queries";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

/* GET /api/cms?type=page&identifier=about-us&store=default
 * GET /api/cms?type=blocks&identifiers=footer-links,promo-banner&store=default */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type        = searchParams.get("type") ?? "page";
  const identifier  = searchParams.get("identifier");
  const identifiers = searchParams.get("identifiers")?.split(",").filter(Boolean) ?? [];
  const store       = searchParams.get("store") ?? "default";

  try {
    if (type === "page") {
      if (!identifier) {
        return NextResponse.json({ page: null, error: "identifier is required" }, { status: 400 });
      }

      const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
        method:  "POST",
        headers: magentoHeaders(store),
        body:    JSON.stringify({ query: CMS_PAGE_QUERY, variables: { identifier } }),
        next:    { revalidate: 3600 },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || json?.errors?.length) {
        return NextResponse.json(
          { page: null, error: json?.errors?.[0]?.message ?? `HTTP ${res.status}` },
          { status: res.ok ? 200 : res.status },
        );
      }

      return NextResponse.json(
        { page: json?.data?.cmsPage ?? null },
        { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" } },
      );
    }

    if (type === "blocks") {
      if (!identifiers.length) {
        return NextResponse.json({ blocks: [], error: "identifiers is required" }, { status: 400 });
      }

      const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
        method:  "POST",
        headers: magentoHeaders(store),
        body:    JSON.stringify({ query: CMS_BLOCKS_QUERY, variables: { identifiers } }),
        next:    { revalidate: 3600 },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || json?.errors?.length) {
        return NextResponse.json(
          { blocks: [], error: json?.errors?.[0]?.message ?? `HTTP ${res.status}` },
          { status: res.ok ? 200 : res.status },
        );
      }

      return NextResponse.json(
        { blocks: json?.data?.cmsBlocks?.items ?? [] },
        { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" } },
      );
    }

    return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Network error" },
      { status: 502 },
    );
  }
}
