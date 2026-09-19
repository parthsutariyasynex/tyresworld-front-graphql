/**
 * /api/tyre-finder/vehicle — vehicle cascade for the Tyre Finder's
 * "Search By Vehicle" tab, backed by Magento's Klever_NextJs GraphQL module.
 *
 * Steps:
 *   ?step=makes
 *   ?step=models&make=bmw
 *   ?step=years&make=bmw&model=3-series
 *   ?step=trims&make=bmw&model=3-series&year=2022
 *   ?step=sizes&make=bmw&model=3-series&year=2022&modification=cafc866f97
 *
 * Responses: { options: [...] } for the first four, { sizes: [...] } for the last.
 */
import { NextRequest, NextResponse } from "next/server";
import { magentoFetch } from "@/lib/graphql/client";
import {
  KLEVER_VEHICLE_MAKES_QUERY,
  KLEVER_VEHICLE_MODELS_QUERY,
  KLEVER_VEHICLE_YEARS_QUERY,
  KLEVER_VEHICLE_MODIFICATIONS_QUERY,
  KLEVER_VEHICLE_FITMENT_QUERY,
} from "@/lib/queries";

const LOGO_BASE = "https://wheel-api.klever.ae/logos";

type Option = {
  label: string;
  value: string;
  logo?: string;
  fuel?: string | null;
  hp?: number | null;
};

