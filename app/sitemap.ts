import type { MetadataRoute } from "next";
import { APP_CONFIG } from "@/src/config/app-config";
import {
  getSitemapCategoryPaths,
  getProductCount,
  getProductUrlKeys,
  PRODUCT_CHUNK_SIZE,
} from "@/lib/services/sitemap.service";

const BASE_URL = `https://${APP_CONFIG.brand.domain}`;
const LOCALES = ["en", "ar"] as const;

/** Static routes worth indexing (per locale). */
const STATIC_PATHS = ["", "about", "contact", "storelocator", "track-order"];

/** Refresh at most hourly. */
export const revalidate = 3600;

/**
 * Single sitemap covering static pages, top-level categories, and the full
 * product catalog for every locale — all sourced from Magento. The catalog
 * (~6k products × locales) stays well under the 50k-URL sitemap limit, so no
 * chunking is needed.
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

  for (const locale of LOCALES) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${BASE_URL}/${locale}${path ? `/${path}` : ""}`,
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.6,
      });
    }
    for (const catPath of categoryPaths) {
      entries.push({
        url: `${BASE_URL}/${locale}/${catPath}`,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
    for (const key of productKeys) {
      entries.push({
        url: `${BASE_URL}/${locale}/product/${key}`,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
