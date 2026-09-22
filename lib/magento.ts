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
  /** Real per-set prices from the Klever module — the values come back as
      display strings, INCONSISTENTLY formatted (e.g. "1800.00" but
      "3,600.00"), so parse them, never render them verbatim. */
  kleverSetPricing?: {
    set1_price?: string | null;
    set2_price?: string | null;
    set4_price?: string | null;
    promo_rule_id?: string | number | null;
    promo_label?: string | null;
    promo_banner_url?: string | null;
    promo_discount_amount?: string | number | null;
    promo_discount_step?: string | number | null;
  } | null;
  /** Real per-SKU quantity constraints (Klever module) — drives every
      quantity selector; no local fixed list substitutes for `options`. */
  kleverQtyOptions?: {
    salable_qty?: number | null;
    max_qty?: number | null;
    default_qty?: number | null;
    options?: number[] | null;
    can_add_to_cart?: boolean | null;
    parts_category?: string | null;
  } | null;

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
/* No fallback image constant here on purpose: when a real product has no
   real Magento image, `image` below is left as an empty string — the
   already-established <ProductImage> component (components/ProductImage.tsx)
   treats an empty src as "no real photo" and shows its own local, honest
   placeholder icon, never a stock photo pretending to be the product. */

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

/** kleverSetPricing's numeric fields come back as display strings,
    inconsistently formatted (seen: "1800.00" alongside "3,600.00" in the
    same response) — strip any thousands separators before parsing. */
