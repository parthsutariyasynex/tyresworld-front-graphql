import { NextRequest, NextResponse } from "next/server";
import { getCategoryFilterGroups } from "@/lib/services/category.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryUid = searchParams.get("categoryUid") ?? "";
  const store       = searchParams.get("store") ?? "default";

  if (!categoryUid) {
    return NextResponse.json({ filters: [] }, { status: 400 });
  }

  try {
    const filters = await getCategoryFilterGroups(categoryUid, store);
    return NextResponse.json(
      { filters },
      { headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=120" } }
    );
  } catch (err) {
    return NextResponse.json(
      { filters: [], error: err instanceof Error ? err.message : "Network error" },
      { status: 502 }
    );
  }
}
