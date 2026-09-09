import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import CategoryPageInner from "@/components/category/CategoryPageInner";
import EvTyresLanding from "@/components/ev/EvTyresLanding";
import CmsCarousel from "@/components/CmsCarousel";
import { resolveRoute } from "@/lib/services/route.service";
import { getCmsPage } from "@/lib/services/cms.service";
import { getCategoryMeta } from "@/lib/services/category.service";
import { CATEGORY_HERO } from "@/src/config/routes";
import { storeCode, t, type Locale } from "@/lib/i18n";
import { APP_CONFIG } from "@/src/config/app-config";
import JsonLd from "@/components/JsonLd";

const SITE_URL = `https://${APP_CONFIG.brand.domain}`;

export const revalidate = 300;

interface PageProps {
  params: { locale: string; slug: string | string[] };
}

function asLocale(l?: string): Locale {
  return l === "ar" ? "ar" : "en";
}

function toSlug(s: string | string[]): string {
  return Array.isArray(s) ? s.join("/") : s;
}

const LISTING_SLUGS = new Set([
  "tyres",
  "electric-vehicle-tyres-uae",
  "ev-tyres",
  "ev-tires",
  "run-flat-tires",
  "on-road-tires",
  "off-road-tires-4x4",
]);

const EV_SLUGS = new Set(["electric-vehicle-tyres-uae", "ev-tyres", "ev-tires"]);

/* ── SEO: resolved per entity, straight from Magento ──────────────── */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = asLocale(params.locale);
  const slug = toSlug(params.slug);
  const store = storeCode(locale);
  const canonical = `/${locale}/${slug}`;
  const languages = { en: `/en/${slug}`, ar: `/ar/${slug}` };

  if (LISTING_SLUGS.has(slug)) {
    const hero = CATEGORY_HERO[slug] ?? {};
    const title = hero.heroTitle ?? "Buy Car Tyres Online in UAE";
    return {
      title,
      description: "Shop premium tyres in UAE with free mobile fitting, warranty, and best prices.",
      alternates: { canonical, languages },
      openGraph: { title, type: "website" },
    };
  }

  const route = await resolveRoute(slug, store);
  if (!route) return { title: slug, alternates: { canonical, languages } };

  if (route.type === "CMS_PAGE") {
    const page = await getCmsPage(route.identifier ?? slug, store);
    const title = page?.meta_title || page?.title || route.title || slug;
    return {
      title,
      description: page?.meta_description || undefined,
      keywords: page?.meta_keywords || undefined,
      alternates: { canonical, languages },
      openGraph: { title, type: "article" },
    };
  }

  if (route.type === "CATEGORY") {
    const meta = await getCategoryMeta(route.url_key ?? slug, store);
    const title = meta?.metaTitle || meta?.name || route.name || slug;
    return {
      title,
      description: meta?.metaDescription || undefined,
      alternates: { canonical, languages },
      openGraph: { title, type: "website" },
    };
  }

  // PRODUCT (redirected below) or unknown — still give a sane canonical.
  return { title: route.name || slug, alternates: { canonical, languages } };
}