export function parseSetPrice(v: string | number | null | undefined): number | undefined {
  if (v == null) return undefined;
  const n = typeof v === "number" ? v : parseFloat(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

/** kleverSetPricing's own set4_price doesn't always have a matching
    bulk-buy rule discount applied (confirmed live — e.g. a real "Buy 3 Get 1
    Free" product returned set4_price = set1_price × 4, the plain
    undiscounted total, despite the SAME response's promo_discount_amount:
    25 / promo_discount_step: 4 describing a real, active 25%-at-4-units
    rule). Apply it here from those real numeric fields whenever set4 looks
    un-discounted (≈ set1 × 4) — driven only by the API's own numbers, no
    promo-label text matching or hardcoded offer IDs. */
function resolveSetPricing(p: GqlProduct): Product["setPricing"] {
  const sp = p.kleverSetPricing;
  if (!sp) return undefined;
  const set1 = parseSetPrice(sp.set1_price);
  const set2 = parseSetPrice(sp.set2_price);
  let set4 = parseSetPrice(sp.set4_price);
  const promoDiscountAmount = parseSetPrice(sp.promo_discount_amount);
  const promoDiscountStep = parseSetPrice(sp.promo_discount_step);
  const promoLabel = sp.promo_label ?? undefined;

  if (
    set4 != null &&
    set1 != null &&
    promoDiscountStep === 4 &&
    promoDiscountAmount != null &&
    promoDiscountAmount > 0 &&
    promoDiscountAmount < 100 &&
    Math.abs(set4 - set1 * 4) < 2
  ) {
    set4 = Math.round(set4 * (1 - promoDiscountAmount / 100));
  }

  if (set1 == null && set2 == null && set4 == null) return undefined;
  return {
    set1,
    set2,
    set4,
    promoLabel,
    promoBannerUrl: sp.promo_banner_url ?? undefined,
    promoDiscountAmount,
    promoDiscountStep,
  };
}

/* ─────────────────────────────────────────────────────────────────
   PUBLIC ADAPTER — single GraphQL product → our Product type
───────────────────────────────────────────────────────────────── */
import { resolveCountry, resolveOrigin, resolveWarranty } from "./attributeMappings";

export function adaptGqlProduct(p: GqlProduct): Product {
  const [price, originalPrice, maxPrice, currency] = resolvePrices(p);

  /* Brand display name. `p.brand` is the raw mgs_brand option id — Magento's
     ProductInterface exposes no resolved brand_name/brand_logo_url field on
     this schema (confirmed: neither ever comes back non-null), so `p.brand`
     is genuinely all that's available here. The real name/logo come from
     Magento's Klever brand directory (kleverBrands, keyed by this same
     option id) instead — see resolveBrandInfo() in
     lib/services/brands.service.ts, applied as a real-data enrichment pass
     by every route that returns a product list/detail to the client. No
     local static-map or file-scan substitute is used any more. */
  const resolvedBrandName = p.brand_name ?? p.brand ?? (p.name ?? "").split(" ")[0];
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

    image: p.image?.url ?? "",
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
    setPricing: resolveSetPricing(p),
    qtyOptions: p.kleverQtyOptions
      ? {
          salableQty: p.kleverQtyOptions.salable_qty ?? undefined,
          maxQty: p.kleverQtyOptions.max_qty ?? undefined,
          defaultQty: p.kleverQtyOptions.default_qty ?? undefined,
          options: p.kleverQtyOptions.options ?? undefined,
          canAddToCart: p.kleverQtyOptions.can_add_to_cart ?? undefined,
          partsCategory: p.kleverQtyOptions.parts_category ?? undefined,
        }
      : undefined,

    badge: originalPrice ? "Sale" : undefined,
    rating: resolveRating(p),
    reviewCount: Number(p.review_count ?? 0),
    inStock: p.stock_status == null ? undefined : p.stock_status === "IN_STOCK",
    quantity: p.quantity != null ? Number(p.quantity) : undefined,
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
export function parseAggregations(data: unknown, totalCount?: number): FilterGroup[] {
  const aggs = (data as GqlProductsResponse)?.data?.products?.aggregations;
  if (!Array.isArray(aggs)) return [];

  const seenLabels = new Set<string>();

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
    .filter((g) => g.options.length > 0)
    .filter((g) => {
      const norm = g.label.trim().toLowerCase();
      if (seenLabels.has(norm)) return false;
      seenLabels.add(norm);
      return true;
    });
}


interface GqlProductReviewItem {
  nickname?: string | null;
  summary?: string | null;
  text?: string | null;
  average_rating?: number | null;
  created_at?: string | null;
}

export interface GqlProductReviews {
  items?: GqlProductReviewItem[] | null;
  page_info?: { current_page?: number | null; page_size?: number | null; total_pages?: number | null } | null;
}

interface GqlProductDetailItem extends GqlProduct {
  media_gallery?: Array<{ url?: string | null; label?: string | null }> | null;
  reviews?: GqlProductReviews | null;
}

export interface GqlProductDetailResponse {
  data?: { products?: { items?: GqlProductDetailItem[] } | null };
  errors?: Array<{ message: string }>;
}

/** A single real customer review (from ProductInterface.reviews.items) — no
    per-review fields are ever fabricated; if Magento has no reviews for a
    SKU, `ProductDetail.reviews.items` is simply an empty array. */
export interface ProductReviewItem {
  nickname: string;
  summary: string;
  text: string;
  averageRating: number;
  createdAt: string;
}

export interface ProductReviewsData {
  items: ProductReviewItem[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductDetail extends Product {
  discountPercent?: number;
  gallery: { url: string; label: string }[];
  /** Raw bike_tyre_type option ID, resolved to a real label
      (bikeTyreType) by product.service.ts once it has network access. */
  bikeTyreTypeId?: string;
  bikeTyreType?: string;
  /** Real reviews (first page, pageSize 10) from Magento's own
      ProductInterface.reviews — see lib/services/product.service.ts's
      getProductReviewsPage() for fetching additional pages. */
  reviews: ProductReviewsData;
}

export function mapReviews(raw: GqlProductReviews | null | undefined): ProductReviewsData {
  const items = (raw?.items ?? [])
    .filter((r): r is GqlProductReviewItem => !!r)
    .map((r) => ({
      nickname: r.nickname ?? "",
      summary: r.summary ?? "",
      text: r.text ?? "",
      averageRating: Number(r.average_rating ?? 0),
      createdAt: r.created_at ?? "",
    }));
  return {
    items,
    currentPage: raw?.page_info?.current_page ?? 1,
    pageSize: raw?.page_info?.page_size ?? items.length,
    totalPages: raw?.page_info?.total_pages ?? (items.length ? 1 : 0),
  };
}

export function parseProductDetail(data: unknown): ProductDetail | null {
  const item = (data as GqlProductDetailResponse)?.data?.products?.items?.[0];
  if (!item) return null;

  const base = adaptGqlProduct(item);
  const min = item.price_range?.minimum_price;
  const gallery = (item.media_gallery ?? [])
    .filter((g) => g?.url)
    .map((g) => ({ url: g.url as string, label: g.label || item.name || "" }));
  const mainImage = item.image?.url || gallery[0]?.url || "";

  return {
    ...base,
    image: mainImage,
    gallery: gallery.length ? gallery : [{ url: mainImage, label: item.name ?? "" }],
    discountPercent: min?.discount?.percent_off ? Math.round(min.discount.percent_off) : undefined,
    bikeTyreTypeId: item.bike_tyre_type != null ? String(item.bike_tyre_type) : undefined,
    reviews: mapReviews(item.reviews),
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
