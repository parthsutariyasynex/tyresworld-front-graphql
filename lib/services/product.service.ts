/* ─────────────────────────────────────────────────────────────────
   PRODUCT SERVICE
   Domain layer between route handlers / Server Components and the
   GraphQL client. Returns UI-ready domain objects + a uniform
   ok/status/error envelope so callers map to HTTP without duplicating
   fetch or error-handling logic.
───────────────────────────────────────────────────────────────── */
import { magentoFetch, firstError } from "@/lib/graphql/client";
import {
  PRODUCTS_QUERY,
  PRODUCT_DETAIL_QUERY,
  PRODUCT_DETAIL_BY_URLKEY_QUERY,
  BIKE_TYRE_TYPE_METADATA_QUERY,
} from "@/lib/queries";
import {
  parseGraphqlResponse,
  parseProductDetail,
  type GqlProductsResponse,
  type GqlProductDetailResponse,
  type ProductDetail,
} from "@/lib/magento";
import { APP_CONFIG } from "@/src/config/app-config";
import type { Product } from "@/lib/data";

export interface ProductListResult {
  ok: boolean;
  status: number;
  products: Product[];
  total: number;
  totalPages: number;
  currentPage: number;
  error?: string;
}

export interface ProductDetailResult {
  ok: boolean;
  status: number;
  product: ProductDetail | null;
  error?: string;
}

/** Product listing / search (grids, carousels, category-less search). */
export async function getProducts(params: {
  search?: string;
  pageSize?: number;
  currentPage?: number;
  categoryUid?: string;
  store?: string;
}): Promise<ProductListResult> {
  /* An empty search means "no keyword", not "search for the word tyre".
     Defaulting to "tyre" silently excluded everything whose indexed text
     doesn't contain it — 7,404 hits instead of 8,522 across the catalogue. */
  const search = params.search ?? "";
  const pageSize = params.pageSize ?? 24;
  const currentPage = params.currentPage ?? 1;

  /* PRODUCTS_QUERY always spells out `filter: { category_uid: { eq: $categoryUid } }`.
     If $categoryUid arrives as null that becomes `category_uid: { eq: null }`,
     which crashes Magento's Elasticsuite virtual-category plugin
     (RequestMapperPlugin → "Internal server error", with the real cause only
     in extensions.debugMessage). Omitting the variable entirely is what makes
     Magento ignore the filter, so only include it when it has a real value. */
  const categoryUid =
    typeof params.categoryUid === "string" && params.categoryUid.trim() !== ""
      ? params.categoryUid
      : undefined;

  const variables: Record<string, unknown> = { search, pageSize, currentPage };
  if (categoryUid) variables.categoryUid = categoryUid;

  const r = await magentoFetch<GqlProductsResponse["data"]>(
    PRODUCTS_QUERY,
    variables,
    { store: params.store, revalidate: APP_CONFIG.cache.products },
  );

  // HTTP / network failure → propagate status.
  if (!r.ok) {
    return { ok: false, status: r.status, products: [], total: 0, totalPages: 1, currentPage, error: firstError(r) };
  }
  // GraphQL error alongside 200 → empty result (matches prior behaviour).
  if (r.errors?.length) {
    return { ok: true, status: 200, products: [], total: 0, totalPages: 1, currentPage, error: r.errors[0].message };
  }

  const wrapper = { data: r.data } as GqlProductsResponse;
  const products = parseGraphqlResponse(wrapper);
  const pd = r.data?.products;

  return {
    ok: true,
    status: 200,
    products,
    total: pd?.total_count ?? products.length,
    totalPages: pd?.page_info?.total_pages ?? 1,
    currentPage: pd?.page_info?.current_page ?? currentPage,
  };
}

/** "Bike Tyre Type" (e.g. "Scooter / PitBike") comes back on the product
    only as a raw select-attribute option ID — resolve it against the
    attribute's own option list, same as brand names are resolved from
    their raw IDs elsewhere. Cached hard: this attribute's option list is
    catalog metadata that essentially never changes between deploys. */
interface BikeTyreTypeMetadataResponse {
  customAttributeMetadataV2?: {
    items?: Array<{ code?: string; options?: Array<{ label?: string; value?: string }> }>;
  };
}

async function resolveBikeTyreType(id: string, store?: string): Promise<string | undefined> {
  const r = await magentoFetch<BikeTyreTypeMetadataResponse>(
    BIKE_TYRE_TYPE_METADATA_QUERY,
    undefined,
    { store, revalidate: 86400 },
  );
  if (!r.ok || r.errors?.length) return undefined;
  const options = r.data?.customAttributeMetadataV2?.items?.[0]?.options ?? [];
  return options.find((o) => o.value === id)?.label ?? undefined;
}

/** Single product detail by SKU or url_key (PDP). */
export async function getProductDetail(params: {
  sku?: string;
  urlKey?: string;
  store?: string;
}): Promise<ProductDetailResult> {
  const query = params.urlKey ? PRODUCT_DETAIL_BY_URLKEY_QUERY : PRODUCT_DETAIL_QUERY;
  const variables = params.urlKey ? { urlKey: params.urlKey } : { sku: params.sku };

  const r = await magentoFetch<GqlProductDetailResponse["data"]>(
    query,
    variables,
    { store: params.store, revalidate: APP_CONFIG.cache.products },
  );

  if (!r.ok || r.errors?.length) {
    return { ok: r.ok, status: r.ok ? 200 : r.status, product: null, error: firstError(r) };
  }

  const product = parseProductDetail({ data: r.data } as GqlProductDetailResponse);
  if (!product) {
    return { ok: true, status: 404, product: null, error: "Product not found" };
  }

  if (product.bikeTyreTypeId) {
    product.bikeTyreType = await resolveBikeTyreType(product.bikeTyreTypeId, params.store);
  }

  return { ok: true, status: 200, product };
}
