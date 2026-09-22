import { NextRequest, NextResponse } from "next/server";
import { getMainMenu } from "@/lib/services/menu.service";
import { storeCode } from "@/lib/i18n";

/** Real live main menu (Klever kleverMainMenu) as JSON — the header itself
    gets this server-side via app/layout.tsx; this route exists for any
    client-side caller that needs the same data (e.g. a future locale
    switcher) without duplicating the fetch/adapt logic. */
export async function GET(_req: NextRequest) {
  const menu = await getMainMenu(storeCode("en"));

  return NextResponse.json(
    { menu: menu ?? [], ...(menu ? {} : { error: "kleverMainMenu unavailable" }) },
    menu ? { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } } : undefined,
  );
}
