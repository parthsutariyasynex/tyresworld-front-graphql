/* ─────────────────────────────────────────────────────────────────
   MENU SERVICE
   Builds the navigation menu from the Magento category tree.
───────────────────────────────────────────────────────────────── */
import { magentoFetch } from "@/lib/graphql/client";
import { MENU_QUERY } from "@/lib/queries";
import type { GqlCategoriesResponse, GqlCategory, MenuItem } from "@/lib/magento";

export interface MenuResult {
  ok: boolean;
  status: number;
  menu: MenuItem[];
  error?: string;
}

// NOTE: locale prefix is hardcoded to /en/ here to preserve current
// behaviour; the Header rewrites /en/ → /<locale>/ downstream. Dynamic
// locale routing is addressed in Phase 2.
function catHref(urlPath?: string): string {
  if (!urlPath) return "/";
  return `/en/${urlPath}`;
}

/** include_in_menu: 0 means explicitly hidden; anything else = visible */
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

function buildNavMenu(data: GqlCategoriesResponse["data"]): MenuItem[] {
  const rootCats = (data?.categories?.items ?? []).filter(visible);
  return rootCats.map(adaptCat).filter((x): x is MenuItem => x !== null);
}

export async function getMenu(locale = "en"): Promise<MenuResult> {
  const r = await magentoFetch<GqlCategoriesResponse["data"]>(
    MENU_QUERY,
    undefined,
    // no-store: never let a stale cached response serve an empty menu.
    { store: locale, noStore: true },
  );

  // Only fail on HTTP error or genuinely empty category data — Magento
  // frequently emits non-fatal deprecation warnings in `errors` alongside
  // perfectly valid data, so we do NOT bail on `errors` alone.
  if (!r.ok || !r.data?.categories?.items?.length) {
    return { ok: r.ok, status: r.ok ? 200 : r.status, menu: [], error: r.errors?.[0]?.message ?? (r.ok ? undefined : `HTTP ${r.status}`) };
  }

  return { ok: true, status: 200, menu: buildNavMenu(r.data) };
}
