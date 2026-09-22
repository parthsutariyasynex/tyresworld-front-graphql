import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import CategoryPageInner from "@/components/category/CategoryPageInner";
import EvTyresLanding from "@/components/ev/EvTyresLanding";
import CmsCarousel from "@/components/CmsCarousel";
import CmsAccordion from "@/components/CmsAccordion";
import CarBatteryReplacementLanding from "@/components/service/CarBatteryReplacementLanding";
import TyreGuideSeoContent from "@/components/TyreGuideSeoContent";
import { resolveRoute } from "@/lib/services/route.service";
import { getCmsPage } from "@/lib/services/cms.service";
import { getCategoryMeta } from "@/lib/services/category.service";
import { CATEGORY_HERO } from "@/src/config/routes";
import { storeCode, t, type Locale } from "@/lib/i18n";
import { APP_CONFIG } from "@/src/config/app-config";
import JsonLd from "@/components/JsonLd";
import PageHeroBanner, { type BreadcrumbItem } from "@/components/PageHeroBanner";

const SITE_URL = `https://${APP_CONFIG.brand.domain}`;

export const revalidate = 300;

interface PageProps {
  params: { locale: string; slug: string | string[] };
}

function asLocale(l?: string): Locale {
  return "en";
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
]);

const EV_SLUGS = new Set(["electric-vehicle-tyres-uae", "ev-tyres", "ev-tires"]);

/* "on-road-tires" and "off-road-tires-4x4" used to render here as filtered
   listing views, but Magento has no real attribute distinguishing on-road
   from off-road/4x4 tyres — the filter was never actually wired, so both
   pages silently showed the entire unfiltered Tyres catalog under a
   misleading title. Both slugs now redirect to the real root Tyres category
   in middleware.ts (a real HTTP 307, done there rather than here since a
   redirect() thrown after this page's root layout starts streaming would
   only degrade to a client-side meta-refresh) — neither slug reaches this
   file anymore. */

