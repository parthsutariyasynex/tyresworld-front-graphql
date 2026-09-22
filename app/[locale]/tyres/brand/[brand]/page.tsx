import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import CategoryPageInner from "@/components/category/CategoryPageInner";
import { getBrands, type KleverBrandItem } from "@/lib/services/brands.service";
import { storeCode, type Locale } from "@/lib/i18n";
import { APP_CONFIG } from "@/src/config/app-config";
import JsonLd from "@/components/JsonLd";
import { buildBrandSlug } from "@/lib/filterBuilder";

const SITE_URL = `https://${APP_CONFIG.brand.domain}`;

export const revalidate = 300;

interface BrandPageProps {
  params: {
    locale?: string;
    brand: string;
  };
}

/**
 * Dynamically resolves a URL slug back to the real Magento brand entity.
 * Uses the live brand directory from Magento API (kleverBrands) — no hardcoded mappings.
 */
async function resolveBrand(
  slug: string,
  store?: string,
): Promise<KleverBrandItem | null> {
  if (!slug) return null;
  const cleanSlug = slug.trim().toLowerCase();

  // Fetch all live brands from Magento API
  const brands = await getBrands({ store });
  if (!brands || brands.length === 0) return null;

  // Match by exact url_key, slugified brand name, or normalized alphanumeric name
  return (
    brands.find((b) => {
      const uKey = (b.url_key || "").trim().toLowerCase();
      if (uKey && uKey === cleanSlug) return true;

      const rawName = (b.name || "").trim().toLowerCase();
      const nameSlug = rawName.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      if (nameSlug && nameSlug === cleanSlug) return true;

      const nameSimple = rawName.replace(/[^a-z0-9]/g, "");
      const slugSimple = cleanSlug.replace(/[^a-z0-9]/g, "");
      return nameSimple.length > 0 && nameSimple === slugSimple;
    }) ?? null
  );
}

/**
 * Generate SEO Metadata dynamically from real Magento brand data.
 */
export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const locale: Locale = "en";
  const store = storeCode(locale);
  const brandSlug = params.brand;
  const brand = await resolveBrand(brandSlug, store);

  if (!brand || !brand.name) {
    return {
      title: "Brand Not Found | TyresWorld",
      robots: { index: false, follow: false },
    };
  }

  const brandName = brand.name.trim();
  const canonicalSlug = (brand.url_key || buildBrandSlug(brand.name)).toLowerCase();
  const canonical = `/tyres/brand/${canonicalSlug}`;

  const title = `Buy ${brandName} Tyres Online in UAE | Best Price & Mobile Fitting - TyresWorld`;

  const description = `Shop genuine ${brandName} tyres online in UAE at TyresWorld. Free mobile tyre fitting in Dubai, Abu Dhabi & Sharjah, best prices, manufacturer warranty, and wide range of sizes.`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `/tyres/brand/${canonicalSlug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}${canonical}`,
      images: brand.image
        ? [
            {
              url: brand.image,
              alt: `${brandName} Tyres UAE`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: brand.image ? [brand.image] : undefined,
    },
  };
}

/**
 * Dynamic SEO Brand Page: /tyres/brand/[brand]
 */
export default async function BrandPage({ params }: BrandPageProps) {
  const locale: Locale = "en";
  const store = storeCode(locale);
  const brandSlug = params.brand;
  const brand = await resolveBrand(brandSlug, store);

  // Return 404 if brand doesn't exist in Magento
  if (!brand || !brand.name) {
    notFound();
  }

  const brandName = brand.name.trim();
  const canonicalSlug = (brand.url_key || buildBrandSlug(brand.name)).toLowerCase();

  // If the URL slug does not match the canonical slug, 308/307 redirect to canonical
  if (brandSlug.toLowerCase() !== canonicalSlug) {
    redirect(`/tyres/brand/${canonicalSlug}`);
  }

  const heroTitle = `${brandName.toUpperCase()} TYRES`;
  const basePath = `/tyres/brand/${canonicalSlug}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tyres",
        item: `${SITE_URL}/tyres`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Brands",
        item: `${SITE_URL}/brands`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: brandName,
        item: `${SITE_URL}${basePath}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <Suspense
        fallback={
          <div className="container py-20 text-center text-gray-400 animate-pulse">
            Loading products...
          </div>
        }
      >
        <CategoryPageInner
          urlKey="tyres"
          locale={locale}
          heroTitle={heroTitle}
          showTyreFinder={true}
          basePath={basePath}
          brandFilter={brandName}
          brandLogo={brand.image ?? undefined}
          brandDescription={brand.description}
        />
      </Suspense>
    </>
  );
}
