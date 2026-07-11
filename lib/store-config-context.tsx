"use client";
/* ─────────────────────────────────────────────────────────────────
   STORE CONFIG CONTEXT
   Makes the Magento store config (currency, name, …) available to any
   Client Component. The value is fetched server-side in the root layout
   and passed down, so there is no client-side request and no flash.
───────────────────────────────────────────────────────────────── */
import { createContext, useContext } from "react";
import type { StoreConfig } from "@/lib/services/store.service";

/** Mirror of DEFAULT_STORE_CONFIG (type-only import keeps this file client-safe). */
const FALLBACK: StoreConfig = {
  storeCode: "default",
  storeName: "PowerTyre",
  locale: "en_SA",
  currencyCode: "SAR",
  baseCurrencyCode: "SAR",
  countryId: "SA",
  rootCategoryUid: "",
  copyright: "",
};

const StoreConfigContext = createContext<StoreConfig>(FALLBACK);

export function StoreConfigProvider({
  value,
  children,
}: {
  value: StoreConfig;
  children: React.ReactNode;
}) {
  return <StoreConfigContext.Provider value={value}>{children}</StoreConfigContext.Provider>;
}

export function useStoreConfig(): StoreConfig {
  return useContext(StoreConfigContext);
}

/** Convenience: the shopper-facing currency code. */
export function useCurrencyCode(): string {
  return useContext(StoreConfigContext).currencyCode;
}
