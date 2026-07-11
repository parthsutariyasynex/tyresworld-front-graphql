/**
 * /api/vehicles — Magento-driven vehicle lookup.
 *
 * Previously used a hardcoded JSON database. Now proxies to
 * /api/tyre-finder (metadata) and /api/tyre-finder/options (dependent).
 *
 * Keeps the same response shape so existing callers need no changes:
 *   GET /api/vehicles               → { makes: [{ label, value }] }
 *   GET /api/vehicles?make=123      → { models: [{ label, value }] }
 *   GET /api/vehicles?make=123&model=456  → { years: [{ label, value }] }
 */
import { NextRequest, NextResponse } from "next/server";

const base = (req: NextRequest) =>
  new URL(req.url).origin;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const make  = searchParams.get("make");
  const model = searchParams.get("model");
  const origin = base(req);

  try {
    if (!make) {
      // Return all vehicle makes from customAttributeMetadata
      const res  = await fetch(`${origin}/api/tyre-finder`, { cache: "no-store" });
      const data = await res.json();
      const vehicles = data.attributes?.find(
        (a: { attribute_code: string }) => a.attribute_code === "vehicle"
      );
      return NextResponse.json({ makes: vehicles?.attribute_options ?? [] });
    }

    if (!model) {
      // Return models available for the given vehicle (make) via filtered aggregations
      const res  = await fetch(
        `${origin}/api/tyre-finder/options?vehicle=${encodeURIComponent(make)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      return NextResponse.json({ models: data.aggregations?.model ?? [] });
    }

    // Return years available for vehicle + model
    const res  = await fetch(
      `${origin}/api/tyre-finder/options?vehicle=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
      { cache: "no-store" }
    );
    const data = await res.json();
    return NextResponse.json({ years: data.aggregations?.year ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Network error" },
      { status: 502 }
    );
  }
}
