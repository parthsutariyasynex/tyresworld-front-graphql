import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

/* GET /api/store-locator?locale=en|ar
 *
 * Serves branch, mobile-van and time-slot data from the static JSON file at
 * public/data/store-locator.json.
 *
 * Magento does NOT expose a store-locator API (pickupLocations,
 * inventorySources, mpStoreLocator — all return "Cannot query field" errors).
 * Until a backend API is available this file is the authoritative source.
 * See: BACKEND_DEPENDENCY.md — Store Locator section.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") === "ar" ? "ar" : "en";

  try {
    const jsonPath = path.join(process.cwd(), "public", "data", "store-locator.json");
    const fileContent = await fs.readFile(jsonPath, "utf-8");
    const config = JSON.parse(fileContent);
    const localeConfig = config[locale] ?? config["en"];

    return NextResponse.json(
      {
        branches:  localeConfig.branches  ?? [],
        mobileVans: localeConfig.mobileVans ?? [],
        timeSlots: localeConfig.timeSlots  ?? [],
      },
      { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=600" } }
    );
  } catch (err) {
    console.error("Failed to read store locator JSON:", err);
    return NextResponse.json(
      { branches: [], mobileVans: [], timeSlots: [], error: "Store locator data unavailable" },
      { status: 500 }
    );
  }
}
