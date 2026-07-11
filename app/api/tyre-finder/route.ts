import { NextResponse } from "next/server";
import { TYRE_FINDER_METADATA_QUERY } from "@/lib/queries";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

type AttrOption = { label: string; value: string };
type AttrItem   = { code: string; options?: AttrOption[] | null };

const SIZE_CODES  = new Set(["width", "height", "rim", "year"]);

function sortOptions(code: string, options: AttrOption[]): AttrOption[] {
  return [...options].sort((a, b) => {
    if (SIZE_CODES.has(code)) {
      const na = parseFloat(a.label), nb = parseFloat(b.label);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
    }
    return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
  });
}

export async function GET() {
  try {
    const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
      method:  "POST",
      headers: magentoHeaders(),
      body:    JSON.stringify({ query: TYRE_FINDER_METADATA_QUERY }),
      next:    { revalidate: 3600 },
    });

    const raw = await res.json().catch(() => null);

    if (!res.ok || raw?.errors?.length) {
      return NextResponse.json(
        { attributes: [], error: raw?.errors?.[0]?.message ?? `HTTP ${res.status}` },
        { status: res.ok ? 200 : res.status }
      );
    }

    const items: AttrItem[] = raw?.data?.customAttributeMetadataV2?.items ?? [];

    const attributes = items.map((item) => ({
      attribute_code:    item.code,
      attribute_options: sortOptions(
        item.code,
        (item.options ?? []).filter((o) => o.label && o.value),
      ),
    }));

    return NextResponse.json(
      { attributes },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" } }
    );
  } catch (err) {
    return NextResponse.json(
      { attributes: [], error: err instanceof Error ? err.message : "Network error" },
      { status: 502 }
    );
  }
}
