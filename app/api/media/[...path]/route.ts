import { NextRequest, NextResponse } from "next/server";
import { magentoHeaders } from "@/src/config/app-config";
import { MAGENTO_ORIGIN } from "@/lib/vehicleLogo";

/**
 * Generic proxy for Magento's /media/ assets referenced inside CMS page
 * content (app/[locale]/[...slug]/page.tsx).
 *
 * CMS content authored in Magento links to its own media with root-relative
 * paths ("/media/images/testimonials/author.png"), which only resolve
 * against a Magento host. Resolved against our own origin they'd 404
 * outright, so the CMS branch used to rewrite them to the public storefront
 * domain (www.tyresworld.ae) instead of the staging GraphQL host — the
 * staging host sits behind HTTP Basic Auth even for media, which a plain
 * <img> can't supply.
 *
 * That works for most assets, but not all of them are actually synced to
 * the public domain — e.g. /media/images/testimonials/author.png is a real,
 * live file on the staging origin (verified: 200 with Basic Auth) but 404s
 * on the public one. Rather than depend on the public mirror being complete,
 * this route fetches straight from the staging origin server-side (with the
 * Basic Auth header the browser can't send) and streams the bytes back
 * same-origin — the same pattern already used for vehicle-make logos
 * (see /api/vehicle-logo and lib/vehicleLogo.ts).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;

  if (!path?.length || path.some((seg) => !seg || seg === "." || seg === "..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const mediaPath = path.map(encodeURIComponent).join("/");

  try {
    const res = await fetch(`${MAGENTO_ORIGIN}/media/${mediaPath}`, {
      headers: magentoHeaders() as Record<string, string>,
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream HTTP ${res.status}` }, { status: 404 });
    }

    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/octet-stream",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Network error" },
      { status: 502 },
    );
  }
}
