import { NextRequest, NextResponse } from "next/server";
import { wheelGql } from "@/lib/wheel-client";

const VEHICLE_IMAGE_QUERY = /* GraphQL */ `
  query VehicleImage($make: String!, $model: String!, $year: Int!) {
    modifications(make: $make, model: $model, year: $year) {
      data {
        generation {
          bodies {
            image
          }
        }
      }
    }
  }
`;

const VEHICLE_YEARS_QUERY = /* GraphQL */ `
  query VehicleYears($make: String!, $model: String!) {
    years(make: $make, model: $model) {
      data {
        name
      }
    }
  }
`;

type ImageResult = {
  modifications?: {
    data?: {
      generation?: {
        bodies?: { image?: string }[];
      };
    }[];
  };
};

type YearsResult = {
  years?: {
    data?: { name?: number }[];
  };
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const make = searchParams.get("make")?.trim().toLowerCase() ?? "";
  const model = searchParams.get("model")?.trim().toLowerCase() ?? "";
  let year = parseInt(searchParams.get("year") ?? "", 10);

  if (!make || !model) {
    return NextResponse.json({ error: "make and model are required" }, { status: 400 });
  }

  try {
    // If year is not supplied or invalid, resolve the first/latest year for this vehicle
    if (isNaN(year) || !year) {
      const yearsRes = await wheelGql<YearsResult>(
        VEHICLE_YEARS_QUERY,
        { make, model },
        { revalidate: 86400 },
      );
      const availableYears = yearsRes.data?.years?.data ?? [];
      if (availableYears.length > 0 && availableYears[0].name) {
        year = availableYears[0].name;
      } else {
        year = new Date().getFullYear();
      }
    }

    const res = await wheelGql<ImageResult>(
      VEHICLE_IMAGE_QUERY,
      { make, model, year },
      { revalidate: 86400 },
    );

    const modifications = res.data?.modifications?.data ?? [];
    for (const m of modifications) {
      const bodies = m.generation?.bodies ?? [];
      for (const b of bodies) {
        if (b.image && b.image.trim().length > 0) {
          return NextResponse.json(
            { image: b.image },
            { headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600" } },
          );
        }
      }
    }

    return NextResponse.json(
      { image: null },
      { headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load vehicle image", image: null },
      { status: 500 },
    );
  }
}
