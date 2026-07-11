"use client";
export const dynamic = "force-dynamic";

import { useParams, notFound } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import CategoryPageInner from "@/components/category/CategoryPageInner";
import { type Locale, storeCode, t } from "@/lib/i18n";
import { KNOWN_CATEGORY_KEYS } from "@/src/config/routes";
import { Loader2 } from "lucide-react";

const DEDICATED = new Set<string>(KNOWN_CATEGORY_KEYS);

interface CMSPageData {
  title: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
}

export default function DynamicSlugPage() {
  const params = useParams();
  const locale = (params.locale ?? "en") as Locale;
  const slug = params.slug as string;

  const [resolution, setResolution] = useState<"loading" | "category" | "cms" | "not_found">("loading");
  const [cmsData, setCmsData] = useState<CMSPageData | null>(null);

  useEffect(() => {
    if (!slug) {
      setResolution("not_found");
      return;
    }
    if (DEDICATED.has(slug)) {
      setResolution("not_found");
      return;
    }

    let active = true;
    const store = storeCode(locale);

    async function resolveSlug() {
      // 1. Try category page endpoint (quick check)
      try {
        const catRes = await fetch(`/api/category-page?urlKey=${slug}&store=${store}&pageSize=1`);
        const catData = await catRes.json();
        if (active) {
          if (catData.category?.uid) {
            setResolution("category");
            return;
          }
        }
      } catch (e) {
        console.warn("Category check failed, trying CMS...", e);
      }

      // 2. Try CMS page endpoint
      try {
        const cmsRes = await fetch(`/api/cms?type=page&identifier=${slug}&store=${store}`);
        const cmsJson = await cmsRes.json();
        if (active) {
          if (cmsJson.page?.title) {
            setCmsData(cmsJson.page);
            setResolution("cms");
            return;
          }
        }
      } catch (e) {
        console.warn("CMS check failed", e);
      }

      if (active) {
        setResolution("not_found");
      }
    }

    resolveSlug();
    return () => {
      active = false;
    };
  }, [slug, locale]);

  if (resolution === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-2">
        <Loader2 className="animate-spin text-gray-400" size={32} />
        <p className="text-xs text-gray-400 uppercase tracking-widest font-black">{t(locale, "common.loadingPage")}</p>
      </div>
    );
  }

  if (resolution === "not_found") {
    notFound();
  }

  if (resolution === "cms" && cmsData) {
    const isAr = locale === "ar";
    return (
      <main dir={isAr ? "rtl" : "ltr"} className="bg-white py-12 lg:py-16">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 uppercase tracking-wider font-bold">
            <a href={`/${locale}`} className="hover:text-black transition-colors">
              {t(locale, "common.home")}
            </a>
            <span>/</span>
            <span className="text-black">{cmsData.title}</span>
          </nav>

          {/* Heading */}
          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-8 border-b border-gray-100 pb-4 uppercase tracking-tight">
            {cmsData.title}
          </h1>

          {/* Content rendered safely */}
          <div
            className="prose prose-neutral max-w-none text-gray-800 leading-relaxed font-medium text-sm space-y-4"
            dangerouslySetInnerHTML={{ __html: cmsData.content }}
          />
        </div>
      </main>
    );
  }

  return (
    <Suspense fallback={<div className="container py-20 text-center text-gray-400 animate-pulse">{t(locale, "common.loading")}</div>}>
      <CategoryPageInner urlKey={slug} locale={locale} />
    </Suspense>
  );
}