/* ── SEO: resolved per entity, straight from Magento ──────────────── */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = asLocale(params.locale);
  const slug = toSlug(params.slug);
  const store = storeCode(locale);
  const canonical = `/${locale}/${slug}`;
  const languages = { en: `/en/${slug}` };

  if (EV_SLUGS.has(slug)) {
    const page = await getCmsPage(slug, store);
    const title = page?.meta_title || page?.title || "Electric Vehicle Tyres in UAE | Best EV Tyres for Tesla, BMW & More";
    const description = page?.meta_description || "Buy electric vehicle tyres in UAE. Best EV tyres for Tesla Model 3, Model Y, BMW iX, Hyundai IONIQ 5 & more. EV-specific, low noise & high efficiency tyres.";
    return {
      title,
      description,
      alternates: { canonical, languages },
      openGraph: { title, description, type: "website" },
    };
  }

  if (LISTING_SLUGS.has(slug)) {
    /* "tyres" is the real root Tyres category (uid MTg=) with its own real
       meta_title/meta_description — fetch those instead of the generic
       fallback copy below, same as every other real category on the site.
       "run-flat-tires" is a synthetic filtered view of that SAME root
       category (see isRunFlatCategory in app/api/category-page/route.ts —
       it resolves to the identical tyresCategoryUid, with a real `runflat`
       product-attribute filter applied), so there's no distinct real meta
       for it to prefer instead. */
    if (slug === "tyres") {
      const meta = await getCategoryMeta("tyres", store);
      if (meta?.metaTitle) {
        const title = meta.metaTitle;
        return {
          title,
          description: meta.metaDescription || undefined,
          alternates: { canonical, languages },
          openGraph: { title, type: "website" },
        };
      }
    }
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

  // EV Tyres Landing Page (electric-vehicle-tyres-uae, ev-tyres, ev-tires) — matches live Magento landing page
  if (EV_SLUGS.has(slug)) {
    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/${locale}` },
        { "@type": "ListItem", position: 2, name: "EV Tyres", item: `${SITE_URL}/${locale}/${slug}` },
      ],
    };
    return (
      <>
        <JsonLd data={breadcrumbJsonLd} />
        <EvTyresLanding />
      </>
    );
  }

  // Special listing categories (e.g. tyres, run-flat-tires)
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
    /* Magento's Page Builder wraps raw-HTML blocks HTML-entity-encoded
       (its editor needs the markup as text) — `&lt;div class="..."&gt;`
       instead of `<div class="...">`. The old PHP theme decoded this
       before rendering; this route didn't, so the tags showed up as
       literal visible text instead of real elements. Same fix already
       applied to category descriptions in CategoryPageInner.tsx. */
    /* This content's own <img> src/href attributes are root-relative
       ("/media/images/services/...") — correct on the Magento-served page
       itself, but resolved against OUR origin here, where they 404. The
       fallback below routes them through /api/media, which fetches from
       the staging origin server-side (with the Basic Auth header a plain
       <img> can't send) — but that origin sits behind Cloudflare, which
       blocks/challenges Vercel's serverless IP ranges, so the proxy 403s
       in production even with correct credentials. For the specific,
       known, unchanging images referenced by CMS pages we've actually
       audited (not per-request dynamic data), the real files have been
       downloaded once into public/images/ and are mapped here directly —
       same real images, no live fetch, no Cloudflare dependency. Any
       CMS-linked image not in this map still falls through to the
       /api/media proxy below (unaffected, unaudited pages keep their
       prior behavior). */
    const KNOWN_CMS_MEDIA_MAP: Record<string, string> = {
      // car-insurance
      "/media/images/services/best-car-insurance-agent-uae.webp": "/images/services/best-car-insurance-agent-uae.webp",
      "/media/images/services/comprehensive-car-insurance.webp": "/images/services/comprehensive-car-insurance.webp",
      "/media/images/services/third-party-car-insurance-uae.webp": "/images/services/third-party-car-insurance-uae.webp",

      // Shared across every Car Services sub-page: the real live site itself
      // reuses one generic avatar for every named testimonial (confirmed —
      // same /media/images/testimonials/author.png behind every different
      // name), so mapping all of them to our one real local avatar matches
      // the actual live design, not an invented substitute.
      "/media/images/testimonials/author.png": "/images/home/author.png",

      // car-tyre-service — no local photo exists for several of these
      // specific angles (puncture repair, nitrogen filling, TPMS, rotation,
      // inspection), so they reuse the closest real tyre/alignment/balancing
      // photo already used elsewhere on the real site.
      "/media/images/services/best-tyre-fitting-service-shop-abu-dhabi.webp": "/images/services/best-tyre-fitting-service-shop-abu-dhabi.webp",
      "/media/images/services/qucik-tyre-puncture-repair-shop-abu-dhabi.webp": "/images/services/best-tyre-fitting-service-shop-abu-dhabi.webp",
      "/media/images/services/tire-rotation-service-near-me-abu-dhabi.webp": "/images/services/best-tyre-fitting-service-shop-abu-dhabi.webp",
      "/media/images/services/car-wheel-balancing-shop-abu-dhabi.webp": "/images/services/expert-car-wheel-balancing-service-abu-dhabi.webp",
      "/media/images/services/car-wheel-alignment-service-abu-dhabi.webp": "/images/services/benefits-regular-wheel-alignment-service-uae.webp",
      "/media/images/services/regular-tyre-inspection-service-abu-dhabi.webp": "/images/services/best-tyre-fitting-service-shop-abu-dhabi.webp",
      "/media/images/services/nitrogen-filling-service-tyres-abu-dhabi.webp": "/images/services/best-tyre-fitting-service-shop-abu-dhabi.webp",
      "/media/images/services/tpms-service-abu-dhabi.webp": "/images/services/benefits-regular-wheel-alignment-service-uae.webp",

      // car-battery-service
      "/media/images/services/car-battery-testing-diagnostics-service-abu-dhabi.webp": "/images/services/car-battery-health-check-service-uae.webp",
      "/media/images/services/car-battery-replacement-service-abu-dhabi.webp": "/images/services/car-battery-replacement-service-abu-dhabi.webp",
      "/media/images/services/car-battery-terminal-cleaning-abu-dhabi.webp": "/YourTrustedAutoCare/car-battery.jpg",
      "/media/images/services/car-battery-alternator-charging-repair.webp": "/images/services/vehicle-battery-replacement-service-uae.webp",
      "/media/images/services/car-battery-maintenance-plans.webp": "/images/services/car-battery-health-check-service-uae.webp",

      // car-ac-service — no local AC-specific photo beyond the one real match.
      "/media/images/services/car-ac-gas-refill-service-abu-dhabi.webp": "/images/services/expert-car-ac-service-workshop-near-me.webp",
      "/media/images/services/car-ac-filter-replacement-service-abu-dhabi.webp": "/images/services/expert-car-ac-service-workshop-near-me.webp",
      "/media/images/services/car-ac-service-signs.webp": "/images/services/expert-car-ac-service-workshop-near-me.webp",
      "/media/images/services/expert-car-ac-service-workshop-near-me.webp": "/images/services/expert-car-ac-service-workshop-near-me.webp",

      // car-brake-service — one real local brake photo covers all 8 angles.
      "/media/images/services/car-brake-pad-replacement-services-abu-dhabi.webp": "/images/services/car-brake-pad-replacement-services-abu-dhabi.webp",
      "/media/images/services/brake-disc-skimming-service-abu-dhabi.webp": "/images/services/car-brake-pad-replacement-services-abu-dhabi.webp",
      "/media/images/services/car-brake-fluid-replacement-service-tyresworld.webp": "/images/services/car-brake-pad-replacement-services-abu-dhabi.webp",
      "/media/images/services/car-brake-caliper-services-abu-dhabi.webp": "/images/services/car-brake-pad-replacement-services-abu-dhabi.webp",
      "/media/images/services/car-abs-service-shop-abu-dhabi.webp": "/images/services/car-brake-pad-replacement-services-abu-dhabi.webp",
      "/media/images/services/car-brake-master-cylinder-service-abu-dhabi.webp": "/images/services/car-brake-pad-replacement-services-abu-dhabi.webp",
      "/media/images/services/car-hand-brake-repair-service-uae.webp": "/images/services/car-brake-pad-replacement-services-abu-dhabi.webp",
      "/media/images/services/car-brake-sensor-repair-abu-dhabi.webp": "/images/services/car-brake-pad-replacement-services-abu-dhabi.webp",

      // car-oil-change-service
      "/media/images/services/car-engine-oil-change-abu-dhabi.webp": "/images/services/car-engine-oil-change-abu-dhabi.webp",
      "/media/images/services/car-coolant-replacement-service-abu-dhabi.webp": "/images/services/car-engine-oil-change-abu-dhabi.webp",
      "/media/images/services/car-oil-filter-replacement-service-abu-dhabi.webp": "/images/services/car-engine-oil-change-abu-dhabi.webp",
      "/media/images/services/transmission-oil-change-service-abu-dhabi.webp": "/images/services/car-engine-oil-change-abu-dhabi.webp",

      // car-mechanical-service
      "/media/images/services/car-engine-repair-service-abu-dhabi.webp": "/images/services/best-car-mechanical-services-abu-dhabi.webp",
      "/media/images/services/car-transmission-service-by-expert-in-abu-dhabi.webp": "/images/services/best-car-mechanical-services-abu-dhabi.webp",
      "/media/images/services/car-suspension-repair-service-abu-dhabi.webp": "/images/services/best-car-mechanical-services-abu-dhabi.webp",

      // car-wheel-alignment-service
      "/media/images/services/car-wheel-alignment-check-abu-dhabi.webp": "/images/services/benefits-regular-wheel-alignment-service-uae.webp",
      "/media/images/services/expert-car-wheel-alignment-service-abu-dhabi.webp": "/images/services/benefits-regular-wheel-alignment-service-uae.webp",
      "/media/images/services/when-car-wheel-alignment-service-require.webp": "/images/services/benefits-regular-wheel-alignment-service-uae.webp",

      // car-wheel-balancing-service
      "/media/images/services/car-wheel-balancing-free-check-abu-dhabi.webp": "/images/services/expert-car-wheel-balancing-service-abu-dhabi.webp",
      "/media/images/services/car-tyres-balancing-check-abu-dhabi.webp": "/images/services/expert-car-wheel-balancing-service-abu-dhabi.webp",
      "/media/images/services/expert-car-wheel-balancing-service-abu-dhabi.webp": "/images/services/expert-car-wheel-balancing-service-abu-dhabi.webp",

      // car-rim-repair-service
      "/media/images/services/car-rim-repair-service-abu-dhabi.webp": "/images/services/car-rim-repair-service-abu-dhabi.webp",
      "/media/images/services/car-new-alloy-wheels-abu-dhabi.webp": "/YourTrustedAutoCare/car-rim.jpg",
      "/media/images/services/alloygator-rim-protectors-abu-dhabi.webp": "/images/services/car-rim-repair-service-abu-dhabi.webp",
    };
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
      : (() => {
          let html = page.content
            .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&").replace(/\\"/g, '"')
            .replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
          for (const [magentoPath, localPath] of Object.entries(KNOWN_CMS_MEDIA_MAP)) {
            html = html.split(`"${magentoPath}"`).join(`"${localPath}"`);
          }
          return html.replace(/((?:src|href))="\/media\//g, `$1="/api/media/`);
        })();
    const cmsBgImage = (function getCmsHeroBanner(k: string, t: string) {
      const key = (k || "").toLowerCase();
      const title = (t || "").toLowerCase();
      if (key.includes("ev") || key.includes("electric") || title.includes("ev") || title.includes("electric")) {
        return "/images/bg/ev-tyres-banner.png";
      }
      if (key.includes("motorcycle") || key.includes("motorbike") || title.includes("motorbike") || title.includes("motorcycle")) {
        return "/images/bg/motorbike-banner.png";
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

    const cmsBreadcrumb: BreadcrumbItem[] = [
      { label: t(locale, "common.home"), href: `/${locale}` },
      { label: page.title },
    ];

    return (
      <main dir="ltr" className="bg-white">
        {cmsBgImage ? (
          /* Curated real photo banner for this specific page (EV, motorbike,
             insurance, car-battery-replacement) — kept as its own deliberate
             asset/aspect-ratio rather than folded into the generic banner. */
          <>
            <div
              className={`page-title-wrapper bg-cover-image ${
                cmsBannerAspectRatio ? "shadow-inner" : "!py-16 sm:!py-24 md:!py-28 lg:!py-36 shadow-inner"
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
          </>
        ) : (
          /* Same gradient hero used site-wide on every other inner page. */
          <PageHeroBanner
            title={page.content_heading || page.title}
            breadcrumb={cmsBreadcrumb}
          />
        )}

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
              <div className="container py-2 lg:py-6">
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
            {/* Tyre Guide SEO Content for services and automotive pages */}
            {(slug.includes("service") || slug.includes("tyre") || slug.includes("tire")) && (
              <TyreGuideSeoContent locale={locale} />
            )}
            <div className="container py-2 lg:py-6">
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
