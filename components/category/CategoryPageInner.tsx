"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import TyreListingCard from "@/components/TyreListingCard";
import TyreListingCardSkeleton from "@/components/TyreListingCardSkeleton";
import StickyTyreSearch from "@/components/StickyTyreSearch";
import TyreFinder from "@/components/TyreFinder";
import CategorySeoSection from "@/components/CategorySeoSection";
import CategoryFaqSection, { type FaqItem } from "@/components/CategoryFaqSection";
import { storeCode, type Locale } from "@/lib/i18n";
import FilterPanel, { type FilterGroup } from "@/components/FilterPanel";
import type { Product } from "@/lib/data";
import Pagination from "@/components/tyre/Pagination";

const PAGE_SIZE = 12;

interface CategoryInfo {
  uid: string;
  name: string;
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

/* ── FAQ parser ─────────────────────────────────────────────────── */
function parseFaqsFromHtml(html: string): FaqItem[] {
  const items: FaqItem[] = [];
  const clean = html
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").replace(/\\"/g, '"')
    .replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");

  const parts = clean.split(/class=["']faq-item["']/i);
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const qm = part.match(/class=["']faq-question["'][^>]*>([\s\S]*?)(?:<span|<\/button>)/i);
    const am = part.match(/class=["']faq-answer["'][^>]*>([\s\S]*?)<\/div>/i);
    if (qm && am) {
      const q = qm[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      const a = am[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (q && a) items.push({ question: q, answer: a });
    }
  }
  if (!items.length) {
    for (const m of clean.matchAll(/<(h3|h4)[^>]*>([\s\S]*?)<\/\1>\s*<p[^>]*>([\s\S]*?)<\/p>/gi)) {
      const q = m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      const a = m[3].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (q && a) items.push({ question: q, answer: a });
    }
  }
  return items;
}

/* ── Sort dropdown ──────────────────────────────────────────────── */
const SORT_OPTS = [
  { en: "Default",            ar: "الافتراضي",                    value: "" },
  { en: "Price: High to Low", ar: "السعر: من الأعلى إلى الأدنى", value: "high-to-low" },
  { en: "Price: Low to High", ar: "السعر: من الأدنى إلى الأعلى", value: "low-to-high" },
];

function SortBar({ value, onChange, isAr }: { value: string; onChange: (v: string) => void; isAr: boolean }) {
  const [open, setOpen] = useState(false);
  const cur = SORT_OPTS.find(o => o.value === value) ?? SORT_OPTS[0];

  return (
    <div className="relative flex items-center gap-2">
      {cur.value && (
        <span className="hidden sm:inline-flex items-center text-xs font-bold text-gray-700 uppercase tracking-wide border border-gray-200 px-3 py-2 rounded-lg bg-white">
          {isAr ? cur.ar : cur.en}
        </span>
      )}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 bg-[#ed1c24] hover:bg-[#c6181d] text-white px-3 py-2 rounded-lg transition-colors"
        aria-label={isAr ? "ترتيب" : "Sort"}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 4h18l-7 8.5V20l-4-2v-5.5L3 4z" />
        </svg>
        <span className="hidden sm:block text-xs font-bold uppercase tracking-wide">
          {isAr ? "ترتيب" : "Sort"}
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 min-w-[200px]">
            {SORT_OPTS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${opt.value === value ? "text-[#ed1c24] font-semibold bg-red-50" : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                {isAr ? opt.ar : opt.en}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PROPS
════════════════════════════════════════════════════════════════ */
export interface CategoryPageInnerProps {
  /** Magento category url_key */
  urlKey: string;
  locale: Locale;
  /** Hero title — shown in white on the black banner */
  heroTitle?: string;
  /** Hero title in Arabic — falls back to heroTitle */
  heroTitleAr?: string;
  /** Render the TyreFinder widget under the hero (tyre categories). */
  showTyreFinder?: boolean;
}

/* ════════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════════ */
export default function CategoryPageInner({ urlKey, locale, heroTitle, heroTitleAr, showTyreFinder }: CategoryPageInnerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const store = storeCode(locale);
  const basePath = `/${locale}/${urlKey}`;
  const isAr = locale === "ar";

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

  const [cmsContent, setCmsContent] = useState<string | null>(null);
  const [cmsLoading, setCmsLoading] = useState(true);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);

  /* ── Products + category ──────────────────────────────────────── */
  useEffect(() => {
    let active = true;
    setLoading(true); setCatLoading(true); setApiError(null);

    const p = new URLSearchParams();
    p.set("urlKey", urlKey);
    p.set("pageSize", String(PAGE_SIZE));
    p.set("page", String(page));
    p.set("store", store);
    if (sort) p.set("sort", sort);
    const query = searchParams.get("q") ?? "";
    if (query) p.set("q", query);
    for (const [code, values] of Object.entries(selected)) {
      if (values.length) p.set(code, values.join(","));
    }

    fetch(`/api/category-page?${p}`, { cache: "no-store" })
      .then(r => r.json())
      .then(j => {
        if (!active) return;
        if (j.error && !j.products?.length) { setApiError(j.error); }
        if (j.category) setCategory(j.category);
        let items: Product[] = j.products ?? [];
        if (sort === "high-to-low") items = [...items].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        else if (sort === "low-to-high") items = [...items].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        setProducts(items);
        setTotal(j.total ?? 0);
        setTotalPages(j.totalPages ?? 1);
        setLoading(false); setCatLoading(false);
      })
      .catch(err => {
        if (!active) return;
        setApiError(err.message); setLoading(false); setCatLoading(false);
      });

    return () => { active = false; };
  }, [urlKey, sort, page, store, selected, searchParams]);

  /* ── Filters ─────────────────────────────────────────────────── */
  useEffect(() => {
    setFiltersLoading(true);
    fetch(`/api/category-filters?urlKey=${urlKey}&store=${store}`)
      .then(r => r.json())
      .then(d => { setFilterGroups(d.filters ?? []); setFiltersLoading(false); })
      .catch(() => setFiltersLoading(false));
  }, [urlKey, store]);

  /* ── Apply category meta to document head ────────────────────── */
  useEffect(() => {
    if (!category) return;
    const title = category.metaTitle ?? category.name;
    if (title) document.title = title;
    if (category.metaDescription) {
      let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = category.metaDescription;
    }
  }, [category]);

  /* ── SEO / FAQ from category description ─────────────────────── */
  useEffect(() => {
    if (!category?.description) { setCmsLoading(false); setFaqLoading(false); return; }
    const raw = category.description
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&").replace(/\\"/g, '"')
      .replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");

    const faqIdx = raw.search(/<div[^>]*class=["']faq-section["'][^>]*>/i);
    let seoHtml = faqIdx >= 0 ? raw.substring(0, faqIdx) : raw;
    const h2Idx = seoHtml.search(/<h2[^>]*>/i);
    if (h2Idx >= 0) seoHtml = seoHtml.substring(h2Idx);

    setCmsContent(seoHtml.trim() || null); setCmsLoading(false);
    setFaqs(parseFaqsFromHtml(raw)); setFaqLoading(false);
  }, [category]);

  /* ── URL helpers ──────────────────────────────────────────────── */
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

  const handleFilterChange = (code: string, values: string[]) => {
    setSelected(prev => ({ ...prev, [code]: values }));
    setPage(1);
  };

  const activeFilterCount = Object.values(selected).reduce((s, v) => s + v.length, 0);
  const isLoading = catLoading || (!!category?.uid && loading);

  const displayTitle = isAr
    ? (heroTitleAr ?? heroTitle ?? category?.name?.toUpperCase() ?? "")
    : (heroTitle ?? category?.name?.toUpperCase() ?? "");

  const productsLabel = isAr
    ? `${total.toLocaleString("ar-SA")} إطار`
    : `${total.toLocaleString()} Tyres`;

  return (
    <div dir={dir} className="pb-[160px]">

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div className="bg-black py-14 lg:py-20 text-center">
        <div className="container">
          {catLoading ? (
            <span className="inline-block bg-white/10 rounded animate-pulse w-96 h-10" />
          ) : (
            <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-black uppercase tracking-wide text-white leading-tight">
              {displayTitle}
            </h1>
          )}
        </div>
      </div>

      {/* ── Tyre finder (tyre categories) ──────────────────────────── */}
      {showTyreFinder && category?.uid && <TyreFinder categoryUid={category.uid} />}

      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="container py-3">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400">
            <Link href={`/${locale}`} className="hover:text-black transition-colors">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <ChevronRight size={12} className="shrink-0" />
            <span className="text-black font-semibold">
              {catLoading
                ? <span className="inline-block bg-gray-200 rounded animate-pulse w-24 h-3 align-middle" />
                : (category?.name ?? urlKey.replace(/-/g, " "))}
            </span>
          </nav>
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-[70px] z-30">
        <div className="container py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500 font-medium">
            {isLoading ? (isAr ? "جارٍ التحميل…" : "Loading…") : productsLabel}
          </p>
          <div className="flex items-center gap-2">
            <SortBar value={sort} onChange={setSort} isAr={isAr} />
            <button
              onClick={() => setFilterOpen(true)}
              className="relative w-[42px] h-[42px] flex items-center justify-center bg-[#ed1c24] hover:bg-[#c6181d] text-white rounded-lg transition-colors shrink-0"
              aria-label={isAr ? "تصفية" : "Filter"}
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

      {/* ── Filter drawer ──────────────────────────────────────────── */}
      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filterGroups}
        loading={filtersLoading}
        selected={selected}
        onChange={handleFilterChange}
        dir={dir}
        urlKey={urlKey}
      />

      {/* ── Product grid ───────────────────────────────────────────── */}
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
              <p className="text-gray-400 text-lg font-medium">
                {isAr ? "لا توجد إطارات." : "No tyres found."}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {isAr ? "جرّب بحثاً مختلفاً." : "Try a different search or check back later."}
              </p>
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

      {/* ── SEO + FAQ ──────────────────────────────────────────────── */}
      <CategorySeoSection content={cmsContent} loading={cmsLoading} dir={dir} />
      <CategoryFaqSection faqs={faqs} loading={faqLoading} dir={dir} />

      {/* ── Sticky bottom search bar ────────────────────────────────── */}
      <StickyTyreSearch locale={locale} basePath={basePath} dir={dir} />
    </div>
  );
}
