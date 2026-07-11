import enDict from "../public/locales/compiled-en.json";
import arDict from "../public/locales/compiled-ar.json";

export type Locale = "en" | "ar";

const dicts: Record<Locale, Record<string, string>> = {
  en: enDict as unknown as Record<string, string>,
  ar: arDict as unknown as Record<string, string>,
};

/**
 * Look up a translation key for the given locale.
 * Falls back to English, then to the raw key if nothing is found.
 */
export function t(locale: Locale, key: string): string {
  return dicts[locale]?.[key] ?? dicts.en[key] ?? key;
}

/** Format a products count string using the locale-appropriate template. */
export function productsCount(locale: Locale, n: number): string {
  const pattern = t(locale, "listing.productsCount");
  return pattern.replace("{n}", n.toLocaleString(locale === "ar" ? "ar-SA" : "en-US"));
}

/** Magento store view code for a given locale. */
export function storeCode(locale: Locale): string {
  return locale === "ar" ? "ar" : "default";
}
