import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import CategoryPageInner from "@/components/category/CategoryPageInner";
import EvTyresLanding from "@/components/ev/EvTyresLanding";
import CmsCarousel from "@/components/CmsCarousel";
import CmsAccordion from "@/components/CmsAccordion";
import CarBatteryReplacementLanding from "@/components/service/CarBatteryReplacementLanding";
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
       itself, but resolved against OUR origin here, where they 404. Route
       them through /api/media instead, which fetches from the staging
       origin server-side (with the Basic Auth header a plain <img> can't
       send) and streams the bytes back same-origin — see that route for
       why. (Previously rewritten to the public storefront domain, but not
       every CMS-referenced asset is actually synced there — e.g.
       /media/images/testimonials/author.png 404s on the public domain
       while it's a real file on staging — so that public-domain mirror
       can't be relied on to have everything CMS content links to.) */
    /* Some CMS pages (e.g. car-battery-replacement) are authored as a
       custom Magento .phtml block reference rather than Page Builder HTML.
       The GraphQL cmsPage.content resolver can't render that block outside
       Magento's full layout pipeline and returns a raw PHP exception
       string as the entire "content" — e.g. `Error filtering template:
       Invalid template file: '...phtml' in module: '' block's name: '...'`.
       The live PHP storefront still renders these pages fine (its own
       controller has the full layout context GraphQL doesn't), but that
       real markup isn't retrievable through any GraphQL field — there is
       no live data to show here, only this raw internal error. Never
       render that verbatim to a customer; show an honest "unavailable"
       notice instead of either the error text or invented content. */
    const isBrokenTemplateError = /Error filtering template:/i.test(page.content);

    const decodedContent = isBrokenTemplateError
      ? ""
      : page.content
          .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&").replace(/\\"/g, '"')
          .replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n")
          .replace(/((?:src|href))="\/media\//g, `$1="/api/media/`);
    const cmsBgImage = (function getCmsHeroBanner(k: string, t: string) {
      const key = (k || "").toLowerCase();
      const title = (t || "").toLowerCase();
      if (key.includes("ev") || key.includes("electric") || title.includes("ev") || title.includes("electric")) {
        return "/images/bg/ev-tyres-banner.png";
      }
      if (key.includes("motorcycle") || key.includes("motorbike") || title.includes("motorbike") || title.includes("motorcycle")) {
        return "/images/bg/motorbike-banner.png";
      }
      if (key.includes("insurance") || title.includes("insurance")) {
        /* The real live-site asset (downloaded from the actual public,
           unauthenticated theme static URL used on www1.tyresworld.ae —
           confirmed pixel-identical), not the car-battery artwork that
           was previously mislabeled car-insurance-banner.png. */
        return "/images/bg/car-insurance-banner.webp";
      }
      if (key === "car-battery-replacement") {
        /* Its own dedicated real live asset (Dubai skyline + 5 SUVs +
           battery-brand boxes, "SHOP FROM PREMIUM CAR BATTERY BRANDS"
           ribbon) — distinct from both the generic tyre-tread background
           and the car-battery category's own banner (brand/parts photo). */
        return "/images/bg/car-battery-replacement-banner.webp";
      }
      /* No loose "battery" substring branch: that used to also wrongly catch
         the car-battery-service CMS page — confirmed on the live site that
         page actually uses the same generic tyre-tread background as every
         other Car Services sub-page (car-tyre-service, car-ac-service,
         etc.), not a battery banner. The car-battery CATEGORY's own banner
         is handled separately by CategoryPageInner's getCategoryHeroBanner. */
      return null;
    })(route.identifier ?? slug, page.title);

    /* Only banners whose artwork has a title/tagline baked in need a
       visually-hidden H1 — car battery and motorbike are plain photography
       with no text in them, so hiding their H1 would leave the hero with no
       visible title at all. Both the EV and insurance banners are also shot
       at a much taller aspect ratio than the fixed py-16..py-36 hero padding
       assumes, cropping their own baked-in ribbon text at that fixed height
       — match each one's real ratio instead. */
    const BAKED_IN_TITLE_BANNERS = new Set(["/images/bg/ev-tyres-banner.png"]);
    const BANNER_ASPECT_RATIOS: Record<string, string> = {
      "/images/bg/ev-tyres-banner.png": "1024 / 322",
      "/images/bg/car-insurance-banner.webp": "1905 / 600",
      "/images/bg/car-battery-replacement-banner.webp": "1905 / 600",
    };
    const cmsHasBakedInTitle = !!cmsBgImage && BAKED_IN_TITLE_BANNERS.has(cmsBgImage);
    const cmsBannerAspectRatio = cmsBgImage ? BANNER_ASPECT_RATIOS[cmsBgImage] : undefined;

    const cmsBannerStyle = cmsBgImage
      ? {
          backgroundImage: `url("${cmsBgImage}")`,
          backgroundSize: "cover" as const,
          backgroundPosition: "center" as const,
          backgroundRepeat: "no-repeat" as const,
          ...(cmsBannerAspectRatio ? { aspectRatio: cmsBannerAspectRatio } : {}),
        }
      : undefined;

    return (
      <main dir={isAr ? "rtl" : "ltr"} className="bg-white">
        {/* Same hero banner treatment as category pages (page-title-wrapper /
            bg-cover-image in app/globals.css) — the CMS branch never used it
            before, so these pages had no title banner at all. */}
        <div
          className={`page-title-wrapper bg-cover-image ${
            cmsBgImage
              ? cmsBannerAspectRatio
                ? "shadow-inner"
                : "!py-16 sm:!py-24 md:!py-28 lg:!py-36 shadow-inner"
              : ""
          }`}
          style={cmsBannerStyle}
        >
          <div className="container custom-width">
            <div className="title">
              <h1 id="page-title-heading" className={cmsHasBakedInTitle ? "sr-only" : ""}>
                <span className="base" data-ui-id="page-title-wrapper">
                  {/* content_heading is the real on-page H1 field, distinct
                      from title (used below for breadcrumb/<title> tag) —
                      same pattern as category_page_title vs name. e.g. Car
                      Insurance: title="Car Insurance", content_heading=
                      "Car Insurance Service in UAE", the live page's real H1. */}
                  {page.content_heading || page.title}
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

        {((route.identifier ?? slug) === "car-battery-replacement" || (route.identifier ?? slug) === "car-battery") ? (
          /* Real page content — see CarBatteryReplacementLanding.tsx for why
             this can't come from GraphQL. Manages its own container/section
             widths, so it isn't nested in the padded container below. */
          <CarBatteryReplacementLanding />
        ) : (
          <div className="w-full overflow-hidden">
            {/* .cms-content (app/globals.css) is the site's real styling for
                Magento-authored HTML — the same class CategorySeoSection.tsx
                uses for category descriptions, extended here to also cover
                the legacy Bootstrap grid/utility classes this content is
                authored in (row/col-xl-6/card/offer-box/carousel/etc.),
                scoped so none of it can leak into or collide with the rest
                of the site's own styling. */}
            {isBrokenTemplateError ? (
              <div className="container py-10 lg:py-14">
                <div className="max-w-xl mx-auto text-center py-10 text-gray-500">
                  <p className="font-bold text-gray-900 mb-2">This page's content isn't available right now.</p>
                  <p className="text-sm">
                    Please{" "}
                    <a href={`/${locale}/contact`} className="text-[#ed1c24] hover:underline">
                      contact us
                    </a>{" "}
                    and we'll help directly.
                  </p>
                </div>
              </div>
            ) : (
              <div className="cms-content" dangerouslySetInnerHTML={{ __html: decodedContent }} />
            )}
            <div className="container py-10 lg:py-14">
              <CmsCarousel />
              <CmsAccordion />
            </div>
          </div>
        )}
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
