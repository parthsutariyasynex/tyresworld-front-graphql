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
  heroTitleAr?: string;
  showTyreFinder?: boolean;
}

export const CATEGORY_HERO: Record<string, CategoryHero> = {
  "tyres": {
    heroTitle: "Buy Car Tyres Online in UAE – Premium Quality, Great Prices",
    heroTitleAr: "اشترِ إطارات السيارات عبر الإنترنت في الإمارات – جودة ممتازة وأسعار رائعة",
    showTyreFinder: true,
  },
  "on-road-tires": {
    heroTitle: "Buy On-Road Car Tyres Online in the UAE",
    heroTitleAr: "اشترِ إطارات الطريق عبر الإنترنت في الإمارات",
    showTyreFinder: true,
  },
  "off-road-tires-4x4": {
    heroTitle: "Buy Off-Road & 4x4 Tyres Online in the UAE",
    heroTitleAr: "اشترِ إطارات الطرق الوعرة و4×4 عبر الإنترنت في الإمارات",
    showTyreFinder: true,
  },
  "ev-tires": {
    heroTitle: "Buy EV Tyres Online in the UAE",
    heroTitleAr: "اشترِ إطارات السيارات الكهربائية عبر الإنترنت في الإمارات",
    showTyreFinder: true,
  },
  "run-flat-tires": {
    heroTitle: "Buy Run-Flat Tyres Online in the UAE",
    heroTitleAr: "اشترِ إطارات رن فلات عبر الإنترنت في الإمارات",
    showTyreFinder: true,
  },
  "car-battery": {
    heroTitle: "Buy Car Batteries Online in the UAE",
    heroTitleAr: "اشترِ بطاريات السيارات عبر الإنترنت في الإمارات",
    showTyreFinder: false,
  },
  "car-wheels": {
    heroTitle: "Buy Alloy Wheels & Rims Online in the UAE",
    heroTitleAr: "اشترِ جنوط وعجلات السيارات عبر الإنترنت في الإمارات",
    showTyreFinder: false,
  },
  "motorcycle-tyre": {
    heroTitle: "Buy Motorcycle Tyres Online in the UAE",
    heroTitleAr: "اشترِ إطارات الدراجات النارية عبر الإنترنت في الإمارات",
    showTyreFinder: false,
  },
};
