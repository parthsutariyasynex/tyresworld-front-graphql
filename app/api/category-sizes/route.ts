/**
 * GET /api/category-sizes
 *
 * Generates Width, Height, and Rim filter options by fetching the actual
 * products that belong to the given category and reading their attribute
 * values directly from the product data.
 *
 * Source of truth: products in the category, not predefined attribute options.
 * Only values that exist on real products appear in the Tyre Finder.
 *
 * Query params:
 *   category_uid  — Magento category UID (defaults to root tyres category)
 *   width         — optional; restrict to products with this width value
 *   height        — optional; restrict further (for rim options)
 *
 * Response: { widths: AttrOption[], heights: AttrOption[], rims: AttrOption[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { CATEGORY_PRODUCT_SIZES_QUERY } from "@/lib/queries";
import { buildGqlFilter } from "@/lib/filterBuilder";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

type AttrOption = { label: string; value: string };
type CustomAttr = { attribute_code: string; value: string };
type ProductItem = { custom_attributes: CustomAttr[] | null };

const TYRES_CATEGORY_UID = APP_CONFIG.magento.tyresCategoryUid;
const PAGE_SIZE = 200;
const SIZE_CODES = ["width", "height", "rim"] as const;
type SizeCode = typeof SIZE_CODES[number];

function sortNumeric(opts: AttrOption[]): AttrOption[] {
  return [...opts].sort((a, b) => {
    const na = parseFloat(a.value), nb = parseFloat(b.value);
    return !isNaN(na) && !isNaN(nb)
      ? na - nb
      : a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
  });
}

async function fetchPage(
  filter: Record<string, unknown>,
  currentPage: number,
): Promise<{ total_count: number; items: ProductItem[] }> {
  const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
    method: "POST",
    headers: magentoHeaders(),
    body: JSON.stringify({
      query: CATEGORY_PRODUCT_SIZES_QUERY,
      variables: { filter, pageSize: PAGE_SIZE, currentPage },
    }),
    cache: "no-store",
  });

  const raw = await res.json().catch(() => null);
  if (!res.ok || raw?.errors?.length) {
    throw new Error(raw?.errors?.[0]?.message ?? `HTTP ${res.status}`);
  }
  return raw?.data?.products ?? { total_count: 0, items: [] };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category_uid = searchParams.get("category_uid") ?? TYRES_CATEGORY_UID;

  // Build a safe GraphQL filter from the provided params
  const selected: Record<string, string> = { category_uid };
  const width = searchParams.get("width");
  const height = searchParams.get("height");
  if (width) selected.width = width;
  if (height) selected.height = height;

  const filter = buildGqlFilter(selected, ["category_uid", "width", "height"]);

  try {
    // Fetch page 1 to get total_count and first batch of products
    const firstPage = await fetchPage(filter, 1);
    let items: ProductItem[] = [...firstPage.items];

    // Fetch remaining pages in parallel when total exceeds one page
    if (firstPage.total_count > PAGE_SIZE) {
      const totalPages = Math.ceil(firstPage.total_count / PAGE_SIZE);
      const extraPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(filter, i + 2))
      );
      for (const page of extraPages) items = items.concat(page.items);
    }

    // Collect unique values for each size attribute from actual product data
    const sets: Record<SizeCode, Set<string>> = {
      width: new Set(), height: new Set(), rim: new Set(),
    };
    for (const item of items) {
      for (const attr of item.custom_attributes ?? []) {
        if ((SIZE_CODES as readonly string[]).includes(attr.attribute_code) && attr.value) {
          sets[attr.attribute_code as SizeCode].add(attr.value);
        }
      }
    }

    // Convert each set to a sorted AttrOption array
    // label === value because tyre size attributes store the human-readable value directly
    const toOptions = (code: SizeCode): AttrOption[] =>
      sortNumeric([...sets[code]].map((v) => ({ label: v, value: v })));

    return NextResponse.json(
      {
        widths: toOptions("width"),
        heights: toOptions("height"),
        rims: toOptions("rim"),
      },
      {
        headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
      }
    );
  } catch (err) {
    return NextResponse.json(
      {
        widths: [],
        heights: [],
        rims: [],
        error: err instanceof Error ? err.message : "Network error",
      },
      { status: 502 }
    );
  }
}
