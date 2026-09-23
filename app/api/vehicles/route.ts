/**
 * /api/vehicles — Magento-driven vehicle lookup & Wheel API cascade.
 *
 *   GET /api/vehicles                          → { makes: [{ label, value }] }
 *   GET /api/vehicles?make=BMW or ?make=3579   → { models: [{ label, value }] }
 *   GET /api/vehicles?make=BMW&model=X5        → { years: [{ label, value }] }
 */
import { NextRequest, NextResponse } from "next/server";
import { getModels, getYears } from "@/lib/wheel-service";

const SLUG_OVERRIDES: Record<string, string> = {
  "mercedes-benz": "mercedes",
};

function makeToSlug(label: string): string {
  const auto = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return SLUG_OVERRIDES[auto] ?? auto;
}

const base = (req: NextRequest) => new URL(req.url).origin;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const makeParam = searchParams.get("make") || searchParams.get("vehicle") || searchParams.get("vehicleLabel");
  const modelParam = searchParams.get("model");
  const origin = base(req);

  try {
    // 1. Return all vehicle makes
    if (!makeParam) {
      const res = await fetch(`${origin}/api/tyre-finder`, { cache: "no-store" });
      const data = await res.json();
      const vehicles = data.attributes?.find(
        (a: { attribute_code: string }) => a.attribute_code === "vehicle"
      );
      return NextResponse.json({ makes: vehicles?.attribute_options ?? [] });
    }

    // Resolve make slug: if makeParam is numeric (Magento ID), look up label
    let makeLabel = makeParam;
    if (/^\d+$/.test(makeParam)) {
      try {
        const res = await fetch(`${origin}/api/tyre-finder`, { cache: "no-store" });
        const data = await res.json();
        const vehicles = data.attributes?.find(
          (a: { attribute_code: string }) => a.attribute_code === "vehicle"
        );
        const match = vehicles?.attribute_options?.find(
          (o: { value: string; label: string }) => o.value === makeParam
        );
        if (match?.label) {
          makeLabel = match.label;
        }
      } catch {}
    }

    const makeSlug = makeToSlug(makeLabel);
    if (!makeSlug) {
      return NextResponse.json({ models: [], years: [] });
    }

    // 2. Return models for make
    if (!modelParam) {
      const { data: models, error } = await getModels({ make: makeSlug });
      if (error || !models) {
        return NextResponse.json({ models: [] });
      }
      return NextResponse.json({
        models: models.map((m) => ({ label: m.name, value: m.slug })),
      });
    }

    // 3. Return years for make + model
    // Model param might be label or slug; Wheel API expects slug
    let modelSlug = makeToSlug(modelParam);
    const { data: modelsList } = await getModels({ make: makeSlug });
    if (modelsList) {
      const matchedModel = modelsList.find(
        (m) =>
          m.slug === modelParam ||
          m.name.toLowerCase() === modelParam.toLowerCase() ||
          makeToSlug(m.name) === modelSlug
      );
      if (matchedModel) {
        modelSlug = matchedModel.slug;
      }
    }

    const { data: years, error } = await getYears(makeSlug, modelSlug);
    if (error || !years) {
      return NextResponse.json({ years: [] });
    }

    return NextResponse.json({
      years: years.map((y) => ({
        label: String(y.year),
        value: String(y.year),
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Network error", models: [], years: [] },
      { status: 502 }
    );
  }
}

