/** Internal route builders — always include locale prefix for [locale] pages */

export const ROUTES = {
  home:      (locale = "en") => `/${locale}`,
  tyres:     (locale = "en") => `/${locale}/tyres`,
  onRoad:    (locale = "en") => `/${locale}/on-road-tires`,
  offRoad:   (locale = "en") => `/${locale}/off-road-tires-4x4`,
  evTires:   (locale = "en") => `/${locale}/ev-tires`,
  runFlat:   (locale = "en") => `/${locale}/run-flat-tires`,
  category:  (locale = "en", slug: string) => `/${locale}/${slug}`,
  product:   (locale = "en", urlKey: string) => `/${locale}/product/${urlKey}`,
  shop:      () => "/shop",
  cart:      () => "/cart",
  checkout:  () => "/checkout",
  account:   () => "/account",
  about:     () => "/about",
  contact:   () => "/contact",
} as const;

/**
 * Presentation overrides for specific category url_keys, applied by the
 * dynamic [locale]/[slug] route. This is curated copy only — routing and
 * product/SEO data are resolved dynamically from Magento. Any category not
 * listed here still renders via the same dynamic route with its Magento name.
 */
export interface CategoryHero {
  heroTitle?: string;
  showTyreFinder?: boolean;
}

export const CATEGORY_HERO: Record<string, CategoryHero> = {
  "tyres": {
    heroTitle: "Buy Car Tyres Online in UAE – Premium Quality, Great Prices",
    showTyreFinder: true,
  },
  "on-road-tires": {
    heroTitle: "Buy On-Road Car Tyres Online in the UAE",
    showTyreFinder: true,
  },
  "off-road-tires-4x4": {
    heroTitle: "Buy Off-Road & 4x4 Tyres Online in the UAE",
    showTyreFinder: true,
  },
  "electric-vehicle-tyres-uae": {
    heroTitle: "Electric Vehicle Tyres in UAE",
    showTyreFinder: false,
  },
  "ev-tires": {
    heroTitle: "Electric Vehicle Tyres in UAE",
    showTyreFinder: false,
  },
  "ev-tyres": {
    heroTitle: "Electric Vehicle Tyres in UAE",
    showTyreFinder: false,
  },
  "run-flat-tires": {
    heroTitle: "Buy Run-Flat Tyres Online in the UAE",
    showTyreFinder: true,
  },
  /* No "car-battery" entry — that's a real Magento category (id 1118), so
     its H1 correctly comes from the live category_page_title field
     ("Buy Car Battery Online in UAE") via CategoryPageInner's displayTitle
     fallback, not a hardcoded override. An override here previously shadowed
     that real data with the wrong page's title ("Car Battery Replacement",
     which belongs to the separate car-battery-replacement CMS page).
     "car-battery-replacement" doesn't need an entry either — it's a CMS
     page, rendered by the [...slug] route's CMS branch, which takes its H1
     from Magento's own page.title field directly, not from this map. */
};
