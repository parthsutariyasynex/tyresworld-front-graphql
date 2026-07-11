"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import TyreListingCard from "@/components/TyreListingCard";
import TyreListingCardSkeleton from "@/components/TyreListingCardSkeleton";
import TyreFinder from "@/components/TyreFinder";
import CategorySeoSection from "@/components/CategorySeoSection";
import CategoryFaqSection, { type FaqItem } from "@/components/CategoryFaqSection";
import { t, productsCount as fmtCount, storeCode, type Locale } from "@/lib/i18n";
import FilterPanel, { type FilterGroup } from "@/components/FilterPanel";
import type { Product } from "@/lib/data";
import Pagination from "@/components/tyre/Pagination";

const PAGE_SIZE = 12;
const CATEGORY_URL_KEY = "off-road-tires-4x4";

type Opt = { label: string; value: string };

interface CategoryInfo {
  uid: string;
  name: string;
  description?: string | null;
}

function parseFaqsFromHtml(html: string): FaqItem[] {
  const items: FaqItem[] = [];

  const cleanHtml = html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\\"/g, '"')
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n");

  const parts = cleanHtml.split(/class=["']faq-item["']/i);
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const qMatch = part.match(/class=["']faq-question["'][^>]*>([\s\S]*?)(?:<span|<\/button>)/i);
    const aMatch = part.match(/class=["']faq-answer["'][^>]*>([\s\S]*?)<\/div>/i);
    if (qMatch && aMatch) {
      const question = qMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      const answer = aMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (question && answer) {
        items.push({ question, answer });
      }
    }
  }

  if (items.length === 0) {
    const matches = Array.from(
      cleanHtml.matchAll(/<(h3|h4)[^>]*>([\s\S]*?)<\/\1>\s*<p[^>]*>([\s\S]*?)<\/p>/gi)
    );
    for (const match of matches) {
      const question = match[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      const answer = match[3].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (question && answer) {
        items.push({ question, answer });
      }
    }
  }

  return items;
}

function SortBar({
  value,
  onChange,
  locale,
}: {
  value: string;
  onChange: (v: string) => void;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);

  const opts = [
    { label: t(locale, "products.sortByDefault"), value: "" },
    { label: t(locale, "products.sortByHighToLow"), value: "high-to-low" },
    { label: t(locale, "products.sortByLowToHigh"), value: "low-to-high" },
  ];
  const current = opts.find(o => o.value === value) ?? opts[0];

  return (
    <div className="relative flex items-center gap-2">
      {current.value && (
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide hidden sm:block">
          {current.label.toUpperCase()}
        </span>
      )}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 bg-[#ed1c24] hover:bg-[#c6181d] text-white px-3 py-2 rounded-lg transition-colors"
        aria-label={t(locale, "listing.sort")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 4h18l-7 8.5V20l-4-2v-5.5L3 4z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-wide hidden sm:block">{t(locale, "listing.sort")}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 min-w-[200px]">
            {opts.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${opt.value === value
                  ? "text-[#ed1c24] font-semibold bg-red-50"
                  : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}



export default function OffRoadPageInner({ locale }: { locale: Locale }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const store = storeCode(locale);
  const basePath = `/off-road-tires-4x4`;

  const sort = searchParams.get("product_list_order") ?? searchParams.get("sort") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));

  const [category, setCategory] = useState<CategoryInfo | null>(null);
  const [catLoading, setCatLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [apiError, setApiError] = useState<string | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    setCatLoading(true);
    setApiError(null);

    const p = new URLSearchParams();
    p.set("urlKey", CATEGORY_URL_KEY);
    p.set("pageSize", String(PAGE_SIZE));
    p.set("page", String(page));
    p.set("store", store);
    if (sort) p.set("sort", sort);
    for (const [code, values] of Object.entries(selected)) {
      if (values.length) p.set(code, values.join(","));
    }

    fetch(`/api/category-page?${p}`, { cache: "no-store" })
      .then(r => r.json())
      .then(j => {
        if (!active) return;
        if (j.error) setApiError(j.error);
        if (j.category) setCategory(j.category);
        setProducts(j.products ?? []);
        setTotal(j.total ?? 0);
        setTotalPages(j.totalPages ?? 1);
        setLoading(false);
        setCatLoading(false);
      })
      .catch(err => {
        if (!active) return;
        setApiError(err.message);
        setLoading(false);
        setCatLoading(false);
      });

    return () => { active = false; };
  }, [sort, page, store, selected]);

  useEffect(() => {
    setFiltersLoading(true);
    fetch(`/api/category-filters?urlKey=${CATEGORY_URL_KEY}&store=${store}`)
      .then(r => r.json())
      .then(d => { setFilterGroups(d.filters ?? []); setFiltersLoading(false); })
      .catch(() => setFiltersLoading(false));
  }, [store]);

  const handleFilterChange = (code: string, values: string[]) => {
    setSelected(prev => ({ ...prev, [code]: values }));
    setPage(1);
  };

  const activeFilterCount = Object.values(selected).reduce((s, v) => s + v.length, 0);

  const [cmsContent, setCmsContent] = useState<string | null>(null);
  const [cmsLoading, setCmsLoading] = useState(true);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);

  useEffect(() => {
    if (!category?.description) return;

    const raw = category.description
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/\\"/g, '"')
      .replace(/\\r\\n/g, "\n")
      .replace(/\\n/g, "\n");

    const faqIdx = raw.search(/<div[^>]*class=["']faq-section["'][^>]*>/i);
    let seoHtml = faqIdx >= 0 ? raw.substring(0, faqIdx) : raw;

    const h2Idx = seoHtml.search(/<h2[^>]*>/i);
    if (h2Idx >= 0) seoHtml = seoHtml.substring(h2Idx);

    setCmsContent(seoHtml.trim() || null);
    setCmsLoading(false);

    const extractedFaqs = parseFaqsFromHtml(raw);
    setFaqs(extractedFaqs);
    setFaqLoading(false);
  }, [category]);

  const setSort = useCallback((v: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (v) p.set("product_list_order", v); else p.delete("product_list_order");
    p.delete("page");
    router.replace(`${basePath}?${p}`, { scroll: false });
  }, [router, searchParams, basePath]);

  const setPage = useCallback((n: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("page", String(n));
    router.replace(`${basePath}?${p}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [router, searchParams, basePath]);

  const isLoading = catLoading || (!!category?.uid && loading);

  return (
    <div dir={dir} className="pb-[120px]">
      <div className="bg-black py-14 lg:py-20 text-center relative">
        <div className="container">
          <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-black uppercase tracking-wide text-white leading-tight">
            {catLoading ? (
              <span className="inline-block bg-white/10 rounded animate-pulse w-72 h-10" />
            ) : (
              <>TOP QUALITY <span className="text-[#ed1c24]">{category?.name?.toUpperCase() ?? CATEGORY_URL_KEY.replace(/-/g, " ").toUpperCase()}</span> IN SAUDI ARABIA</>
            )}
          </h1>
        </div>
      </div>

      {category?.uid && <TyreFinder categoryUid={category.uid} />}

      <div className="bg-white border-b border-gray-100">
        <div className="container py-3">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400">
            <Link href={`/${locale}`} className="hover:text-black transition-colors">
              {t(locale, "listing.breadcrumbHome")}
            </Link>
            <ChevronRight size={12} className="shrink-0" />
            <span className="text-black font-semibold uppercase tracking-wide">
              {catLoading
                ? <span className="inline-block bg-gray-200 rounded animate-pulse w-28 h-3 align-middle" />
                : (category?.name ?? CATEGORY_URL_KEY.replace(/-/g, " ").toUpperCase())
              }
            </span>
          </nav>
        </div>
      </div>

      <div className="bg-white border-b border-gray-100 sticky top-[70px] z-30">
        <div className="container py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500 font-medium">
            {isLoading ? t(locale, "products.loading") : fmtCount(locale, total)}
          </p>
          <div className="flex items-center gap-2">
            <SortBar value={sort} onChange={setSort} locale={locale} />
            <button
              onClick={() => setFilterOpen(true)}
              className="relative w-[42px] h-[42px] flex items-center justify-center bg-[#ed1c24] hover:bg-[#c6181d] text-white rounded-lg transition-colors shrink-0"
              aria-label="Filter"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 4h18l-7 8.5V20l-4-2v-5.5L3 4z" />
              </svg>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black text-white text-[9px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filterGroups}
        loading={filtersLoading}
        selected={selected}
        onChange={handleFilterChange}
        dir={dir}
      />

      <div className="bg-gray-50">
        <div className="container py-8">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <TyreListingCardSkeleton key={i} />)}
            </div>
          ) : apiError ? (
            <div className="text-center py-28">
              <p className="text-4xl mb-4">⚠️</p>
              <p className="text-gray-500 font-medium">{apiError}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-28">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-gray-400 text-lg font-medium">{t(locale, "products.noProducts")}</p>
              <p className="text-gray-400 text-sm mt-1">{t(locale, "listing.noProductsSubtext")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
              {products.map(product => (
                <TyreListingCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          )}
          <Pagination current={page} total={totalPages} onChange={setPage} locale={locale} />
        </div>
      </div>

      <CategorySeoSection content={cmsContent} loading={cmsLoading} dir={dir} />
      <CategoryFaqSection faqs={faqs} loading={faqLoading} dir={dir} />
    </div>
  );
}
