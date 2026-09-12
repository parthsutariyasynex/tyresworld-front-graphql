import type { Product } from "./data";
import { PRODUCTS_QUERY, PRODUCT_DETAIL_QUERY, PRODUCT_DETAIL_BY_URLKEY_QUERY, FILTERS_QUERY, MENU_QUERY } from "./queries";
export { PRODUCTS_QUERY, PRODUCT_DETAIL_QUERY, PRODUCT_DETAIL_BY_URLKEY_QUERY, FILTERS_QUERY, MENU_QUERY };

/* ─────────────────────────────────────────────────────────────────
   MAGENTO GRAPHQL INTEGRATION
   Endpoint: https://powertire.klever.ae/graphql
   This store exposes the standard Magento 2 GraphQL schema. All
   product data now comes through the `products` query — no REST.
───────────────────────────────────────────────────────────────── */

/* ─── Raw GraphQL product shape ──────────────────────────────────── */
export interface GqlMoney {
  value?: number | null;
  currency?: string | null;
}

export interface GqlImage {
  url?: string | null;
  label?: string | null;
}

export interface GqlProduct {
  __typename?: string;
  id?: number | null;
  uid?: string;
  sku?: string;
  name?: string;
  display_name?: string | null;
  item_code?: string | null;
  stock_status?: string | null;
  quantity?: number | null;
  url_key?: string;
  url_suffix?: string | null;
  url_path?: string | null;
  type_id?: string | null;

  brand?: string | null;           // alias for mgs_brand
  offers?: string | number | null; // raw option ID from the offers attribute
  country_of_manufacture?: string | null;
  // These three come from the backend when the brand GraphQL fields are live.
  // Add them to PRODUCTS_QUERY / PRODUCT_DETAIL_QUERY once the schema exposes them.
  brand_name?: string | null;      // brand display name
  brand_logo_url?: string | null;  // brand logo image URL
  brand_page_url?: string | null;  // brand landing page URL
  manufacturer?: string | null;
  size?: string | null;
  tyre_size?: string | null;
  pattern?: string | null;
  width?: string | null;
  height?: string | null;
  rim?: string | null;
  year?: string | null;
  origin?: string | null;
  country?: string | null;
  warranty_period?: string | null;
  /** Raw select-attribute option ID (e.g. 2095), not a label — resolved to
      text server-side in product.service.ts, same as brand IDs elsewhere. */
  bike_tyre_type?: number | string | null;

  image?: GqlImage | null;
  small_image?: GqlImage | null;
  thumbnail?: GqlImage | null;

  description?: { html?: string | null } | null;
  short_description?: { html?: string | null } | null;

  categories?: Array<{ id?: number | null; name?: string | null; url_key?: string | null }> | null;

  price_range?: {
    minimum_price?: {
      regular_price?: GqlMoney | null;
      final_price?: GqlMoney | null;
      discount?: { amount_off?: number | null; percent_off?: number | null } | null;
    } | null;
    maximum_price?: {
      final_price?: GqlMoney | null;
    } | null;
  } | null;

  rating_summary?: number | null;
  review_count?: number | null;

  driver_reviews?: {
    is_tyre?: boolean | null;
    manufacturer?: string | null;
    model?: string | null;
    tyre_size?: string | null;
    vehicle_type?: string | null;
  } | null;
}

export interface GqlAggregationOption {
  label?: string;
  value?: string;
  count?: number;
}

export interface GqlAggregation {
  attribute_code?: string;
  label?: string;
  count?: number;
  options?: GqlAggregationOption[];
}

export interface GqlPageInfo {
  current_page?: number;
  page_size?: number;
  total_pages?: number;
}

export interface GqlSortField {
  label?: string | null;
  value?: string | null;
}

