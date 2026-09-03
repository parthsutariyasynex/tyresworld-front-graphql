import { NextResponse } from "next/server";
import { TYRE_FINDER_METADATA_QUERY } from "@/lib/queries";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

type AttrOption = { label: string; value: string };
type AttrItem = { code: string; options?: AttrOption[] | null };

const SIZE_CODES = new Set(["width", "height", "rim", "year"]);

const DEFAULT_WIDTHS = [
  "145", "155", "165", "175", "185", "195", "205", "215", "225", "235",
  "245", "255", "265", "275", "285", "295", "305", "315", "325", "335", "345", "355"
].map((v) => ({ label: v, value: v }));

const DEFAULT_HEIGHTS = [
  "25", "30", "35", "40", "45", "50", "55", "60", "65", "70", "75", "80", "85"
].map((v) => ({ label: v, value: v }));

const DEFAULT_RIMS = [
  "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24"
].map((v) => ({ label: v, value: v }));

const FALLBACK_ATTRIBUTES = [
  { attribute_code: "width", attribute_options: DEFAULT_WIDTHS },
  { attribute_code: "height", attribute_options: DEFAULT_HEIGHTS },
  { attribute_code: "rim", attribute_options: DEFAULT_RIMS },
];

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
      method: "POST",
      headers: magentoHeaders(),
      body: JSON.stringify({ query: TYRE_FINDER_METADATA_QUERY }),
      next: { revalidate: 3600 },
    });

    const raw = await res.json().catch(() => null);

    if (!res.ok || raw?.errors?.length) {
      return NextResponse.json(
        { attributes: FALLBACK_ATTRIBUTES, error: raw?.errors?.[0]?.message ?? `HTTP ${res.status}` },
        { status: 200 }
      );
    }

    const items: AttrItem[] = raw?.data?.customAttributeMetadataV2?.items ?? [];

    let attributes = items.map((item) => ({
      attribute_code: item.code,
      attribute_options: sortOptions(
        item.code,
        (item.options ?? []).filter((o) => o.label && o.value),
      ),
    }));

    if (attributes.length === 0 || !attributes.some((a) => a.attribute_code === "width" && a.attribute_options.length > 0)) {
      attributes = FALLBACK_ATTRIBUTES;
    }

    return NextResponse.json(
      { attributes },
      { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" } }
    );
  } catch (err) {
    return NextResponse.json(
      { attributes: FALLBACK_ATTRIBUTES, error: err instanceof Error ? err.message : "Network error" },
      { status: 200 }
    );
  }
}
