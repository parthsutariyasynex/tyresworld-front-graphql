import { NextResponse } from "next/server";
import { FILTERS_QUERY } from "@/lib/queries";
import { parseAggregations, type GqlProductsResponse } from "@/lib/magento";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";
import { findBrandLogo, listDiscoveredBrandLogos } from "@/lib/brandLogoScan";

/**
 * Brands for the "Shop by Tyre Brands" section (components/BrandStrip.tsx).
 *
 * Names and filter values come from the catalogue's own `mgs_brand`
 * aggregation, so they can never drift from what the listing page filters on.
 *
 * Logos are resolved server-side from public/brands/mgs_brand — the local
 * mirror of the Magento media tree — because Magento exposes no brand
 * artwork over GraphQL: `brand_logo_url` is not a field on ProductInterface
 * and there is no brands root query. findBrandLogo() derives brand → file
 * from the media tree itself; there is no mapping table anywhere.
 *
 * A brand with no confident logo match is omitted. Nothing is substituted,
 * and no placeholder is invented.
 *
 * This endpoint is separate from /api/filters on purpose — the filter panel
 * owns that route and must keep its exact response shape.
 */

export type BrandListItem = {
  name: string;
  /** Exact `mgs_brand` value to filter the listing by. */
  filterValue: string;
  /** Public path under /brands/mgs_brand. */
  logo: string;
  /** Products carrying this brand. */
  count: number;
};

export async function GET() {
  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method: "POST",
      headers: magentoHeaders(),
      body: JSON.stringify({ query: FILTERS_QUERY, variables: { search: "" } }),
      next: { revalidate: APP_CONFIG.cache.filters },
    });

    const raw = (await res.json().catch(() => null)) as GqlProductsResponse | null;

    if (!res.ok || raw?.errors?.length) {
      return NextResponse.json(
        { brands: [], error: raw?.errors?.[0]?.message ?? `HTTP ${res.status}` },
        { status: res.ok ? 200 : res.status },
      );
    }

    const brandAggregation = parseAggregations(raw).find((a) => a.code === "mgs_brand");

    let brands: BrandListItem[] = (brandAggregation?.options ?? [])
      .map((option) => {
        const name = option.label?.trim();
        const filterValue = option.label?.trim() || option.value;
        if (!name || !filterValue) return null;

        const match = findBrandLogo(name);
        if (!match) return null;

        return { name, filterValue, logo: match.logo, count: option.count ?? 0 };
      })
      .filter((b): b is BrandListItem => b !== null);

    // If GraphQL returned no brand logos, read directly from public media folder
    if (brands.length === 0) {
      brands = listDiscoveredBrandLogos();
    }

    return NextResponse.json(
      { brands },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } },
    );
  } catch (err) {
    const fallbackBrands = listDiscoveredBrandLogos();
    return NextResponse.json(
      { brands: fallbackBrands },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } },
    );
  }
}
