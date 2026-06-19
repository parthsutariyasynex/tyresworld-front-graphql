import type { Product } from "./data";

/* ─────────────────────────────────────────────────────────────────
   MAGENTO GRAPHQL INTEGRATION
   Endpoint: https://www.tyrescart.ae/graphql
   This store exposes the standard Magento 2 GraphQL schema. All
   product data now comes through the `products` query — no REST.
───────────────────────────────────────────────────────────────── */

/* ─── Raw GraphQL product shape (subset we request) ─────────────── */
export interface GqlMoney {
  value?: number | null;
  currency?: string | null;
}

export interface GqlProduct {
  uid?: string;
  sku?: string;
  name?: string;
  url_key?: string;
  stock_status?: string | null;     // "IN_STOCK" | "OUT_OF_STOCK"
  rating_summary?: number | null;   // 0-100 in Magento
  review_count?: number | null;
  image?: { url?: string | null; label?: string | null } | null;
  categories?: Array<{ name?: string | null }> | null;
  price_range?: {
    minimum_price?: {
      regular_price?: GqlMoney | null;
      final_price?: GqlMoney | null;
      discount?: { amount_off?: number | null; percent_off?: number | null } | null;
    } | null;
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

export interface GqlProductsResponse {
  data?: {
    products?: {
      total_count?: number;
      items?: GqlProduct[];
      page_info?: GqlPageInfo | null;
      aggregations?: GqlAggregation[] | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
}

/* A normalized, UI-ready filter group built from a Magento aggregation. */
export interface FilterOption { label: string; value: string; count: number; }
export interface FilterGroup  { code: string; label: string; options: FilterOption[]; }

/* ─── What our proxy route returns to the client ────────────────── */
export interface ApiProductsResponse {
  source:    "api" | "fallback";
  products:  Product[];
  total:     number;
  error?:    string;
  raw?:      unknown;            // original GraphQL payload, for debugging
}

/* ─────────────────────────────────────────────────────────────────
   GRAPHQL QUERY
   Uses variables so the route can pass search / category / paging.
   `products` requires either `search` or `filter`.
───────────────────────────────────────────────────────────────── */
export const PRODUCTS_QUERY = /* GraphQL */ `
  query Products(
    $pageSize: Int!
    $currentPage: Int
    $search: String
    $filter: ProductAttributeFilterInput
    $sort: ProductAttributeSortInput
  ) {
    products(
      pageSize: $pageSize
      currentPage: $currentPage
      search: $search
      filter: $filter
      sort: $sort
    ) {
      total_count
      page_info { current_page page_size total_pages }
      aggregations {
        attribute_code
        label
        count
        options { label value count }
      }
      items {
        uid
        sku
        name
        url_key
        stock_status
        rating_summary
        review_count
        image { url label }
        categories { name }
        price_range {
          minimum_price {
            regular_price { value currency }
            final_price { value currency }
            discount { amount_off percent_off }
          }
        }
      }
    }
  }
`;

/* ─────────────────────────────────────────────────────────────────
   INTERNAL HELPERS
───────────────────────────────────────────────────────────────── */
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&auto=format&fit=crop";

/** Map a Magento category label → our homepage tab IDs (best effort) */
const CATEGORY_MAP: Record<string, string> = {
  kitchen:       "Kitchen",
  dining:        "Kitchen",
  cookware:      "Kitchen",
  living:        "Living",
  "living room": "Living",
  decor:         "Living",
  bedroom:       "Bedroom",
  sleep:         "Bedroom",
  bedding:       "Bedroom",
  apparel:       "Apparel",
  clothing:      "Apparel",
  fashion:       "Apparel",
  wear:          "Apparel",
};

/** Pick the most meaningful category name from the GraphQL list */
function resolveCategory(p: GqlProduct): string {
  const names = (p.categories ?? [])
    .map((c) => c?.name?.trim())
    .filter((n): n is string => !!n);

  for (const name of names) {
    const mapped = CATEGORY_MAP[name.toLowerCase()];
    if (mapped) return mapped;
  }

  // No homepage-tab match — return the last (most specific) category, e.g. a brand
  return names[names.length - 1] ?? names[0] ?? "General";
}

/** Convert Magento rating_summary (0-100) → our 0-5 scale */
function resolveRating(p: GqlProduct): number {
  const raw = Number(p.rating_summary ?? 0);
  if (raw > 5)  return Math.round((raw / 20) * 10) / 10;  // 0-100 → 0-5
  if (raw > 0)  return raw;
  return 4.5;   // default when the store has no reviews yet
}

/** Resolve [currentPrice, originalPrice] from price_range */
function resolvePrices(p: GqlProduct): [number, number | undefined] {
  const min     = p.price_range?.minimum_price;
  const regular = Number(min?.regular_price?.value ?? 0);
  const final   = Number(min?.final_price?.value ?? regular);

  if (final > 0 && final < regular) return [final, regular];  // on sale
  return [regular || final, undefined];
}

/* ─────────────────────────────────────────────────────────────────
   PUBLIC ADAPTER — single GraphQL product → our Product type
───────────────────────────────────────────────────────────────── */
export function adaptGqlProduct(p: GqlProduct): Product {
  const [price, originalPrice] = resolvePrices(p);
  const id = String(p.uid ?? p.sku ?? p.url_key ?? Math.random().toString(36).slice(2));

  return {
    id,
    sku:          p.sku ?? undefined,
    urlKey:       p.url_key ?? undefined,
    name:         p.name ?? "Unnamed Product",
    price,
    originalPrice,
    category:     resolveCategory(p),
    image:        p.image?.url || FALLBACK_IMAGE,
    badge:        originalPrice ? "Sale" : undefined,
    rating:       resolveRating(p),
    reviewCount:  Number(p.review_count ?? 0),
    inStock:      p.stock_status == null ? undefined : p.stock_status === "IN_STOCK",
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

/* Category facets are navigation, not filters — they belong in the header menu. */
const EXCLUDED_AGGREGATIONS = new Set(["category_id", "category_uid"]);

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
      code:  a.attribute_code as string,
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

/* ─────────────────────────────────────────────────────────────────
   PRODUCT DETAIL — single product by url_key
───────────────────────────────────────────────────────────────── */
export const PRODUCT_DETAIL_QUERY = /* GraphQL */ `
  query ProductDetail($urlKey: String!) {
    products(filter: { url_key: { eq: $urlKey } }, pageSize: 1) {
      items {
        uid
        sku
        name
        url_key
        stock_status
        rating_summary
        review_count
        short_description { html }
        description { html }
        image { url label }
        media_gallery { url label }
        categories { name }
        price_range {
          minimum_price {
            regular_price { value currency }
            final_price { value currency }
            discount { percent_off }
          }
        }
      }
    }
  }
`;

interface GqlProductDetailItem extends GqlProduct {
  stock_status?: string;
  short_description?: { html?: string } | null;
  description?: { html?: string } | null;
  media_gallery?: Array<{ url?: string | null; label?: string | null }> | null;
}

export interface GqlProductDetailResponse {
  data?: { products?: { items?: GqlProductDetailItem[] } | null };
  errors?: Array<{ message: string }>;
}

export interface ProductDetail {
  uid: string;
  sku: string;
  name: string;
  urlKey: string;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  currency: string;
  discountPercent?: number;
  shortDescriptionHtml?: string;
  descriptionHtml?: string;
  image: string;
  gallery: { url: string; label: string }[];
  category: string;
  categories: string[];
}

export function parseProductDetail(data: unknown): ProductDetail | null {
  const item = (data as GqlProductDetailResponse)?.data?.products?.items?.[0];
  if (!item) return null;

  const [price, originalPrice] = resolvePrices(item);
  const min = item.price_range?.minimum_price;
  const gallery = (item.media_gallery ?? [])
    .filter((g) => g?.url)
    .map((g) => ({ url: g.url as string, label: g.label || item.name || "" }));
  const mainImage = item.image?.url || gallery[0]?.url || FALLBACK_IMAGE;
  const categories = (item.categories ?? [])
    .map((c) => c?.name?.trim())
    .filter((n): n is string => !!n);

  return {
    uid:        String(item.uid ?? item.sku ?? ""),
    sku:        item.sku ?? "",
    name:       item.name ?? "Unnamed Product",
    urlKey:     item.url_key ?? "",
    inStock:    (item.stock_status ?? "IN_STOCK") === "IN_STOCK",
    rating:     resolveRating(item),
    reviewCount: Number(item.review_count ?? 0),
    price,
    originalPrice,
    currency:   min?.final_price?.currency || min?.regular_price?.currency || "AED",
    discountPercent: min?.discount?.percent_off ? Math.round(min.discount.percent_off) : undefined,
    shortDescriptionHtml: item.short_description?.html || undefined,
    descriptionHtml:      item.description?.html || undefined,
    image:      mainImage,
    gallery:    gallery.length ? gallery : [{ url: mainImage, label: item.name ?? "" }],
    category:   resolveCategory(item),
    categories,
  };
}

/* ─────────────────────────────────────────────────────────────────
   NAVIGATION MENU — built from the Magento category tree
───────────────────────────────────────────────────────────────── */
export interface GqlCategory {
  uid?: string;
  name?: string;
  url_key?: string;
  include_in_menu?: number | boolean | null;
  children?: GqlCategory[] | null;
}

export interface GqlCategoriesResponse {
  data?: { categoryList?: GqlCategory[] | null };
  errors?: Array<{ message: string }>;
}

/** A normalized menu node consumed by the Header. */
export interface MenuItem {
  uid:       string;
  label:     string;
  href:      string;
  children?: MenuItem[];
}

export const MENU_QUERY = /* GraphQL */ `
  query Menu {
    categoryList {
      uid
      name
      children {
        uid
        name
        url_key
        include_in_menu
        children {
          uid
          name
          url_key
          include_in_menu
        }
      }
    }
  }
`;

/** Build the shop link for a category uid (filterable by the products route). */
function categoryHref(uid: string): string {
  return `/shop?categoryUid=${encodeURIComponent(uid)}`;
}

function adaptCategory(c: GqlCategory): MenuItem | null {
  if (!c.uid || !c.name) return null;
  const children = (c.children ?? [])
    .map(adaptCategory)
    .filter((x): x is MenuItem => x !== null);

  return {
    uid:   c.uid,
    label: c.name,
    href:  categoryHref(c.uid),
    ...(children.length ? { children } : {}),
  };
}

/**
 * Parse the categoryList response into the top-level menu.
 * Returns the children of the store root (Tyres, Motorcycle, Wheels, …),
 * each carrying its own sub-categories.
 */
export function parseMenu(data: unknown): MenuItem[] {
  const root = (data as GqlCategoriesResponse)?.data?.categoryList?.[0];
  if (!root?.children) return [];
  return root.children
    .map(adaptCategory)
    .filter((x): x is MenuItem => x !== null);
}
