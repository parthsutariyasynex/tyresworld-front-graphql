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
    heroTitle: "SHOP ALL TYPES OF TYRES ONLINE ACROSS KSA",
    heroTitleAr: "تسوق جميع أنواع الإطارات عبر الإنترنت في المملكة العربية السعودية",
    showTyreFinder: true,
  },
  "on-road-tires": {
    heroTitle: "SHOP ON-ROAD TYRES ONLINE ACROSS KSA",
    heroTitleAr: "تسوق إطارات الطريق عبر الإنترنت في المملكة العربية السعودية",
    showTyreFinder: true,
  },
  "off-road-tires-4x4": {
    heroTitle: "SHOP OFF-ROAD & 4X4 TYRES ACROSS KSA",
    heroTitleAr: "تسوق إطارات الطرق الوعرة و4×4 في المملكة العربية السعودية",
    showTyreFinder: true,
  },
  "ev-tires": {
    heroTitle: "SHOP EV TYRES ONLINE ACROSS KSA",
    heroTitleAr: "تسوق إطارات السيارات الكهربائية عبر الإنترنت في المملكة العربية السعودية",
    showTyreFinder: true,
  },
  "run-flat-tires": {
    heroTitle: "SHOP RUN-FLAT TYRES ONLINE ACROSS KSA",
    heroTitleAr: "تسوق إطارات رن فلات عبر الإنترنت في المملكة العربية السعودية",
    showTyreFinder: true,
  },
};
