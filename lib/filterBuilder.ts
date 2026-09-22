/**
 * Safe Magento GraphQL filter builder.
 *
 * RULES (matches spec):
 *  - Only include keys that are in allowedFields
 *  - Never send undefined / null values
 *  - Skip empty strings
 *  - Multi-value strings (comma-separated) become { in: [...] }
 *  - Single values become { eq: "..." }
 */

export type FilterValue = { eq: string } | { in: string[] };
export type GqlFilter   = Record<string, FilterValue>;

/**
 * Build a Magento ProductAttributeFilterInput from a flat map of selections.
 * Safe to pass directly to a GraphQL `products(filter: $filter)` variable.
 */
export function buildGqlFilter(
  selected: Record<string, string>,
  allowedFields: string[],
): GqlFilter {
  const filter: GqlFilter = {};
  for (const key of allowedFields) {
    const raw = (selected[key] ?? "").trim();
    if (!raw) continue;
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) continue;
    filter[key] = parts.length === 1 ? { eq: parts[0] } : { in: parts };
  }
  return filter;
}

/**
 * Build URLSearchParams for navigation (e.g. /tyres?width=215&height=60).
 * Skips empty values and keys not in allowedFields.
 */
export function buildFilterParams(
  selected: Record<string, string>,
  allowedFields: string[],
): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of allowedFields) {
    const value = (selected[key] ?? "").trim();
    if (value) params.set(key, value);
  }
  return params;
}

/**
 * Canonical SEO tyre-size URL — /tyres/<w-h-r> or, with a rear size,
 * /tyres/<w-h-r>/<rw-rh-rr>. Takes the same filter-object shape every size
 * search already builds (width/height/rim + optional rear_*), so this is
 * purely a different OUTPUT format for the same existing values, not a new
 * data source. Mirrors the slug shape app/[locale]/tyres/[...sizes]/page.tsx
 * parses back.
 */
export function buildTyreSizeSlug(selected: Record<string, string>): string {
  const width = (selected.width ?? "").trim();
  const height = (selected.height ?? "").trim();
  const rim = (selected.rim ?? "").trim();
  if (!width || !height || !rim) return "/tyres";

  const front = `${width}-${height}-${rim}`;
  const rw = (selected.rear_width ?? "").trim();
  const rh = (selected.rear_height ?? "").trim();
  const rr = (selected.rear_rim ?? "").trim();
  return rw && rh && rr ? `/tyres/${front}/${rw}-${rh}-${rr}` : `/tyres/${front}`;
}

/**
 * Parses free-text tyre-size input into width/height/rim — no hardcoded
 * size list, purely structural. Accepts already-separated forms
 * ("245-35-19", "245/35 R19", "245 35 19") and a bare 7-digit run
 * ("2453519"), split using the standard width(3)+height(2)+rim(2) digit
 * grouping. Returns null when the input isn't recognizable as a size.
 */
export function parseTyreSizeInput(raw: string): { width: string; height: string; rim: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Already-separated: split on any run of non-digit/non-decimal-point
  // characters ("-", "/", " ", "r"/"R", etc. all count as a separator).
  const parts = trimmed.split(/[^0-9.]+/).filter(Boolean);
  if (parts.length === 3 && parts.every((p) => /^\d{2,3}(?:\.\d+)?$/.test(p))) {
    return { width: parts[0], height: parts[1], rim: parts[2] };
  }

  // Bare digit run, no separators at all — standard 3+2+2 grouping.
  if (/^\d{7}$/.test(trimmed)) {
    return { width: trimmed.slice(0, 3), height: trimmed.slice(3, 5), rim: trimmed.slice(5, 7) };
  }

  return null;
}

/**
 * Canonical SEO Brand slug builder — dynamically generates a clean slug from
 * live brand data (url_key or brand name) without any hardcoded mapping.
 * E.g. "Continental" -> "continental", "BF Goodrich" -> "bf-goodrich".
 */
export function buildBrandSlug(
  brand: string | { name?: string | null; url_key?: string | null; urlKey?: string | null } | null | undefined,
): string {
  if (!brand) return "";
  if (typeof brand === "string") {
    return brand
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  const urlKey = (brand.url_key || brand.urlKey || "").trim().toLowerCase();
  if (urlKey) {
    return urlKey.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  const name = (brand.name || "").trim().toLowerCase();
  return name.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/**
 * Canonical SEO Brand URL — /tyres/brand/{brand-slug}.
 */
export function buildBrandUrl(
  brand: string | { name?: string | null; url_key?: string | null; urlKey?: string | null } | null | undefined,
  locale?: string,
): string {
  const slug = buildBrandSlug(brand);
  if (!slug) return locale && locale !== "en" ? `/${locale}/tyres` : "/tyres";
  return locale && locale !== "en" ? `/${locale}/tyres/brand/${slug}` : `/tyres/brand/${slug}`;
}
