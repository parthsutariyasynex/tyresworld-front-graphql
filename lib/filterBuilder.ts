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
