/* ─────────────────────────────────────────────────────────────────
   CATEGORY SERVICE
   Fetches a category's products (with attribute filters + sort) plus
   the category's own metadata (name, description, SEO fields).
───────────────────────────────────────────────────────────────── */
import { magentoFetch } from "@/lib/graphql/client";
import { CATEGORY_PRODUCTS_BY_UID_QUERY } from "@/lib/queries";
import { parseGraphqlResponse, type GqlProductsResponse } from "@/lib/magento";
import { APP_CONFIG } from "@/src/config/app-config";
import type { Product } from "@/lib/data";

export type SortInput = Record<string, "ASC" | "DESC">;

export interface CategoryMeta {
  uid: string;
  name: string;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  urlKey: string;
}

export interface CategoryProductsResult {
  ok: boolean;
  status: number;
  category: CategoryMeta | null;
  products: Product[];
  total: number;
  totalPages: number;
  currentPage: number;
  error?: string;
}

interface CategoryQueryData {
  categories?: { items?: Array<Record<string, unknown>> } | null;
  products?: {
    total_count?: number;
    page_info?: { total_pages?: number; current_page?: number };
    items?: unknown[];
  } | null;
}

export async function getCategoryProducts(params: {
  categoryUid: string;
  filters: Record<string, unknown>;
  sort?: SortInput;
  pageSize?: number;
  currentPage?: number;
  store?: string;
}): Promise<CategoryProductsResult> {
  const pageSize = params.pageSize ?? 12;
  const currentPage = params.currentPage ?? 1;

  const variables: Record<string, unknown> = {
    uid: params.categoryUid,
    filters: params.filters,
    pageSize,
    currentPage,
  };
  if (params.sort) variables.sort = params.sort;

  const r = await magentoFetch<CategoryQueryData>(
    CATEGORY_PRODUCTS_BY_UID_QUERY,
    variables,
    { store: params.store, revalidate: APP_CONFIG.cache.category },
  );

  // HTTP failure with no payload → propagate status.
  if (!r.ok && !r.data) {
    return { ok: false, status: r.status, category: null, products: [], total: 0, totalPages: 1, currentPage, error: r.errors?.[0]?.message ?? `HTTP ${r.status}` };
  }
  // Magento returned null data (query rejected) → empty, 200.
  if (r.data === null) {
    const msg = r.errors?.[0]?.message ?? "Magento query failed";
    console.error("[category.service] Magento returned null data:", msg);
    return { ok: true, status: 200, category: null, products: [], total: 0, totalPages: 1, currentPage, error: msg };
  }
  if (r.errors?.length) {
    console.warn("[category.service] GraphQL warnings:", r.errors.map((e) => e.message));
  }

  const cat = (r.data?.categories?.items?.[0] ?? null) as Record<string, unknown> | null;
  const pd = r.data?.products;
  const products = parseGraphqlResponse({ data: r.data } as unknown as GqlProductsResponse);

  return {
    ok: true,
    status: 200,
    category: cat
      ? {
          uid: String(cat.uid ?? ""),
          name: String(cat.name ?? ""),
          description: (cat.description as string) ?? null,
          metaTitle: (cat.meta_title as string) ?? null,
          metaDescription: (cat.meta_description as string) ?? null,
          urlKey: String(cat.url_key ?? ""),
        }
      : null,
    products,
    total: pd?.total_count ?? products.length,
    totalPages: pd?.page_info?.total_pages ?? 1,
    currentPage: pd?.page_info?.current_page ?? currentPage,
  };
}
