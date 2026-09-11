import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";
import { PICKUP_LOCATIONS_QUERY } from "@/lib/queries";

/* GET /api/store-locator?locale=en|ar
 *
 * Branches come ONLY from Magento's `pickupLocations` GraphQL query — the
 * standard MSI "in-store pickup" API (Stores > Inventory > Sources, with
 * "Enable Store Pickup" turned on). `cities` is derived from whichever
 * branches actually come back — never a fixed list. There is no static or
 * mock fallback for either: if Magento returns zero pickup locations (as it
 * does right now — none are configured yet), branches/cities come back
 * empty and the page shows its existing empty state. That's correct
 * behaviour for live data, not a bug to work around with placeholder rows.
 *
 * Delivery-option copy, mobile-van service areas/fees, and time slots have
 * no Magento entity behind them at all — there's no backend concept of
 * "mobile van" or "free shipping" service areas — so that part of the
 * response still comes from the local JSON config file. That's UI/business
 * copy, not data with a live source to begin with.
 */

type GqlPickupLocation = {
  pickup_location_code?: string | null;
  name?: string | null;
  city?: string | null;
  street?: string | null;
  region?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  phone?: string;
  whatsapp?: string;
};

async function fetchBranches(locale: string): Promise<{ branches: Branch[]; cities: string[] }> {
  const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
    method: "POST",
    headers: magentoHeaders(locale) as Record<string, string>,
    body: JSON.stringify({ query: PICKUP_LOCATIONS_QUERY, variables: { pageSize: 200 } }),
    next: { revalidate: 300 },
  });

  const json = await res.json().catch(() => null);
  if (json?.errors?.length) {
    throw new Error(json.errors[0]?.message ?? "pickupLocations query failed");
  }

  const items: GqlPickupLocation[] = json?.data?.pickupLocations?.items ?? [];

  const branches: Branch[] = items
    .filter((i): i is GqlPickupLocation & { latitude: number; longitude: number; name: string } =>
      i.latitude != null && i.longitude != null && !!i.name,
    )
    .map((i) => ({
      id: i.pickup_location_code || `${i.name}-${i.latitude}-${i.longitude}`,
      name: i.name,
      address: [i.street, i.city, i.region].filter(Boolean).join(", "),
      city: i.city ?? "",
      lat: i.latitude,
      lng: i.longitude,
      phone: i.phone ?? undefined,
      whatsapp: i.phone ? i.phone.replace(/[^0-9]/g, "") : undefined,
    }));

  const cities = Array.from(new Set(branches.map((b) => b.city).filter(Boolean)));

  return { branches, cities };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") === "ar" ? "ar" : "en";
  const allLabel = locale === "ar" ? "الكل" : "All";

  // Delivery-option copy, mobile-van areas, and time slots aren't Magento
  // entities — those still come from the local config file (see comment above).
  let deliveryOptions: unknown[] = [];
  let mobileVans: unknown[] = [];
  let timeSlots: unknown[] = [];
  try {
    const jsonPath = path.join(process.cwd(), "public", "data", "store-locator.json");
    const fileContent = await fs.readFile(jsonPath, "utf-8");
    const parsed = JSON.parse(fileContent);
    const localeConfig = parsed[locale] ?? parsed.en;
    deliveryOptions = localeConfig.deliveryOptions ?? [];
    mobileVans = localeConfig.mobileVans ?? [];
    timeSlots = localeConfig.timeSlots ?? [];
  } catch (err) {
    console.error("Failed to read store locator config JSON:", err);
  }

  try {
    // Branches/cities: Magento only. No static/mock fallback — an empty
    // result here is passed straight through as empty.
    const { branches, cities } = await fetchBranches(locale);

    return NextResponse.json(
      {
        cities: [allLabel, ...cities],
        deliveryOptions,
        branches,
        mobileVans,
        timeSlots,
      },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=300" } },
    );
  } catch (err) {
    console.error("Failed to fetch pickup locations from Magento:", err);
    // Magento call itself failed (network/schema error) — still return an
    // empty branch list rather than inventing one.
    return NextResponse.json(
      {
        cities: [allLabel],
        deliveryOptions,
        branches: [],
        mobileVans,
        timeSlots,
        error: "Store locations unavailable",
      },
      { status: 200 },
    );
  }
}