export interface GqlProductsResponse {
  data?: {
    products?: {
      total_count?: number;
      items?: GqlProduct[];
      page_info?: GqlPageInfo | null;
      aggregations?: GqlAggregation[] | null;
      sort_fields?: { default?: string | null; options?: GqlSortField[] | null } | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
}

/* A normalized, UI-ready filter group built from a Magento aggregation. */
export interface FilterOption { label: string; value: string; count: number; }
export interface FilterGroup { code: string; label: string; options: FilterOption[]; }

/* ─── What our proxy route returns to the client ────────────────── */
export interface ApiProductsResponse {
  source: "api" | "fallback";
  products: Product[];
  total: number;
  error?: string;
  raw?: unknown;            // original GraphQL payload, for debugging
}


/* ─────────────────────────────────────────────────────────────────
   INTERNAL HELPERS
───────────────────────────────────────────────────────────────── */
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&auto=format&fit=crop";

/** Pick the primary category name from the GraphQL list (most specific last) */
function resolveCategory(p: GqlProduct): string {
  const names = (p.categories ?? [])
    .map((c) => c?.name?.trim())
    .filter((n): n is string => !!n);
  return names[names.length - 1] ?? names[0] ?? "General";
}

/** Convert Magento rating_summary (0-100) → our 0-5 scale */
function resolveRating(p: GqlProduct): number {
  const raw = Number(p.rating_summary ?? 0);
  if (raw <= 0) return 0;
  if (raw > 5) return Math.round((raw / 20) * 10) / 10;
  return raw;
}

/** Resolve [finalPrice, originalPrice, maxPrice, currency] from price_range */
function resolvePrices(p: GqlProduct): [number, number | undefined, number | undefined, string] {
  const min = p.price_range?.minimum_price;
  const regular = Number(min?.regular_price?.value ?? 0);
  const final = Number(min?.final_price?.value ?? regular);
  const max = Number(p.price_range?.maximum_price?.final_price?.value ?? 0) || undefined;
  // No hardcoded currency fallback — when Magento omits it, the display
  // layer (<Money/>) resolves the store's currency from store config.
  const currency = min?.final_price?.currency ?? min?.regular_price?.currency ?? "";

  if (final > 0 && final < regular) return [final, regular, max, currency];
  return [regular || final, undefined, max, currency];
}

/* ─────────────────────────────────────────────────────────────────
   PUBLIC ADAPTER — single GraphQL product → our Product type
───────────────────────────────────────────────────────────────── */
import { getBrandName } from "./brandLogos";
import { resolveCountry, resolveOrigin, resolveWarranty } from "./attributeMappings";

export function adaptGqlProduct(p: GqlProduct): Product {
  const [price, originalPrice, maxPrice, currency] = resolvePrices(p);

  /* Brand display name. `p.brand` is the raw mgs_brand option id, which Magento
     sends as a number, so when neither brand_name nor the local lookup resolves
     it the chain would yield a number for a field typed — and consumed — as a
     string (TyreListingCard calls .toLowerCase() on it). Coerce here, keeping
     undefined as undefined so the `?? ` chains downstream still work. */
  const resolvedBrandName =
    p.brand_name ?? getBrandName(p.brand) ?? p.brand ?? (p.name ?? "").split(" ")[0];
  const id = String(p.uid ?? p.sku ?? p.url_key ?? Math.random().toString(36).slice(2));
  // url_suffix is typically ".html" — strip it for our internal route /product/[urlKey]
  const urlKey = p.url_key
    ? p.url_key.replace(p.url_suffix?.replace(/^\./, "") ?? "", "").replace(/\/$/, "") || p.url_key
    : undefined;

  return {
    id,
    sku: p.sku ?? undefined,
    urlKey,
    urlPath: p.url_path ?? undefined,
    typeId: p.type_id ?? undefined,
    name: p.display_name ?? p.name ?? "Unnamed Product",
    displayName: p.display_name ?? undefined,
    itemCode: p.item_code ?? undefined,

    price,
    originalPrice,
    maxPrice,
    currency,

    image: p.image?.url || FALLBACK_IMAGE,
    smallImage: p.small_image?.url ?? undefined,
    thumbnail: p.thumbnail?.url ?? undefined,

    descriptionHtml: p.description?.html ?? undefined,
    shortDescriptionHtml: p.short_description?.html ?? undefined,

    brand: p.brand ?? undefined,

    // Brand display fields — use backend values when available, else derive locally.
    brandName: resolvedBrandName == null ? undefined : String(resolvedBrandName),
    brandLogoUrl: p.brand_logo_url ?? undefined,
    brandPageUrl: p.brand_page_url ?? undefined,

    manufacturer: p.manufacturer ?? undefined,
    country: p.country_of_manufacture ?? resolveCountry(p.country) ?? undefined,
    size: p.size ?? undefined,
    tyreSize: p.tyre_size ?? undefined,
    pattern: p.pattern ?? undefined,
    width: p.width ?? undefined,
    height: p.height ?? undefined,
    rim: p.rim ?? undefined,
    year: p.year ?? undefined,
    origin: resolveOrigin(p.origin) ?? undefined,
    warrantyPeriod: resolveWarranty(p.warranty_period) ?? undefined,

    category: resolveCategory(p),
    categories: (p.categories ?? [])
      .filter((c) => c?.name)
      .map((c) => ({ id: c.id ?? null, name: c.name!, urlKey: c.url_key ?? undefined })),

    offersId: p.offers != null ? String(p.offers) : undefined,

    badge: originalPrice ? "Sale" : undefined,
    rating: resolveRating(p),
    reviewCount: Number(p.review_count ?? 0),
    inStock: p.stock_status == null ? undefined : p.stock_status === "IN_STOCK",
    quantity: p.quantity != null ? Number(p.quantity) : undefined,

    driverReviews: p.driver_reviews
      ? {
          isTyre: !!p.driver_reviews.is_tyre,
          manufacturer: p.driver_reviews.manufacturer ?? "",
          model: p.driver_reviews.model ?? "",
          tyreSize: p.driver_reviews.tyre_size ?? "",
          vehicleType: p.driver_reviews.vehicle_type ?? "",
        }
      : undefined,
  };
}

/* ─────────────────────────────────────────────────────────────────
   PUBLIC PARSER — full GraphQL response → Product[]
───────────────────────────────────────────────────────────────── */
export function parseGraphqlResponse(data: unknown): Product[] {
  const items = (data as GqlProductsResponse)?.data?.products?.items;
  if (!Array.isArray(items)) return [];
  return items.map(adaptGqlProduct);
}

/* width/height/rim used to be excluded here on the assumption the sticky
   "Search Tyre Size" finder made them redundant in the sidebar — but the
   live site's own layered nav (checked on /en/tyres, /en/motorcycle-tyre)
   shows them in the sidebar too, alongside that finder, not instead of it.
   Only true non-facet fields stay excluded. */
const EXCLUDED_AGGREGATIONS = new Set([
  "category_id",
  "category_uid",
]);

/**
 * Normalize Magento `aggregations` into UI-ready filter groups.
 * These are the ONLY source of shop filter options — nothing hardcoded.
 */
export function parseAggregations(data: unknown): FilterGroup[] {
  const aggs = (data as GqlProductsResponse)?.data?.products?.aggregations;
  if (!Array.isArray(aggs)) return [];

  return aggs
    .filter((a) => a.attribute_code && !EXCLUDED_AGGREGATIONS.has(a.attribute_code))
    .map((a) => ({
      code: a.attribute_code as string,
      label: a.label || (a.attribute_code as string),
      options: (a.options ?? [])
        .filter((o) => o.value != null && o.value !== "" && o.label)
        .map((o) => ({
          label: o.label as string,
          value: String(o.value),
          count: Number(o.count ?? 0),
        })),
    }))
    .filter((g) => g.options.length > 0);
}


interface GqlProductDetailItem extends GqlProduct {
  media_gallery?: Array<{ url?: string | null; label?: string | null }> | null;
}

export interface GqlProductDetailResponse {
  data?: { products?: { items?: GqlProductDetailItem[] } | null };
  errors?: Array<{ message: string }>;
}

export interface ProductDetail extends Product {
  discountPercent?: number;
  gallery: { url: string; label: string }[];
  /** Raw bike_tyre_type option ID, resolved to a real label
      (bikeTyreType) by product.service.ts once it has network access. */
  bikeTyreTypeId?: string;
  bikeTyreType?: string;
}

export function parseProductDetail(data: unknown): ProductDetail | null {
  const item = (data as GqlProductDetailResponse)?.data?.products?.items?.[0];
  if (!item) return null;

  const base = adaptGqlProduct(item);
  const min = item.price_range?.minimum_price;
  const gallery = (item.media_gallery ?? [])
    .filter((g) => g?.url)
    .map((g) => ({ url: g.url as string, label: g.label || item.name || "" }));
  const mainImage = item.image?.url || gallery[0]?.url || FALLBACK_IMAGE;

  return {
    ...base,
    image: mainImage,
    gallery: gallery.length ? gallery : [{ url: mainImage, label: item.name ?? "" }],
    discountPercent: min?.discount?.percent_off ? Math.round(min.discount.percent_off) : undefined,
    bikeTyreTypeId: item.bike_tyre_type != null ? String(item.bike_tyre_type) : undefined,
  };
}

export function isMotorcycleProduct(product?: {
  name?: string;
  categories?: Array<{ id?: number | string | null; uid?: string | null; name?: string | null; urlKey?: string | null }>;
} | null): boolean {
  if (!product) return false;

  // Check URL pathname if client-side
  if (typeof window !== "undefined") {
    const path = window.location.pathname.toLowerCase();
    if (path.includes("motorcycle") || path.includes("motorbike") || path.includes("scooter")) {
      return true;
    }
  }

  const nameLower = (product.name || "").toLowerCase();
  if (
    nameLower.includes("motorcycle") ||
    nameLower.includes("motorbike") ||
    nameLower.includes("scooter") ||
    nameLower.includes("moped") ||
    nameLower.includes("mitas") ||
    nameLower.includes("metzeler") ||
    nameLower.includes("terra force") ||
    nameLower.includes("stone king") ||
    nameLower.includes("sportec") ||
    nameLower.includes("scorpion mx") ||
    nameLower.includes("angel scooter") ||
    nameLower.includes("diablo rosso")
  ) {
    return true;
  }

  if (
    product.categories?.some((c) => {
      const idStr = String(c.id ?? "");
      const name = (c.name || "").toLowerCase();
      const urlKey = (c.urlKey || "").toLowerCase();
      return (
        idStr === "1116" ||
        c.uid === "MTExNg==" ||
        name.includes("motorcycle") ||
        name.includes("motorbike") ||
        name.includes("scooter") ||
        name.includes("moped") ||
        urlKey.includes("motorcycle") ||
        urlKey.includes("motorbike") ||
        urlKey.includes("scooter") ||
        urlKey.includes("moped")
      );
    })
  ) {
    return true;
  }
  return false;
}

/* ─────────────────────────────────────────────────────────────────
   NAVIGATION MENU — built from the Magento category tree
───────────────────────────────────────────────────────────────── */
export interface GqlCategory {
  uid?: string;
  name?: string;
  url_key?: string;
  url_path?: string;
  include_in_menu?: number | boolean | null;
  children?: GqlCategory[] | null;
}

export interface GqlCategoriesResponse {
  data?: {
    categories?: { items?: GqlCategory[] | null } | null;
  };
  errors?: Array<{ message: string }>;
}

/** A normalized menu node consumed by the Header. */
export interface MenuItem {
  uid: string;
  label: string;
  href: string;
  children?: MenuItem[];
}


function adaptCategory(c: GqlCategory): MenuItem | null {
  if (!c.uid || !c.name) return null;
  if (c.include_in_menu === 0) return null;
  const children = (c.children ?? [])
    .map(adaptCategory)
    .filter((x): x is MenuItem => x !== null);

  return {
    uid: c.uid,
    label: c.name,
    href: c.url_path ? `/en/${c.url_path}` : "/",
    ...(children.length ? { children } : {}),
  };
}

/**
 * Parse the `categories` response into the top-level menu.
 * Queries with `parent_id: { eq: "2" }` return top-level nav items directly as `items`.
 */
export function parseMenu(data: unknown): MenuItem[] {
  const items = (data as GqlCategoriesResponse)?.data?.categories?.items;
  if (!items?.length) return [];
  return items
    .map(adaptCategory)
    .filter((x): x is MenuItem => x !== null);
}
