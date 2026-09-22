import enDict from "../public/locales/compiled-en.json";

/** English-only storefront — kept as a type so existing call sites
    (27 of them) don't need touching. */
export type Locale = "en";

const dicts: Record<Locale, Record<string, string>> = {
  en: enDict as unknown as Record<string, string>,
};

/**
 * Look up a translation key. Falls back to the raw key if nothing is found.
 */
export function t(locale: Locale, key: string): string {
  return dicts.en[key] ?? key;
}

/** Format a products count string using the English template. */
export function productsCount(locale: Locale, n: number): string {
  const pattern = t(locale, "listing.productsCount");
  return pattern.replace("{n}", n.toLocaleString("en-US"));
}

/** Magento store view code — always the default (English) store. */
export function storeCode(locale: Locale): string {
  return "default";
}
