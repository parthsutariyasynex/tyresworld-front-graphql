import { NextRequest, NextResponse } from "next/server";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";
import { vehicleLogoProxyUrl } from "@/lib/vehicleLogo";
import { KLEVER_VEHICLES_BY_TYRE_SIZE_QUERY } from "@/lib/queries";
import { searchByTyreSize } from "@/lib/wheel-service";
import type { WheelFitmentMatch } from "@/lib/wheel-types";

/**
 * Vehicle fitment for a tyre size — the data behind the car icon fitment modal
 * (which cars a given tyre size fits, grouped make → model → year).
 * Fetches from Wheel API (wheel-api.klever.ae) with fallback to Magento GraphQL.
 */
export type Model = { name: string; years: string; href: string };
export type MakeGroup = { make: string; logo: string; models: Model[] };

type GqlVehicleMatch = {
  slug?: string;
  name?: string;
  name_en?: string;
  make_slug?: string;
  make_name?: string;
  year_ranges?: string[];
};

function reshapeWheelApi(items: WheelFitmentMatch[], store: string): MakeGroup[] {
  const byMake = new Map<string, { make: string; logo: string; models: Model[] }>();

  for (const item of items) {
    const makeName = item.makeName?.trim();
    const makeSlug = (item.makeSlug || item.makeName || "").trim().toLowerCase().replace(/\s+/g, "-");
    if (!makeName || !makeSlug) continue;

    const modelName = item.modelName?.trim();
    const modelSlug = (item.modelSlug || item.modelName || "").trim().toLowerCase().replace(/\s+/g, "-");
    if (!modelName || !modelSlug) continue;

    const years = (item.yearRanges ?? []).join(", ");
    const href = `/${store}/tyres/cars/${encodeURIComponent(makeSlug)}?model=${encodeURIComponent(modelSlug)}`;

    let group = byMake.get(makeSlug);
    if (!group) {
      group = {
        make: makeName,
        logo: vehicleLogoProxyUrl(makeSlug),
        models: [],
      };
      byMake.set(makeSlug, group);
    }

    if (!group.models.some((m) => m.name.toLowerCase() === modelName.toLowerCase())) {
      group.models.push({ name: modelName, years, href });
    }
  }

  return Array.from(byMake.values());
}

function reshapeGql(items: GqlVehicleMatch[], store: string): MakeGroup[] {
  const byMake = new Map<string, { make: string; logo: string; models: Model[] }>();

  for (const item of items) {
    const makeName = item.make_name?.trim();
    const makeSlug = item.make_slug?.trim();
    if (!makeName || !makeSlug) continue;

    const modelName = (store === "ar" && item.name ? item.name : item.name_en || item.name || "").trim();
    const modelSlug = item.slug?.trim();
    if (!modelName || !modelSlug) continue;

    const years = (item.year_ranges ?? []).join(", ");
    const href = `/${store}/tyres/cars/${encodeURIComponent(makeSlug)}?model=${encodeURIComponent(modelSlug)}`;

    let group = byMake.get(makeSlug);
    if (!group) {
      group = {
        make: makeName,
        logo: vehicleLogoProxyUrl(makeSlug),
        models: [],
      };
      byMake.set(makeSlug, group);
    }

    if (!group.models.some((m) => m.name.toLowerCase() === modelName.toLowerCase())) {
      group.models.push({ name: modelName, years, href });
    }
  }

  return Array.from(byMake.values());
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const width = searchParams.get("width") ?? "";
  const height = searchParams.get("height") ?? "";
  const rim = searchParams.get("rim") ?? "";
  const store = searchParams.get("store") === "ar" ? "ar" : "en";

  if (!width || !height || !rim) {
    return NextResponse.json({ error: "width, height and rim are required" }, { status: 400 });
  }

  const w = parseInt(width, 10);
  const h = parseInt(height, 10);
  const r = parseInt(rim, 10);

  if (isNaN(w) || isNaN(h) || isNaN(r)) {
    return NextResponse.json({ error: "Invalid dimensions", groups: [] }, { status: 400 });
  }

  try {
    // 1. Primary: Fetch from Wheel API (wheel-api.klever.ae)
    const wheelRes = await searchByTyreSize(w, h, r);
    if (wheelRes.data && wheelRes.data.length > 0) {
      const groups = reshapeWheelApi(wheelRes.data, store);
      return NextResponse.json(
        { groups },
        { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" } },
      );
    }

    // 2. Fallback: Query Magento GraphQL if Wheel API returned 0 results or had an issue
    try {
      const gqlRes = await fetch(APP_CONFIG.magento.graphqlUrl, {
        method: "POST",
        headers: magentoHeaders(store),
        body: JSON.stringify({
          query: KLEVER_VEHICLES_BY_TYRE_SIZE_QUERY,
          variables: { width: w, height: h, rim: r },
        }),
        next: { revalidate: 3600 },
      });

      if (gqlRes.ok) {
        const gqlData = await gqlRes.json();
        const items: GqlVehicleMatch[] = gqlData?.data?.kleverVehiclesByTyreSize ?? [];
        if (items.length > 0) {
          return NextResponse.json(
            { groups: reshapeGql(items, store) },
            { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" } },
          );
        }
      }
    } catch {
      // Ignore fallback error
    }

    return NextResponse.json(
      { groups: [] },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fitment error", groups: [] },
      { status: 500 },
    );
  }
}
