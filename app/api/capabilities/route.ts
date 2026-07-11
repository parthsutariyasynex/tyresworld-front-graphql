import { NextRequest, NextResponse } from "next/server";
import { getCapabilities } from "@/lib/magento-capabilities";

export const dynamic = "force-dynamic";

/* GET /api/capabilities — live Magento feature snapshot.
 * GET /api/capabilities?refresh=1 — bypass the cache after changing Magento Admin config. */
export async function GET(req: NextRequest) {
  const refresh = new URL(req.url).searchParams.get("refresh") === "1";
  try {
    const caps = await getCapabilities(refresh);
    return NextResponse.json(
      { capabilities: caps, error: null },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } },
    );
  } catch (e) {
    return NextResponse.json(
      { capabilities: null, error: e instanceof Error ? e.message : "Capability detection failed" },
      { status: 502 },
    );
  }
}