/* ── Dynamic entity rendering ─────────────────────────────────────── */
export default async function DynamicSlugPage({ params }: PageProps) {
  const locale = asLocale(params.locale);
  const slug = toSlug(params.slug);
  const store = storeCode(locale);

  // Special listing categories (e.g. EV tyres, run-flat, on-road, off-road)
  if (LISTING_SLUGS.has(slug)) {
    const hero = CATEGORY_HERO[slug] ?? {};
    const breadcrumbTitle = hero.heroTitle ?? slug;
    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/${locale}` },
        { "@type": "ListItem", position: 2, name: breadcrumbTitle, item: `${SITE_URL}/${locale}/${slug}` },
      ],
    };
    return (
      <>
        <JsonLd data={breadcrumbJsonLd} />
        <Suspense
          fallback={
            <div className="container py-20 text-center text-gray-400 animate-pulse">
              {t(locale, "common.loading")}
            </div>
          }
        >
          <CategoryPageInner
            urlKey={slug}
            locale={locale}
            heroTitle={hero.heroTitle}
            showTyreFinder={hero.showTyreFinder}
          />
        </Suspense>
        {/* Magento's real EV Tyres CMS page (electric-vehicle-tyres-uae)
            renders a broken custom template — see EvTyresLanding.tsx — so
            this supplementary section is original copy, not Magento
            content. Shown after the real, live-data product grid above,
            only for the EV slugs. */}
        {EV_SLUGS.has(slug) && <EvTyresLanding />}
      </>
    );
  }

  const route = await resolveRoute(slug, store);
  if (!route) notFound();

  // Product URLs resolve to the canonical product route.
  if (route.type === "PRODUCT" && route.url_key) {
    redirect(`/${locale}/product/${route.url_key}`);
  }

  // CMS pages are server-rendered (SSR content + real metadata above).
  if (route.type === "CMS_PAGE") {
    const page = await getCmsPage(route.identifier ?? slug, store);
    if (!page) notFound();
    const isAr = locale === "ar";
    /* Magento's Page Builder wraps raw-HTML blocks HTML-entity-encoded
       (its editor needs the markup as text) — `&lt;div class="..."&gt;`
       instead of `<div class="...">`. The old PHP theme decoded this
       before rendering; this route didn't, so the tags showed up as
       literal visible text instead of real elements. Same fix already
       applied to category descriptions in CategoryPageInner.tsx. */
    /* This content's own <img> src/href attributes are root-relative
       ("/media/images/services/...") — correct on the Magento-served page
       itself, but resolved against OUR origin here, where they 404. Rewrite
       them to the public storefront domain (SITE_URL, not the GraphQL
       endpoint's host) — MAGENTO_GRAPHQL_URL points at the www1 staging
       backend, which sits behind HTTP basic auth even for media files;
       the public www domain serves the same media with no auth needed. */
    const decodedContent = page.content
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&").replace(/\\"/g, '"')
      .replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n")
      .replace(/((?:src|href))="\/media\//g, `$1="${SITE_URL}/media/`);
    return (
      <main dir={isAr ? "rtl" : "ltr"} className="bg-white">
        {/* Same hero banner treatment as category pages (page-title-wrapper /
            bg-cover-image in app/globals.css) — the CMS branch never used it
            before, so these pages had no title banner at all. */}
        <div className="page-title-wrapper bg-cover-image">
          <div className="container">
            <div className="title">
              <h1 id="page-title-heading">
                <span className="base" data-ui-id="page-title-wrapper">
                  {page.title}
                </span>
              </h1>
            </div>
          </div>
        </div>

        <div className="bg-white border-b border-gray-100">
          <div className="container py-2.5">
            <nav className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap font-medium">
              <a href={`/${locale}`} className="hover:text-black transition-colors">
                {t(locale, "common.home")}
              </a>
              <span>/</span>
              <span className="text-black">{page.title}</span>
            </nav>
          </div>
        </div>

        <div className="container py-10 lg:py-14">
          {/* .cms-content (app/globals.css) is the site's real styling for
              Magento-authored HTML — the same class CategorySeoSection.tsx
              uses for category descriptions, extended here to also cover
              the legacy Bootstrap grid/utility classes this content is
              authored in (row/col-xl-6/card/offer-box/carousel/etc.),
              scoped so none of it can leak into or collide with the rest
              of the site's own styling. */}
          <div className="cms-content" dangerouslySetInnerHTML={{ __html: decodedContent }} />
          <CmsCarousel />
        </div>
      </main>
    );
  }

  // Categories render the client listing component (filters / sort / paging).
  if (route.type === "CATEGORY") {
    const urlKey = route.url_key ?? slug;
    const hero = CATEGORY_HERO[urlKey] ?? {};
    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/${locale}` },
        { "@type": "ListItem", position: 2, name: route.name ?? urlKey, item: `${SITE_URL}/${locale}/${urlKey}` },
      ],
    };
    return (
      <>
        <JsonLd data={breadcrumbJsonLd} />
        <Suspense
          fallback={
            <div className="container py-20 text-center text-gray-400 animate-pulse">
              {t(locale, "common.loading")}
            </div>
          }
        >
          <CategoryPageInner
            urlKey={urlKey}
            locale={locale}
            heroTitle={hero.heroTitle}
            showTyreFinder={hero.showTyreFinder}
          />
        </Suspense>
      </>
    );
  }

  notFound();
}
