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
    name:     "TyresWorld",
    tagline:  "Buy Tyres Online in UAE",
    domain:   "www.tyresworld.ae",
    logoPath: "/logo/tires-logo.png",
  },

  contact: {
    whatsapp: "971505069575",
    phone:    "+971 50 506 9575",
    email:    "sales@tyresworld.ae",
    /** Trading entity behind the storefront, as shown in the footer. */
    company:  "Carolyn Auto Care - L.L.C - S.P.C",
    address:  "Al Hzm - 51st St - Al Shawamekh - Abu Dhabi - United Arab Emirates",
    mapsUrl:  "https://maps.app.goo.gl/2KZa38iBJD78JgdL9",
  },

  wheel: {
    /** Wheel API endpoint — user_key is appended as a URL query param, never a header */
    graphqlUrl: process.env.WHEEL_API_URL  ?? "https://wheel-api.klever.ae/graphql.php",
    // No key literal in source — set WHEEL_USER_KEY in .env.local (see .env.local.example).
    userKey:    process.env.WHEEL_USER_KEY ?? "",
  },

  magento: {
    graphqlUrl: process.env.MAGENTO_GRAPHQL_URL ?? "https://www1.tyresworld.ae/graphql",
    /** Magento store view codes keyed by locale */
    storeViews: {
      en: "default",
      ar: "ar",
    } as Record<string, string>,
    /** Root UID for the "All Tyres" category — base64("18") */
    tyresCategoryUid: "MTg=",
  },

  /** Root category UID for "All Products" */
  rootCategoryUid: "Mg==",

  /** Homepage merchandising config — the single place to change featured tabs. */
  homepage: {
    /** Category tabs on the homepage FeaturedProducts section (Magento category UIDs). */
    featuredCategories: [
      { id: "All",        label: "All",            uid: "Mg==" },
      { id: "Tyres",      label: "Tyres",          uid: "MTg=" },
      { id: "Motorcycle", label: "Motorcycle",     uid: "MTExNg==" },
      { id: "Wheels",     label: "Wheels",         uid: "MTExNw==" },
      { id: "Battery",    label: "Battery",        uid: "MTExOA==" },
      { id: "Rims",       label: "Rim Protectors", uid: "MTM0NQ==" },
    ],
  },

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
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };
  if (locale) h["Store"] = storeView(locale);
  if (process.env.GRAPHQL_USERNAME && process.env.GRAPHQL_PASSWORD) {
    const creds = Buffer.from(`${process.env.GRAPHQL_USERNAME}:${process.env.GRAPHQL_PASSWORD}`).toString("base64");
    h["Authorization"] = `Basic ${creds}`;
  }
  return h;
}
