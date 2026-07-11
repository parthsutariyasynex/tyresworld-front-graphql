import type { Metadata } from "next";
import { APP_CONFIG } from "./app-config";

export const DEFAULT_SEO: Metadata = {
  metadataBase: new URL(`https://${APP_CONFIG.brand.domain}`),
  title: {
    default:  `${APP_CONFIG.brand.name} — Buy Tyres Online in Saudi Arabia`,
    template: `%s | ${APP_CONFIG.brand.name}`,
  },
  description:
    "Shop premium car tyres online in Saudi Arabia. Fast fitting, best brands — Michelin, Bridgestone, Pirelli, Continental and more. Delivery & fitting across KSA.",
  keywords: ["tyres", "car tyres", "buy tyres online", "Saudi Arabia", "KSA", "tyre fitting"],
  openGraph: {
    type:       "website",
    siteName:   APP_CONFIG.brand.name,
    locale:     "en_SA",
    images:     [{ url: "/og-default.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index:  true,
    follow: true,
  },
};

/** Build page-level metadata from Magento category data */
export function categoryMeta(opts: {
  name:            string;
  metaTitle?:      string | null;
  metaDescription?: string | null;
  locale?:         string;
}): Metadata {
  const title = opts.metaTitle ?? `${opts.name} — Buy Online in Saudi Arabia`;
  const description =
    opts.metaDescription ??
    `Shop ${opts.name} online in Saudi Arabia. Best prices, fast fitting, top brands. Order now at ${APP_CONFIG.brand.name}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      locale: opts.locale === "ar" ? "ar_SA" : "en_SA",
    },
  };
}
