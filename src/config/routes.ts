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

/** Category URL keys that have dedicated PageInner components */
export const KNOWN_CATEGORY_KEYS = [
  "tyres",
  "on-road-tires",
  "off-road-tires-4x4",
  "ev-tires",
  "run-flat-tires",
] as const;

export type KnownCategoryKey = (typeof KNOWN_CATEGORY_KEYS)[number];
