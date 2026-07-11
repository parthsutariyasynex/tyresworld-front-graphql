import { NextRequest, NextResponse } from "next/server";
import { MENU_QUERY } from "@/lib/queries";
import { type GqlCategoriesResponse, type GqlCategory, type MenuItem } from "@/lib/magento";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";


function catHref(urlPath?: string): string {
  if (!urlPath) return "/";
  return `/en/${urlPath}`;
}

/** include_in_menu: 0 means explicitly hidden; anything else (1, null, undefined) = visible */
function visible(c: GqlCategory): boolean {
  return c.include_in_menu !== 0;
}

function adaptCat(c: GqlCategory): MenuItem | null {
  if (!c.uid || !c.name) return null;
  const children = (c.children ?? [])
    .filter(visible)
    .map(adaptCat)
    .filter((x): x is MenuItem => x !== null);
  return {
    uid: c.uid,
    label: c.name,
    href: catHref(c.url_path),
    ...(children.length ? { children } : {}),
  };
}

function buildNavMenu(raw: GqlCategoriesResponse): MenuItem[] {
  const rootCats = (raw?.data?.categories?.items ?? []).filter(visible);
  return rootCats
    .map(adaptCat)
    .filter((x): x is MenuItem => x !== null);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") ?? "en";

  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method: "POST",
      headers: magentoHeaders(locale),
      body: JSON.stringify({ query: MENU_QUERY }),
      // no-store: bypass Next.js Data Cache so stale cached responses never silently serve
      // an empty menu. The response-level Cache-Control header handles CDN/browser caching.
      cache: "no-store",
    });

    const raw = (await res.json().catch(() => null)) as GqlCategoriesResponse | null;

    // Only fail if the HTTP request itself failed OR Magento returned no category data.
    // Do NOT bail on raw.errors — Magento frequently emits deprecation warnings or
    // non-fatal partial errors alongside perfectly valid data, which would make the
    // menu silently empty if we treated any error as fatal.
    if (!res.ok || !raw?.data?.categories?.items?.length) {
      return NextResponse.json(
        { menu: [], error: raw?.errors?.[0]?.message ?? `HTTP ${res.status}` },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { menu: buildNavMenu(raw) },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } }
    );
  } catch (err) {
    return NextResponse.json(
      { menu: [], error: err instanceof Error ? err.message : "Network error" },
      { status: 502 }
    );
  }
}
