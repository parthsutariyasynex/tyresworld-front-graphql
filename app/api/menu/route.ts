import { NextRequest, NextResponse } from "next/server";
import { getMenu } from "@/lib/services/menu.service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") ?? "en";

  const r = await getMenu(locale);

  if (!r.ok) {
    return NextResponse.json({ menu: [], error: r.error }, { status: r.status });
  }

  return NextResponse.json(
    { menu: r.menu, ...(r.error ? { error: r.error } : {}) },
    r.menu.length
      ? { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } }
      : undefined,
  );
}
