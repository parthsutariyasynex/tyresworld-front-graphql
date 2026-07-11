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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      </head>
      <body className="antialiased">
        <LocaleDirectionSetter />
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
      </body>
    </html>
  );
}
