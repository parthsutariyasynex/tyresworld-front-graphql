import type { MetadataRoute } from "next";
import { APP_CONFIG } from "@/src/config/app-config";

const BASE_URL = `https://${APP_CONFIG.brand.domain}`;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep transactional / account pages out of the index.
      disallow: ["/api/", "/checkout", "/cart", "/account", "/*/checkout", "/*/cart", "/*/account"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
