import { NextRequest, NextResponse } from "next/server";
import { magentoHeaders } from "@/src/config/app-config";
import { VEHICLE_LOGO_BASE, isValidVehicleLogoSlug } from "@/lib/vehicleLogo";

/**
 * Streams a vehicle-make logo from the staging Magento theme's static
 * folder. The upstream origin sits behind HTTP Basic Auth, so a browser
 * <img> can't load it directly (401 → hidden by onError). This route
 * fetches it server-side with the same Basic Auth header the rest of the
 * app already uses, and re-serves the bytes same-origin, cached.
 *
 * GET /api/vehicle-logo/[slug].png   e.g. /api/vehicle-logo/bmw.png
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug: raw } = await params;
  const slug = raw.replace(/\.png$/i, "");

  if (!isValidVehicleLogoSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  try {
    const res = await fetch(`${VEHICLE_LOGO_BASE}/${slug}.png`, {
      headers: magentoHeaders() as Record<string, string>,
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream HTTP ${res.status}` }, { status: 404 });
    }

    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/png",
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
