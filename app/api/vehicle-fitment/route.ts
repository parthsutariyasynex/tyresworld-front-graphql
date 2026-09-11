import { NextRequest, NextResponse } from "next/server";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";
import { vehicleLogoProxyUrl } from "@/lib/vehicleLogo";

/**
 * Vehicle fitment for a tyre size — the data behind the theme's
 * "buy-tyre-search" modal (which cars a given size fits, grouped make →
 * model → year).
 *
 * Not exposed over GraphQL, so it can't come through the normal client. The
 * theme's JS POSTs to a Magento controller that returns JSON; this route
 * proxies it server-side (adding the staging Basic-auth header the browser
 * can't) and reshapes the payload for the modal. Nothing hardcoded — the
 * list is whatever Magento returns for the size.
 *
 * Contract taken verbatim from the live theme JS (fetchTyreData):
 *   POST {origin}/{store}/partsfinder/vehicle/buyTyreSearch
 *   body: form_key, width, height, rim, uenc(base64 of page url)
 *   → { status: "success", vehicles: [{ slug, name, logo_url,
 *        models: [{ slug, name, year_range, url }] }] }
 */
const FITMENT_PATH = "partsfinder/vehicle/buyTyreSearch";

const MAGENTO_ORIGIN = APP_CONFIG.magento.graphqlUrl.replace(/\/graphql\/?$/, "");

/* The controller returns logo_url empty; build it from the make slug. The
   theme's static logo folder sits behind staging Basic Auth, so we can't
   point the modal's <img> straight at it — route it through
   /api/vehicle-logo, which fetches server-side (with the Basic Auth header)
   and streams the bytes back same-origin. See lib/vehicleLogo.ts. */

type UpstreamModel = { slug?: string; name?: string; year_range?: string; url?: string };
type UpstreamMake = { slug?: string; name?: string; logo_url?: string; models?: UpstreamModel[] };

type Model = { name: string; years: string; href: string };
type MakeGroup = { make: string; logo: string; models: Model[] };

function reshape(vehicles: UpstreamMake[]): MakeGroup[] {
  return vehicles
    .map((v): MakeGroup | null => {
      const make = v.name?.trim();
      if (!make) return null;
      const logo = v.slug ? vehicleLogoProxyUrl(v.slug) : (v.logo_url?.trim() || "");
      const models = (v.models ?? [])
        .map((m): Model | null => {
          const name = m.name?.trim();
          if (!name || !m.url) return null;
          return { name, years: (m.year_range ?? "").trim(), href: m.url };
        })
        .filter((m): m is Model => m !== null);
      return { make, logo, models };
    })
    .filter((g): g is MakeGroup => g !== null && g.models.length > 0);
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

  const url = `${MAGENTO_ORIGIN}/${store}/${FITMENT_PATH}`;
  const body = new URLSearchParams({
    form_key: "",
    width,
    height,
    rim,
    // The controller reads uenc but doesn't validate it; the page URL is fine.
    uenc: Buffer.from(`${MAGENTO_ORIGIN}/${store}/tyres`).toString("base64"),
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...(magentoHeaders(store) as Record<string, string>),
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
      },
      body: body.toString(),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream HTTP ${res.status}`, groups: [] }, { status: res.status });
    }

    const data = (await res.json().catch(() => null)) as
      | { status?: string; vehicles?: UpstreamMake[] }
      | null;

    if (!data || data.status !== "success") {
      return NextResponse.json({ groups: [] });
    }

    return NextResponse.json(
      { groups: reshape(data.vehicles ?? []) },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Network error", groups: [] },
      { status: 502 },
    );
  }
}
