import { NextRequest, NextResponse } from "next/server";
import { getFooterData } from "@/lib/services/footer.service";
import { storeCode } from "@/lib/i18n";

export async function GET(req: NextRequest) {
  const store = storeCode("en");

  const footer = await getFooterData(store);

  return NextResponse.json(
    { footer },
    { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" } },
  );
}
