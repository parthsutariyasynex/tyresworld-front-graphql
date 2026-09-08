import { NextResponse } from "next/server";
import { TYRE_FINDER_METADATA_QUERY, VIEW_MORE_FILTER_QUERY } from "@/lib/queries";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

type AttrOption = { label: string; value: string };
type AttrItem = { code: string; options?: AttrOption[] | null };

const SIZE_CODES = new Set(["width", "height", "rim", "year"]);

/* Size attributes are sourced from viewMoreFilter, not customAttributeMetadataV2.
   Metadata returns every option ever defined (86 widths, incl. ones no product
   carries) keyed by internal option ID — and products(filter:) matches on the
   LABEL, so those IDs select nothing. viewMoreFilter returns labels, is not
   capped at 10 like products.aggregations, and honours `filter`. */
const SIZE_FILTER_CODES = ["width", "height", "rim"] as const;

/** Purely numeric label, e.g. "225" or "22.5" — but not "31X" or "15C". */
const NUMERIC_LABEL = /^\d+(\.\d+)?$/;

function sortOptions(code: string, options: AttrOption[]): AttrOption[] {
  return [...options].sort((a, b) => {
    if (SIZE_CODES.has(code)) {
      const aNum = NUMERIC_LABEL.test(a.label), bNum = NUMERIC_LABEL.test(b.label);
      if (aNum && bNum) return parseFloat(a.label) - parseFloat(b.label);
      /* Suffixed labels (31X, 15C) sort after the plain numbers, as on the
         live finder. parseFloat can't decide this — parseFloat("31X") is 31,
         which would put it ahead of 155. */
      if (aNum !== bNum) return aNum ? -1 : 1;
    }
    return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
  });
}

/** Width/height/rim options that products in the tyres category actually carry. */
async function fetchSizeOptions(): Promise<Record<string, AttrOption[]>> {
  const filter = { category_uid: { eq: APP_CONFIG.magento.tyresCategoryUid } };

  const entries = await Promise.all(
    SIZE_FILTER_CODES.map(async (code) => {
      const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
        method: "POST",
        headers: magentoHeaders(),
        body: JSON.stringify({
          query: VIEW_MORE_FILTER_QUERY,
          variables: { filterName: code, search: "", filter },
        }),
        next: { revalidate: APP_CONFIG.cache.filters },
      });

      const raw = await res.json().catch(() => null);
      const aggs: { options?: AttrOption[] }[] =
        raw?.data?.viewMoreFilter?.aggregations ?? [];

      const options = aggs
        .flatMap((a) => a.options ?? [])
        .filter((o) => o.label && o.value)
        .map((o) => ({ label: o.label, value: o.value }));

      return [code, options] as const;
    }),
  );

  return Object.fromEntries(entries);
}

export async function GET() {
  try {
    const [res, sizeOptions] = await Promise.all([
      fetch(APP_CONFIG.magento.graphqlUrl, {
        method: "POST",
        headers: magentoHeaders(),
        body: JSON.stringify({ query: TYRE_FINDER_METADATA_QUERY }),
        next: { revalidate: APP_CONFIG.cache.filters },
      }),
      fetchSizeOptions(),
    ]);

    const raw = await res.json().catch(() => null);

    if (!res.ok || raw?.errors?.length) {
      return NextResponse.json(
        { attributes: [], error: raw?.errors?.[0]?.message ?? `HTTP ${res.status}` },
        { status: 200 }
      );
    }

    const items: AttrItem[] = raw?.data?.customAttributeMetadataV2?.items ?? [];

    const attributes = items.map((item) => ({
      attribute_code: item.code,
      attribute_options: sortOptions(
        item.code,
        (item.options ?? [])
          .filter((o) => o.label && o.value)
          .map((o) => ({
            label: o.label,
            value: SIZE_CODES.has(item.code) ? o.label : o.value,
          })),
      ),
    }));

    /* Replace the size attributes with the viewMoreFilter lists. Metadata's
       vehicle/model/year/mgs_brand entries are left as they were — /api/vehicles
       reads `vehicle` from this same response. */
    for (const code of SIZE_FILTER_CODES) {
      const entry = {
        attribute_code: code,
        attribute_options: sortOptions(code, sizeOptions[code] ?? []),
      };
      const idx = attributes.findIndex((a) => a.attribute_code === code);
      if (idx >= 0) attributes[idx] = entry;
      else attributes.push(entry);
    }

    const sizesUnavailable = SIZE_FILTER_CODES.every(
      (code) => (sizeOptions[code] ?? []).length === 0,
    );

    return NextResponse.json(
      sizesUnavailable
        ? { attributes, error: "Size options unavailable" }
        : { attributes },
      { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" } }
    );
  } catch (err) {
    return NextResponse.json(
      { attributes: [], error: err instanceof Error ? err.message : "Network error" },
      { status: 200 }
    );
  }
}
