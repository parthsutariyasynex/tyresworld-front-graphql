import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import CategoryPageInner from "@/components/category/CategoryPageInner";
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

/* ── SEO: resolved per entity, straight from Magento ──────────────── */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = asLocale(params.locale);
  const slug = toSlug(params.slug);
  const store = storeCode(locale);
  const canonical = `/${locale}/${slug}`;
  const languages = { en: `/en/${slug}`, ar: `/ar/${slug}` };

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
      openGraph: { title, type: "website", locale: locale === "ar" ? "ar_SA" : "en_SA" },
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
    return (
      <main dir={isAr ? "rtl" : "ltr"} className="bg-white py-12 lg:py-16">
        <div className="container max-w-4xl mx-auto px-4">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 uppercase tracking-wider font-bold">
            <a href={`/${locale}`} className="hover:text-black transition-colors">
              {t(locale, "common.home")}
            </a>
            <span>/</span>
            <span className="text-black">{page.title}</span>
          </nav>
          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-8 border-b border-gray-100 pb-4 uppercase tracking-tight">
            {page.title}
          </h1>
          <div
            className="prose prose-neutral max-w-none text-gray-800 leading-relaxed font-medium text-sm space-y-4"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
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
            heroTitleAr={hero.heroTitleAr}
            showTyreFinder={hero.showTyreFinder}
          />
        </Suspense>
      </>
    );
  }

  notFound();
}
