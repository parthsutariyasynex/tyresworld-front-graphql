import type { MetadataRoute } from "next";
import { APP_CONFIG } from "@/src/config/app-config";
import {
  getSitemapCategoryPaths,
  getProductCount,
  getProductUrlKeys,
  PRODUCT_CHUNK_SIZE,
} from "@/lib/services/sitemap.service";

const BASE_URL = `https://${APP_CONFIG.brand.domain}`;

/** Static routes worth indexing. */
const STATIC_PATHS = ["", "about", "contact", "storelocator", "track-order"];

/** Refresh at most hourly. */
export const revalidate = 3600;

/**
 * Single sitemap covering static pages, top-level categories, and the full
 * product catalog — all sourced from Magento, English-only storefront.
 * Every URL is bare (no locale prefix): middleware rewrites the bare path
 * to /en internally, so these are already the real canonical URLs, not
 * ones that 308-redirect. The catalog (~6k products) stays well under the
 * 50k-URL sitemap limit, so no chunking is needed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categoryPaths, total] = await Promise.all([
    getSitemapCategoryPaths(),
    getProductCount(),
  ]);

  // Fetch all product pages in parallel and flatten to url_keys.
  const pageCount = Math.max(0, Math.ceil(total / PRODUCT_CHUNK_SIZE));
  const pages = await Promise.all(
    Array.from({ length: pageCount }, (_, i) => getProductUrlKeys(i + 1)),
  );
  const productKeys = pages.flat();

  const entries: MetadataRoute.Sitemap = [];

  for (const path of STATIC_PATHS) {
    entries.push({
      url: `${BASE_URL}${path ? `/${path}` : ""}`,
      changeFrequency: path === "" ? "daily" : "weekly",
      priority: path === "" ? 1 : 0.6,
    });
  }
  for (const catPath of categoryPaths) {
    entries.push({
      url: `${BASE_URL}/${catPath}`,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }
  for (const key of productKeys) {
    entries.push({
      url: `${BASE_URL}/product/${key}`,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}
