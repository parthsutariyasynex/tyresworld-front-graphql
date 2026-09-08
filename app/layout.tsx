import { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingContact from "@/components/FloatingContact";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import { CompareProvider } from "@/lib/compare-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import CartAuthSync from "@/components/CartAuthSync";
import LocaleDirectionSetter from "@/components/LocaleDirectionSetter";
import { StoreConfigProvider } from "@/lib/store-config-context";
import { DriverReviewsProvider } from "@/lib/driver-reviews-context";
import { getStoreConfig } from "@/lib/services/store.service";
import { APP_CONFIG } from "@/src/config/app-config";
import JsonLd from "@/components/JsonLd";

const SITE_URL = `https://${APP_CONFIG.brand.domain}`;

/* Built from APP_CONFIG.brand so the store name lives in exactly one place —
   it used to be spelled out here separately and drifted out of date. */
const BRAND = APP_CONFIG.brand.name;
const SITE_TITLE = `${BRAND} — Premium Tyres & Fitting Across the UAE`;
const SITE_DESCRIPTION =
  "Premium car, SUV, and performance tyres at the best prices online in the UAE, " +
  "fitted by our partner installers. Shop Michelin, Continental, Bridgestone, " +
  "Pirelli and more.";

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: `%s | ${BRAND}`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: [
      { url: "/img/favicon.png", type: "image/png" },
      { url: "/img/favicon.ico", type: "image/x-icon" }
    ],
    shortcut: "/img/favicon.ico",
    apple: "/img/favicon.png",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: BRAND,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeConfig = await getStoreConfig();

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: storeConfig.storeName,
    url: SITE_URL,
    logo: `${SITE_URL}${APP_CONFIG.brand.logoPath}`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: APP_CONFIG.contact.phone,
      email: APP_CONFIG.contact.email,
      contactType: "customer service",
    },
  };
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: storeConfig.storeName,
    url: SITE_URL,
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          /* Cairo carries Arabic, Kanit provides full hinted weights for Latin */
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Kanit:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap"
          rel="stylesheet"
        />
        <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
      </head>
      <body className="antialiased">
        <LocaleDirectionSetter />
        <StoreConfigProvider value={storeConfig}>
          <AuthProvider>
            <CartProvider>
              <CompareProvider>
                <WishlistProvider>
                  <DriverReviewsProvider>
                    <CartAuthSync />
                    <Suspense fallback={null}>
                      <Header />
                    </Suspense>
                    <main>{children}</main>
                    <Footer />
                    <FloatingContact />
                  </DriverReviewsProvider>
                </WishlistProvider>
              </CompareProvider>
            </CartProvider>
          </AuthProvider>
        </StoreConfigProvider>
      </body>
    </html>
  );
}
