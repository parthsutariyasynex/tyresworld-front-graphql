import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import CategoryPageInner from "@/components/category/CategoryPageInner";
import { getCategoryMeta, getCategoryFilterGroups } from "@/lib/services/category.service";
import type { FilterGroup, FilterOption } from "@/components/FilterPanel";
import { storeCode, t, type Locale } from "@/lib/i18n";
import { APP_CONFIG } from "@/src/config/app-config";

const SITE_URL = `https://${APP_CONFIG.brand.domain}`;

/**
 * SEO tyre-size URLs — /tyres/<width>-<height>-<rim> (single size) or
 * /tyres/<w-h-r>/<rear-w-h-r> (front + rear). This route only parses the
 * slug into the same width/height/rim (and rear_*) filter values the
 * existing /tyres?width=&height=&rim=... query-string flow already
 * produces, then hands them to CategoryPageInner via `sizeFilters` — the
 * real Magento/API tyre-search logic (app/api/category-page) is untouched.
 * Legacy query-string URLs are redirected here by middleware.ts.
 */

function asLocale(l?: string): Locale {
  return "en";
}

const SIZE_RE = /^(\d{1,3}(?:\.\d+)?)-(None|\d{1,3}(?:\.\d+)?)-(\d{1,3}(?:\.\d+)?)$/i;

interface ParsedSizes {
  width: string;
  height: string;
  rim: string;
  rearWidth?: string;
  rearHeight?: string;
  rearRim?: string;
}

/** Parses ["155-70-13"] or ["245-35-20", "285-35-20"] or ["155-70-13", "165-None-13"]. Anything else (wrong
    segment count, invalid parts) is not a real size URL — notFound(). */
function parseSizes(sizes: string[] | undefined): ParsedSizes | null {
  if (!sizes || sizes.length < 1 || sizes.length > 2) return null;

  const front = SIZE_RE.exec(sizes[0]);
  if (!front) return null;
  const parsed: ParsedSizes = { width: front[1], height: front[2], rim: front[3] };

  if (sizes.length === 2) {
    const rear = SIZE_RE.exec(sizes[1]);
    if (!rear) return null;
    parsed.rearWidth = rear[1];
    parsed.rearHeight = rear[2];
    parsed.rearRim = rear[3];
  }

  return parsed;
}

function canonicalSlug(p: ParsedSizes): string {
  const front = `${p.width}-${p.height}-${p.rim}`;
  return p.rearWidth && p.rearRim
    ? `${front}/${p.rearWidth}-${p.rearHeight || "None"}-${p.rearRim}`
    : front;
}

function sizeLabel(p: ParsedSizes): string {
  const front = `${p.width}/${p.height} R${p.rim}`;
  const rearH = p.rearHeight && p.rearHeight.toLowerCase() !== "none" ? `/${p.rearHeight}` : "";
  return p.rearWidth && p.rearRim
    ? `${front} Front, ${p.rearWidth}${rearH} R${p.rearRim} Rear`
    : front;
}

interface PageProps {
  params: { locale: string; sizes: string[] };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = asLocale(params.locale);
  const store = storeCode(locale);
  const parsed = parseSizes(params.sizes);
  const canonical = `/tyres/${(params.sizes ?? []).join("/")}`;

  if (!parsed) {
    if (params.sizes?.[0] === "brand" && params.sizes?.[1]) {
      const brandCanonical = `/tyres/brand/${params.sizes[1]}`;
      return { title: "Tyres", alternates: { canonical: brandCanonical, languages: { en: brandCanonical } } };
    }
    return { title: "Tyres", alternates: { canonical, languages: { en: canonical } } };
  }

  const realCanonical = `/tyres/${canonicalSlug(parsed)}`;
  const label = sizeLabel(parsed);

  // Same real category_page_title Magento gives the root Tyres category —
  // no invented/hardcoded copy, just the size prefixed onto it.
  const meta = await getCategoryMeta("tyres", store);
  const baseTitle = meta?.metaTitle || "Buy All Types of Tyres Online in UAE";
  const title = `${label} Tyres | ${baseTitle}`;
  const description =
    meta?.metaDescription ||
    `Shop ${label} tyres online in UAE with free mobile fitting, manufacturer warranty, and best prices.`;

  return {
    title,
    description,
    alternates: { canonical: realCanonical, languages: { en: realCanonical } },
    openGraph: { title, description, type: "website", url: `${SITE_URL}${realCanonical}` },
  };
}

export default async function TyreSizePage({ params }: PageProps) {
  const locale = asLocale(params.locale);
  const parsed = parseSizes(params.sizes);

  if (!parsed) {
    if (params.sizes?.[0] === "brand" && params.sizes?.[1]) {
      redirect(`/tyres/brand/${params.sizes[1]}`);
    }
    notFound();
  }

  const sizeFilters: Record<string, string> = {
    width: parsed.width,
    height: parsed.height,
    rim: parsed.rim,
  };
  if (parsed.rearWidth && parsed.rearRim) {
    sizeFilters.rear_width = parsed.rearWidth;
    if (parsed.rearHeight && parsed.rearHeight.toLowerCase() !== "none") {
      sizeFilters.rear_height = parsed.rearHeight;
    }
    sizeFilters.rear_rim = parsed.rearRim;
  }

  return (
    <Suspense
      fallback={
        <div className="container py-20 text-center text-gray-400 animate-pulse">
          {t(locale, "common.loading")}
        </div>
      }
    >
      <CategoryPageInner
        urlKey="tyres"
        locale={locale}
        showTyreFinder
        basePath={`/tyres/${canonicalSlug(parsed)}`}
        sizeFilters={sizeFilters}
      />
    </Suspense>
  );
}
