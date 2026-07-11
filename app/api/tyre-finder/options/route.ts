/**
 * /api/tyre-finder/options
 *
 * Dependent dropdown options for the TyreFinder component.
 *
 * SIZE cascade (width → height → rim):
 *   Uses Magento product aggregations — these are live and accurate.
 *
 * VEHICLE cascade (vehicle → model → year → engine):
 *   Magento products carry no vehicle/model/year attribute data (total_count=0
 *   for every vehicle filter). We route these through the Wheel API instead.
 *
 *   Required params for vehicle cascade:
 *     vehicleLabel=BMW          — display name → converted to Wheel slug ("bmw")
 *     vehicle=3579              — Magento attribute ID (kept for compatibility)
 *     model=3-series            — Wheel API slug (present when fetching years)
 *
 * Response shape (unchanged):
 *   { aggregations: { model?: [...], year?: [...], height?: [...], rim?: [...] } }
 */
import { NextRequest, NextResponse } from "next/server";
import { TYRE_FINDER_OPTIONS_QUERY } from "@/lib/queries";
import { buildGqlFilter } from "@/lib/filterBuilder";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";
import { getModels, getYears, getModifications } from "@/lib/wheel-service";
import type { WheelModificationOption } from "@/lib/wheel-types";

const SIZE_PARAMS    = ["width", "height", "rim"];
const ALLOWED        = ["vehicle", "model", "year", "width", "height", "rim", "mgs_brand", "category_uid"];

type AggOption = { label: string; value: string; count: number };

/** Overrides where the auto-slug doesn't match the Wheel API slug. */
const SLUG_OVERRIDES: Record<string, string> = {
  "mercedes-benz": "mercedes",
};

/** Build a human-readable engine label from a modification option. */
function buildEngineLabel(m: WheelModificationOption): string {
  const parts: string[] = [];
  if (m.name) parts.push(m.name);
  const eng: string[] = [];
  if (m.fuel)     eng.push(m.fuel);
  if (m.capacity) eng.push(m.capacity);
  if (m.hp)       eng.push(`${m.hp} hp`);
  if (eng.length) parts.push(eng.join(" "));
  return parts.join(" — ") || "Unknown Trim";
}

/** Convert a make display name to the slug the Wheel API expects. */
function makeToSlug(label: string): string {
  const auto = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return SLUG_OVERRIDES[auto] ?? auto;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const vehicleParam      = searchParams.get("vehicle");
  const vehicleLabelParam = searchParams.get("vehicleLabel");
  const modelParam        = searchParams.get("model");
  const yearParam         = searchParams.get("year");

  /* ── Vehicle cascade: route through Wheel API ──────────────────── */
  if (vehicleParam || vehicleLabelParam) {
    try {
      const makeSlug = makeToSlug(vehicleLabelParam ?? "");

      if (!makeSlug) {
        return NextResponse.json({ aggregations: {} });
      }

      type VehAggOption = { label: string; value: string; fuel?: string | null; hp?: number | null };
      const aggregations: Record<string, VehAggOption[]> = {};

      if (!modelParam) {
        // Fetch models for this make from Wheel API
        const { data: models, error } = await getModels({ make: makeSlug });
        if (error) return NextResponse.json({ aggregations: {}, error });
        aggregations.model = models.map((m) => ({ label: m.name, value: m.slug }));
      } else if (!yearParam) {
        // Fetch years for this make + model from Wheel API
        const { data: years, error } = await getYears(makeSlug, modelParam);
        if (error) return NextResponse.json({ aggregations: {}, error });
        aggregations.year = years.map((y) => ({
          label: String(y.year),
          value: String(y.year),
        }));
      } else {
        // Fetch engine/trim modifications for this make + model + year from Wheel API
        const { data: mods, error } = await getModifications(makeSlug, modelParam, parseInt(yearParam, 10));
        if (error) return NextResponse.json({ aggregations: {}, error });
        aggregations.engine = mods.map((m) => ({
          label: m.name ?? "Unknown Trim",
          value: m.slug,
          fuel:  m.fuel ?? null,
          hp:    m.hp   ?? null,
        }));
      }

      return NextResponse.json({ aggregations });
    } catch (err) {
      return NextResponse.json(
        { aggregations: {}, error: err instanceof Error ? err.message : "Wheel API error" },
        { status: 502 }
      );
    }
  }

  /* ── Size cascade: use Magento product aggregations (unchanged) ── */
  const selected: Record<string, string> = {};
  for (const key of SIZE_PARAMS) {
    const v = searchParams.get(key);
    if (v) selected[key] = v;
  }
  // Also allow category_uid scoping
  const catUid = searchParams.get("category_uid");
  if (catUid) selected.category_uid = catUid;

  const filter = buildGqlFilter(selected, ALLOWED);
  if (!filter.category_uid) {
    filter.category_uid = { eq: APP_CONFIG.magento.tyresCategoryUid };
  }

  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method:  "POST",
      headers: magentoHeaders(),
      body:    JSON.stringify({ query: TYRE_FINDER_OPTIONS_QUERY, variables: { filter } }),
      cache:   "no-store",
    });

    const raw = await res.json().catch(() => null);

    if (!res.ok || raw?.errors?.length) {
      return NextResponse.json(
        { aggregations: {}, error: raw?.errors?.[0]?.message ?? `HTTP ${res.status}` }
      );
    }

    const aggs: { attribute_code: string; options: AggOption[] }[] =
      raw?.data?.products?.aggregations ?? [];

    const aggregations: Record<string, AggOption[]> = {};
    for (const agg of aggs) {
      if (ALLOWED.includes(agg.attribute_code)) {
        aggregations[agg.attribute_code] = (agg.options ?? []).filter(
          (o) => o.label && o.value
        );
      }
    }

    return NextResponse.json({ aggregations });
  } catch (err) {
    return NextResponse.json(
      { aggregations: {}, error: err instanceof Error ? err.message : "Network error" },
      { status: 502 }
    );
  }
}
