if (typeof window === "undefined") {
  try {
    const dns = eval("require")("dns");
    if (dns && typeof dns.setDefaultResultOrder === "function") {
      dns.setDefaultResultOrder("ipv4first");
    }
  } catch (e) {
    console.warn("Failed to set DNS result order to ipv4first:", e);
  }
}

export const APP_CONFIG = {
  brand: {
    name:     "PowerTyre",
    tagline:  "Click • Fit • Drive",
    domain:   "powertire.klever.ae",
    logoPath: "/logo/power tire-12.webp",
  },

  contact: {
    whatsapp: "966500000000",
    phone:    "+966 50 000 0000",
    email:    "info@powertyre.sa",
  },

  wheel: {
    /** Wheel API endpoint — user_key is appended as a URL query param, never a header */
    graphqlUrl: process.env.WHEEL_API_URL  ?? "https://wheel-api.klever.ae/graphql.php",
    userKey:    process.env.WHEEL_USER_KEY ?? "f9030340bff3fbffd0208256549f9984940fe536fec8ae7d8c2f1681b8ed3da2",
  },

  magento: {
    graphqlUrl: process.env.MAGENTO_GRAPHQL_URL ?? "https://powertire.klever.ae/graphql",
    /** Magento store view codes keyed by locale */
    storeViews: {
      en: "default",
      ar: "ar",
    } as Record<string, string>,
    /** Root UID for the "All Tyres" category — base64("18") */
    tyresCategoryUid: "MTg=",
  },

  /** Root category UID for "All Products" — used by /shop */
  rootCategoryUid: "Mg==",

  pagination: {
    defaultPageSize: 12,
    maxPageSize:     48,
  },

  /** Cache TTL in seconds for Next.js fetch revalidation */
  cache: {
    menu:     3600,
    products: 300,
    filters:  300,
    category: 300,
  },
} as const;

/** Resolve Magento store view code from locale string */
export function storeView(locale: string): string {
  return APP_CONFIG.magento.storeViews[locale] ?? "default";
}

/** Standard Magento GraphQL request headers */
export function magentoHeaders(locale?: string): HeadersInit {
  const h: Record<string, string> = {
    Accept:         "application/json",
    "Content-Type": "application/json",
  };
  if (locale) h["Store"] = storeView(locale);
  return h;
}
