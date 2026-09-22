/** Internal route builders — always include locale prefix for [locale] pages */

export const ROUTES = {
  home:      () => "/",
  tyres:     () => "/tyres",
  brand:     (slug = "") => `/tyres/brand/${slug}`,
  evTires:   () => "/ev-tires",
  runFlat:   () => "/run-flat-tires",
  category:  (slug = "") => `/${slug}`,
  product:   (urlKey = "") => `/product/${urlKey}`,
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
  /* No heroTitle here — "tyres" is a real Magento category (uid MTg=)
     with its own real category_page_title ("Buy All Types of Tyres
     Online in UAE"), so a hardcoded string here would shadow it exactly
     like the car-battery bug documented below (CategoryPageInner's
     displayTitle checks heroTitle before the real category_page_title).
     showTyreFinder is a real UI-behaviour flag, not content, so it stays. */
  "tyres": {
    showTyreFinder: true,
  },
  /* No "on-road-tires" / "off-road-tires-4x4" entries — removed. Magento has
     no real attribute distinguishing on-road from off-road/4x4 tyres, and the
     product filter for these was never actually wired (see git history /
     app/api/category-page/route.ts), so both pages silently rendered the
     entire unfiltered Tyres catalog under a misleading curated title. Both
     slugs now redirect to the real root "tyres" category instead. */
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
