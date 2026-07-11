import { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingContact from "@/components/FloatingContact";
import FloatingGoogleReviews from "@/components/FloatingGoogleReviews";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import { CompareProvider } from "@/lib/compare-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import CartAuthSync from "@/components/CartAuthSync";
import LocaleDirectionSetter from "@/components/LocaleDirectionSetter";
import { StoreConfigProvider } from "@/lib/store-config-context";
import { getStoreConfig } from "@/lib/services/store.service";
import { APP_CONFIG } from "@/src/config/app-config";
import JsonLd from "@/components/JsonLd";

const SITE_URL = `https://${APP_CONFIG.brand.domain}`;

export const metadata: Metadata = {
  title: {
    default: "PowerTyre — Premium Tyres & Doorstep Fitting",
    template: "%s | PowerTyre",
  },
  description:
    "Premium car, SUV, and performance tyres delivered and fitted at your doorstep. Shop Michelin, Continental, Bridgestone and more.",
  icons: {
    icon: [
      { url: "/img/favicon.png", type: "image/png" },
      { url: "/img/favicon.ico", type: "image/x-icon" }
    ],
    shortcut: "/img/favicon.ico",
    apple: "/img/favicon.png",
  },
  openGraph: {
    title: "PowerTyre — Premium Tyres & Doorstep Fitting",
    description:
      "Premium car, SUV, and performance tyres delivered and fitted at your doorstep. Shop Michelin, Continental, Bridgestone and more.",
    type: "website",
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Cairo:wght@400;500;600;700;800&display=swap"
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
                  <CartAuthSync />
                  <Suspense fallback={null}>
                    <Header />
                  </Suspense>
                  <main>{children}</main>
                  <Footer />
                  <FloatingContact />
                  <FloatingGoogleReviews />
                </WishlistProvider>
              </CompareProvider>
            </CartProvider>
          </AuthProvider>
        </StoreConfigProvider>
      </body>
    </html>
  );
}