type TyreSize = {
  width: string;
  height: string;
  rim: string;
  rear: { width: string; height: string; rim: string } | null;
  isFactory: boolean;
  speedIndex: string | null;
  rearSpeedIndex: string | null;
  label: string;
  rearLabel: string | null;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const step = searchParams.get("step") ?? "makes";
  const store = searchParams.get("store") === "ar" ? "ar" : "en";
  const make = searchParams.get("make")?.trim() ?? "";
  const model = searchParams.get("model")?.trim() ?? "";
  const yearStr = searchParams.get("year")?.trim() ?? "";
  const year = parseInt(yearStr, 10);
  const modification = searchParams.get("modification")?.trim() ?? "";

  const fail = (error: string, status = 200) =>
    NextResponse.json(step === "sizes" ? { sizes: [], error } : { options: [], error }, { status });

  const ok = (payload: { options: Option[] } | { sizes: TyreSize[] }) =>
    NextResponse.json(payload, {
      headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600" },
    });

  // 1. MAKES
  if (step === "makes") {
    const res = await magentoFetch<{
      kleverVehicleMakes?: { slug: string; name: string; name_en?: string; logo?: string }[];
    }>(KLEVER_VEHICLE_MAKES_QUERY, {}, { store, revalidate: 86400 });

    if (!res.ok || !res.data?.kleverVehicleMakes?.length) {
      return fail(res.errors?.[0]?.message || "Makes unavailable");
    }

    const options: Option[] = res.data.kleverVehicleMakes
      .filter((m) => m.slug && (m.name || m.name_en))
      .map((m) => {
        const label = (store === "ar" && m.name ? m.name : m.name || m.name_en || m.slug).trim();
        return {
          label,
          value: m.slug.trim(),
          logo: m.logo || `${LOGO_BASE}/${m.slug.trim()}.png`,
        };
      });

    return ok({ options });
  }

  // 2. MODELS
  if (step === "models") {
    if (!make) return fail("make is required", 400);

    const res = await magentoFetch<{
      kleverVehicleModels?: { slug: string; name: string; name_en?: string }[];
    }>(KLEVER_VEHICLE_MODELS_QUERY, { make }, { store, revalidate: 86400 });

    if (!res.ok || !res.data?.kleverVehicleModels?.length) {
      return fail(res.errors?.[0]?.message || "Models unavailable");
    }

    const options: Option[] = res.data.kleverVehicleModels
      .filter((m) => m.slug && (m.name || m.name_en))
      .map((m) => ({
        label: (store === "ar" && m.name ? m.name : m.name || m.name_en || m.slug).trim(),
        value: m.slug.trim(),
      }));

    return ok({ options });
  }

  // 3. YEARS
  if (step === "years") {
    if (!make || !model) return fail("make and model are required", 400);

    const res = await magentoFetch<{
      kleverVehicleYears?: { slug: string; name: string }[];
    }>(KLEVER_VEHICLE_YEARS_QUERY, { make, model }, { store, revalidate: 86400 });

    if (res.ok && res.data?.kleverVehicleYears?.length) {
      const options: Option[] = res.data.kleverVehicleYears
        .filter((y) => y.slug && y.name)
        .map((y) => ({
          label: y.name.trim(),
          value: y.slug.trim(),
        }));

      return ok({ options });
    }

    // Fallback: Wheel API years
    try {
      const { getYears } = await import("@/lib/wheel-service");
      const wheelYears = await getYears(make, model);
      if (wheelYears.data?.length) {
        const options: Option[] = wheelYears.data.map((y) => ({
          label: String(y.year),
          value: String(y.year),
        }));
        return ok({ options });
      }
    } catch {}

    return fail(res.errors?.[0]?.message || "Years unavailable");
  }

  // 4. TRIMS / MODIFICATIONS
  if (step === "trims") {
    if (!make || !model || !year || isNaN(year)) {
      return fail("make, model and valid year are required", 400);
    }

    const res = await magentoFetch<{
      kleverVehicleModifications?: {
        slug: string;
        name: string;
        trim?: string;
        fuel?: string;
        power_hp?: number;
      }[];
    }>(KLEVER_VEHICLE_MODIFICATIONS_QUERY, { make, model, year }, { store, revalidate: 86400 });

    if (res.ok && res.data?.kleverVehicleModifications?.length) {
      const options: Option[] = res.data.kleverVehicleModifications
        .filter((m) => m.slug && (m.name || m.trim))
        .map((m) => ({
          label: (m.name || m.trim || m.slug).trim(),
          value: m.slug.trim(),
          fuel: m.fuel?.trim() || null,
          hp: m.power_hp ?? null,
        }));

      return ok({ options });
    }

    // Fallback: Wheel API modifications
    try {
      const { getModifications } = await import("@/lib/wheel-service");
      const wheelMods = await getModifications(make, model, year);
      if (wheelMods.data?.length) {
        const options: Option[] = wheelMods.data.map((m) => ({
          label: (m.name || m.trim || m.slug).trim(),
          value: m.slug.trim(),
          fuel: m.fuel || null,
          hp: m.hp || null,
        }));
        return ok({ options });
      }
    } catch {}

    return fail(res.errors?.[0]?.message || "Trims unavailable");
  }

  // 5. SIZES / FITMENT
  if (step === "sizes") {
    if (!make || !model || !year || isNaN(year) || !modification) {
      return fail("make, model, year and modification are required", 400);
    }

    const res = await magentoFetch<{
      kleverVehicleFitment?: {
        wheels?: {
          is_stock?: boolean;
          front?: {
            tire?: string;
            tire_width?: number;
            tire_aspect_ratio?: number;
            rim_diameter?: number;
            speed_index?: string;
          };
          rear?: {
            tire?: string;
            tire_width?: number;
            tire_aspect_ratio?: number;
            rim_diameter?: number;
            speed_index?: string;
          };
        }[];
      }[];
    }>(
      KLEVER_VEHICLE_FITMENT_QUERY,
      { make, model, year, modification },
      { store, revalidate: 86400 }
    );

    if (!res.ok || !res.data?.kleverVehicleFitment?.length) {
      return fail(res.errors?.[0]?.message || "Fitment sizes unavailable");
    }

    const allWheels = res.data.kleverVehicleFitment.flatMap((f) => f.wheels ?? []);
    const seen = new Set<string>();
    const sizes: TyreSize[] = [];

    for (const w of allWheels) {
      if (!w.front?.tire_width || !w.front?.tire_aspect_ratio || !w.front?.rim_diameter) {
        continue;
      }

      const width = String(w.front.tire_width);
      const height = String(w.front.tire_aspect_ratio);
      const rim = String(w.front.rim_diameter);
      const hasRear = Boolean(
        w.rear?.tire_width && w.rear?.tire_aspect_ratio && w.rear?.rim_diameter
      );

      const rear = hasRear && w.rear
        ? {
            width: String(w.rear.tire_width),
            height: String(w.rear.tire_aspect_ratio),
            rim: String(w.rear.rim_diameter),
          }
        : null;

      const label = `${width}/${height}R${rim}`;
      const rearLabel = rear ? `${rear.width}/${rear.height}R${rear.rim}` : null;
      const key = `${label}|${rearLabel ?? ""}`;

      if (seen.has(key)) continue;
      seen.add(key);

      sizes.push({
        width,
        height,
        rim,
        rear,
        isFactory: Boolean(w.is_stock),
        speedIndex: w.front.speed_index?.trim() || null,
        rearSpeedIndex: w.rear?.speed_index?.trim() || null,
        label,
        rearLabel,
      });
    }

    // Factory fitment first, then by rim diameter
    sizes.sort((a, b) => {
      if (a.isFactory !== b.isFactory) return a.isFactory ? -1 : 1;
      return (parseFloat(a.rim) || 0) - (parseFloat(b.rim) || 0);
    });

    return ok({ sizes });
  }

  return fail(`Unknown step "${step}"`, 400);
}
