import { NextRequest, NextResponse } from "next/server";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";
import { vehicleLogoProxyUrl } from "@/lib/vehicleLogo";

/**
 * Vehicle fitment for a tyre size — the data behind the car fitment modal
 * (which cars a given tyre size fits, grouped make → model → year).
 * Fetches directly from Magento partsfinder/vehicle/buyTyreSearch.
 */
const FITMENT_PATH = "partsfinder/vehicle/buyTyreSearch";
const MAGENTO_ORIGIN = "https://www1.tyresworld.ae";

type UpstreamModel = { slug?: string; name?: string; year_range?: string; url?: string };
type UpstreamMake = { slug?: string; name?: string; logo_url?: string; models?: UpstreamModel[] };

export type Model = { name: string; years: string; href: string };
export type MakeGroup = { make: string; logo: string; models: Model[] };

function reshapeMagento(vehicles: UpstreamMake[], store: string): MakeGroup[] {
  return vehicles
    .map((v): MakeGroup | null => {
      const make = v.name?.trim();
      const makeSlug = (v.slug || v.name || "").trim().toLowerCase().replace(/\s+/g, "-");
      if (!make || !makeSlug) return null;

      const logo = vehicleLogoProxyUrl(makeSlug);
      const models = (v.models ?? [])
        .map((m): Model | null => {
          const name = m.name?.trim();
          const modelSlug = (m.slug || m.name || "").trim().toLowerCase().replace(/\s+/g, "-");
          if (!name || !modelSlug) return null;

          // 👉 Internal website URL using make and model slugs
          const href = `/${store}/tyres/cars/${encodeURIComponent(makeSlug)}?model=${encodeURIComponent(modelSlug)}`;
          return { name, years: (m.year_range ?? "").trim(), href };
        })
        .filter((m): m is Model => m !== null);

      return { make, logo, models };
    })
    .filter((g): g is MakeGroup => g !== null && g.models.length > 0);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawWidth = searchParams.get("width") ?? "";
  const rawHeight = searchParams.get("height") ?? "";
  const rawRim = searchParams.get("rim") ?? "";
  const store = searchParams.get("store") === "ar" ? "ar" : "en";

  const width = rawWidth.replace(/\D/g, "");
  const height = rawHeight.replace(/\D/g, "");
  const rim = rawRim.replace(/\D/g, "");

  if (!width || !height || !rim) {
    return NextResponse.json({ error: "width, height and rim are required", groups: [] }, { status: 400 });
  }

  // Fetch directly from Magento buyTyreSearch API
  try {
    const url = `${MAGENTO_ORIGIN}/${FITMENT_PATH}`;
    const body = new URLSearchParams({
      form_key: "",
      width,
      height,
      rim,
      uenc: Buffer.from(`${MAGENTO_ORIGIN}/tyres`).toString("base64"),
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...(magentoHeaders(store) as Record<string, string>),
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
        Origin: MAGENTO_ORIGIN,
        Referer: `${MAGENTO_ORIGIN}/tyres`,
      },
      body: body.toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = (await res.json().catch(() => null)) as
          | { status?: string; vehicles?: UpstreamMake[] }
          | null;

        if (data && data.status === "success" && data.vehicles && data.vehicles.length > 0) {
          const groups = reshapeMagento(data.vehicles, store);
          if (groups.length > 0) {
            return NextResponse.json(
              { groups },
              { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } },
            );
          }
        }
      }
    }

    // Never cache empty results so CDN does not get stuck
    return NextResponse.json(
      { groups: [] },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
    );
  } catch (err) {
    console.error("Magento fitment error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fitment error", groups: [] },
      {
        status: 500,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      },
    );
  }
}





