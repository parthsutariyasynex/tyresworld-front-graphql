/* ─────────────────────────────────────────────────────────────────
   STORE SERVICE
   Single source of truth for store-level config (currency, name,
   locale, country, root category) — resolved from Magento so changing
   the store's currency/name in Admin reflects with no code change.
───────────────────────────────────────────────────────────────── */
import { magentoFetch } from "@/lib/graphql/client";
import { STORE_CONFIG_QUERY } from "@/lib/queries";

export interface StoreConfig {
  storeCode: string;
  storeName: string;
  locale: string;
  /** Currency shown to shoppers (display currency, falls back to base). */
  currencyCode: string;
  baseCurrencyCode: string;
  countryId: string;
  rootCategoryUid: string;
  copyright: string;
}

/**
 * Last-resort defaults used only when Magento is unreachable, so the UI
 * never renders an empty currency/name. NOT the primary source.
 */
export const DEFAULT_STORE_CONFIG: StoreConfig = {
  storeCode: "default",
  storeName: "TyresWorld",
  locale: "en_SA",
  currencyCode: "SAR",
  baseCurrencyCode: "SAR",
  countryId: "SA",
  rootCategoryUid: "",
  copyright: "",
};

export async function getStoreConfig(store?: string): Promise<StoreConfig> {
  const r = await magentoFetch<{ storeConfig?: Record<string, unknown> | null }>(
    STORE_CONFIG_QUERY,
    undefined,
    { store, revalidate: 3600 },
  );
  const c = r.data?.storeConfig;
  if (!c) return DEFAULT_STORE_CONFIG;

  return {
    storeCode: String(c.store_code ?? DEFAULT_STORE_CONFIG.storeCode),
    storeName: String(c.store_name ?? DEFAULT_STORE_CONFIG.storeName),
    locale: String(c.locale ?? DEFAULT_STORE_CONFIG.locale),
    currencyCode: String(
      c.default_display_currency_code ?? c.base_currency_code ?? DEFAULT_STORE_CONFIG.currencyCode,
    ),
    baseCurrencyCode: String(c.base_currency_code ?? DEFAULT_STORE_CONFIG.baseCurrencyCode),
    // default_country_id is not exposed by this store's schema; keep the default.
    countryId: DEFAULT_STORE_CONFIG.countryId,
    rootCategoryUid: String(c.root_category_uid ?? DEFAULT_STORE_CONFIG.rootCategoryUid),
    copyright: String(c.copyright ?? DEFAULT_STORE_CONFIG.copyright),
  };
}
