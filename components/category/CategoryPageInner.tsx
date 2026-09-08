"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import TyreListingCard from "@/components/TyreListingCard";
import TyreListingCardSkeleton from "@/components/TyreListingCardSkeleton";
import TyreFinder from "@/components/TyreFinder";
import StickyBottomFinder from "@/components/home/partora/StickyBottomFinder";
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
    for (const m of clean.matchAll(/<(h3|h4)[^>]*>([\s\S]*?)<\/\1>\s*<p[^>]*>([\s\S]*?)<\/\1>/gi)) {
      const q = m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      const a = m[3].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (q && a) items.push({ question: q, answer: a });
    }
  }
  return items;
}

/* ── Sort dropdown (Exact Magento toolbar-sorter options) ──────── */
const SORT_OPTS = [
  { en: "PRICE: LOW TO HIGH", ar: "السعر: من الأدنى إلى الأعلى", value: "low-to-high" },
  { en: "PRICE: HIGH TO LOW", ar: "السعر: من الأعلى إلى الأدنى", value: "high-to-low" },
  { en: "Recommended",        ar: "موصى به",                     value: "recommended" },
];

function SortBar({ value, onChange, isAr }: { value: string; onChange: (v: string) => void; isAr: boolean }) {
  const [open, setOpen] = useState(false);
  const cur = SORT_OPTS.find(o => o.value === value) ?? SORT_OPTS[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="h-10 px-5 bg-[#eeeeee] hover:bg-[#e2e2e2] text-gray-900 font-black text-[12px] uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center shadow-2xs"
        aria-label={isAr ? "ترتيب" : "Sort"}
      >
        <span>{isAr ? cur.ar : cur.en}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-30 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 min-w-[210px] overflow-hidden">
            {SORT_OPTS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                  opt.value === value ? "text-[#ed1c24] bg-red-50" : "text-gray-800 hover:bg-gray-50"
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

  // Sync URL searchParams to selected state on mount and when query changes
  useEffect(() => {
    const SYSTEM_PARAMS = new Set(["page", "sort", "product_list_order", "q"]);
    const initial: Record<string, string[]> = {};
    for (const [key, val] of searchParams.entries()) {
      if (SYSTEM_PARAMS.has(key)) continue;
      if (val) {
        initial[key] = val.split(",").filter(Boolean);
      }
    }
    
    setSelected(prev => {
      const prevKeys = Object.keys(prev).filter(k => prev[k]?.length > 0).sort();
      const newKeys = Object.keys(initial).filter(k => initial[k]?.length > 0).sort();
      let same = prevKeys.length === newKeys.length;
      if (same) {
        for (let i = 0; i < prevKeys.length; i++) {
          const k = prevKeys[i];
          if (k !== newKeys[i]) { same = false; break; }
          const prevVals = [...prev[k]].sort();
          const newVals = [...initial[k]].sort();
          if (prevVals.join(",") !== newVals.join(",")) { same = false; break; }
        }
      }
      if (same) return prev;
      return initial;
    });
  }, [searchParams]);

  const [cmsContent, setCmsContent] = useState<string | null>(null);
  const [cmsLoading, setCmsLoading] = useState(true);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);

  /* ── Products + category ──────────────────────────────────────── */
  /* The URL of the request currently owned by this component.
     Two things otherwise fire the same request twice: React StrictMode
     double-invokes effects in dev, and this effect also depends on
     `searchParams`, whose identity changes even when nothing it reads has.
     Comparing the built URL collapses both, and doubles as stale-response
     protection — a slower earlier response is ignored once the key moves on. */
  const requestUrlRef = useRef<string | null>(null);

  useEffect(() => {
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

    const url = `/api/category-page?${p}`;

    // Same inputs as the request already in flight / just completed.
    if (requestUrlRef.current === url) return;
    requestUrlRef.current = url;

    setLoading(true); setCatLoading(true); setApiError(null);

    fetch(url, { cache: "no-store" })
      .then(r => r.json())
      .then(j => {
        if (requestUrlRef.current !== url) return;
        if (j.error && !j.products?.length) { setApiError(j.error); }
        if (j.category) setCategory(j.category);
        let items: Product[] = j.products ?? [];
        if (sort === "high-to-low") items = [...items].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        else if (sort === "low-to-high") items = [...items].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        setProducts(items);
        setTotal(j.total ?? 0);
        setTotalPages(j.totalPages ?? 1);
        /* Sidebar options ride along on this same response — the listing
           makes exactly one products request, no second filters call. */
        if (Array.isArray(j.filters)) {
          setFilterGroups(j.filters);
          setFiltersLoading(false);
        }
        setLoading(false); setCatLoading(false);
      })
      .catch(err => {
        if (requestUrlRef.current !== url) return;
        // Clear the key so the same request can legitimately be retried.
        requestUrlRef.current = null;
        setApiError(err.message); setLoading(false); setCatLoading(false);
      });
  }, [urlKey, sort, page, store, selected, searchParams]);

  /* ── Filters ─────────────────────────────────────────────────────
     No separate request: the layered-nav aggregations arrive with the
     products on /api/category-page (handled in the effect above), which
     keeps the option counts consistent with the result set being shown. */

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
    const p = new URLSearchParams(searchParams.toString());
    if (values.length) {
      p.set(code, values.join(","));
    } else {
      p.delete(code);
    }
    p.delete("page");
    router.replace(`${basePath}?${p}`, { scroll: false });
  };

  /* Remove every applied filter in a single navigation. Looping
     handleFilterChange raced on the same stale searchParams snapshot, so
     only the last code was dropped — this is why "Clear All" left filters
     behind. Keep the system params (sort, search); drop page. */
  const clearAllFilters = () => {
    const p = new URLSearchParams();
    const order = searchParams.get("product_list_order") ?? searchParams.get("sort");
    const q = searchParams.get("q");
    if (order) p.set("product_list_order", order);
    if (q) p.set("q", q);
    router.replace(p.toString() ? `${basePath}?${p}` : basePath, { scroll: false });
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

      {/* ── Page title ─────────────────────────────────────────────
           Mirrors the theme's .page-title-wrapper > .title > h1 > span.base */}
      <div className="page-title-wrapper bg-cover-image">
        <div className="container">
          <div className="title">
            {/* A configured heroTitle is known on the server, so render the
                H1 straight away and only fall back to a skeleton when the
                title has to come from the category name we're still loading. */}
            {catLoading && !displayTitle ? (
              <span className="page-title-skeleton" aria-hidden="true" />
            ) : (
              <h1 id="page-title-heading">
                <span className="base" data-ui-id="page-title-wrapper">
                  {displayTitle}
                </span>
              </h1>
            )}
          </div>
        </div>
      </div>


      {/* ── Breadcrumb (Home > Tyres > Brand > Sailun) ─────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap font-medium">
            <Link href={`/${locale}`} className="hover:text-black transition-colors">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            {(() => {
              const segments = urlKey.split("/").filter(Boolean);
              let acc = "";
              return segments.map((seg, idx) => {
                const isLast = idx === segments.length - 1;
                acc += (acc ? `/${seg}` : seg);
                const segLower = seg.toLowerCase();
                
                let label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
                let href = `/${locale}/${acc}`;

                if (segLower === "tyres") {
                  label = isAr ? "الإطارات" : "Tyres";
                  href = `/${locale}/tyres`;
                } else if (segLower === "brand" || segLower === "brands") {
                  label = isAr ? "الماركة" : "Brand";
                  href = `/${locale}/brands`;
                } else if (isLast && category?.name) {
                  label = category.name;
                }

                return (
                  <React.Fragment key={acc}>
                    <ChevronRight size={12} className="shrink-0 text-gray-400" />
                    {isLast ? (
                      <span className="text-black font-semibold">
                        {catLoading && !category?.name ? (
                          <span className="inline-block bg-gray-200 rounded animate-pulse w-16 h-3 align-middle" />
                        ) : (
                          label
                        )}
                      </span>
                    ) : (
                      <Link href={href} className="hover:text-black transition-colors">
                        {label}
                      </Link>
                    )}
                  </React.Fragment>
                );
              });
            })()}
          </nav>
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
        onClearAll={clearAllFilters}
        dir={dir}
        urlKey={urlKey}
      />

      {/* ── Product grid ───────────────────────────────────────────── */}
      <div className="bg-gray-50 min-h-[600px]">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">

          {/* ── Active Filters Bar (Matches reference screenshot) ───── */}
          {activeFilterCount > 0 && (() => {
            const hasSize = Boolean(selected.width?.length || selected.height?.length || selected.rim?.length);
            const otherFilters = Object.entries(selected).filter(([code]) => code !== "width" && code !== "height" && code !== "rim");

            const widthVal = selected.width?.[0];
            const heightVal = selected.height?.[0];
            const rimVal = selected.rim?.[0];

            const widthOpt = filterGroups.find((g) => g.code === "width")?.options.find((o) => o.value === widthVal || o.label === widthVal)?.label ?? widthVal;
            const heightOpt = filterGroups.find((g) => g.code === "height")?.options.find((o) => o.value === heightVal || o.label === heightVal)?.label ?? heightVal;
            const rimOpt = filterGroups.find((g) => g.code === "rim")?.options.find((o) => o.value === rimVal || o.label === rimVal)?.label ?? rimVal;

            let sizeFormatted = "";
            if (widthOpt && heightOpt && rimOpt) {
              const cleanRim = rimOpt.replace(/^R/i, "");
              sizeFormatted = `${widthOpt}/${heightOpt} R${cleanRim}`;
            } else if (widthOpt && heightOpt) {
              sizeFormatted = `${widthOpt}/${heightOpt}`;
            } else if (widthOpt && rimOpt) {
              const cleanRim = rimOpt.replace(/^R/i, "");
              sizeFormatted = `${widthOpt} R${cleanRim}`;
            } else if (widthOpt) {
              sizeFormatted = `${widthOpt}`;
            } else if (heightOpt) {
              sizeFormatted = `/${heightOpt}`;
            } else if (rimOpt) {
              const cleanRim = rimOpt.replace(/^R/i, "");
              sizeFormatted = `R${cleanRim}`;
            }

            const handleRemoveSizeFilter = () => {
              const p = new URLSearchParams(searchParams.toString());
              p.delete("width");
              p.delete("height");
              p.delete("rim");
              p.delete("page");
              router.replace(p.toString() ? `${basePath}?${p}` : basePath, { scroll: false });
            };

            return (
              <div className="bg-white border border-gray-200 rounded-lg p-2.5 sm:p-3 mb-4 flex items-center justify-between flex-wrap gap-2.5 shadow-2xs">
                <div className="flex items-center flex-wrap gap-2">
                  {/* Single Combined Size Pill: "✕ 255/50 R20" */}
                  {hasSize && sizeFormatted && (
                    <button
                      type="button"
                      onClick={handleRemoveSizeFilter}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 rounded-md text-[13px] font-bold text-gray-900 transition-colors shadow-2xs group cursor-pointer"
                      title={isAr ? "إزالة مقاس الإطار" : `Remove ${sizeFormatted}`}
                    >
                      <span className="text-[#ed1c24] font-black text-xs group-hover:scale-110 transition-transform">✕</span>
                      <span>{sizeFormatted}</span>
                    </button>
                  )}

                  {/* Other Selected Filters (Brand, Season, etc.) */}
                  {otherFilters.map(([code, values]) => {
                    const group = filterGroups.find((g) => g.code === code);
                    return values.map((val) => {
                      const opt = group?.options.find((o) => o.value === val || o.label.toLowerCase() === val.toLowerCase());
                      const label = opt?.label ?? val;
                      return (
                        <button
                          key={`${code}-${val}`}
                          type="button"
                          onClick={() => {
                            const next = values.filter((v) => v !== val);
                            handleFilterChange(code, next);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-gray-300 rounded-md text-[13px] font-bold text-gray-900 transition-colors shadow-2xs group cursor-pointer"
                          title={isAr ? "إزالة الفلتر" : `Remove ${label}`}
                        >
                          <span className="text-[#ed1c24] font-black text-xs group-hover:scale-110 transition-transform">✕</span>
                          <span>{label}</span>
                        </button>
                      );
                    });
                  })}
                </div>

                {/* Clear All Button */}
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-md text-[13px] font-bold text-gray-900 transition-colors shadow-2xs ml-auto cursor-pointer"
                >
                  <span className="text-[#ed1c24] font-black text-xs">✕</span>
                  <span>{isAr ? "مسح الكل" : "Clear All"}</span>
                </button>
              </div>
            );
          })()}

          {/* ── Sort & Filter Controls (Matches reference screenshot) ─ */}
          <div className="flex items-center justify-end gap-2.5 mb-5">
            <SortBar value={sort} onChange={setSort} isAr={isAr} />
            <button
              onClick={() => setFilterOpen(true)}
              className="relative w-10 h-10 flex items-center justify-center bg-[#ed1c24] hover:bg-[#c6181d] text-white rounded-xl transition-colors shrink-0 cursor-pointer shadow-2xs"
              aria-label={isAr ? "تصفية" : "Filter"}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black text-white text-[9px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
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
            <ul className="products-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5 list-none p-0 m-0">
              {products.map(product => (
                <TyreListingCard key={product.id} product={product} locale={locale} />
              ))}
            </ul>
          )}
          <Pagination current={page} total={totalPages} onChange={setPage} locale={locale} />
        </div>
      </div>

      {/* ── SEO + FAQ ──────────────────────────────────────────────── */}
      <CategorySeoSection content={cmsContent} loading={cmsLoading} dir={dir} />
      <CategoryFaqSection faqs={faqs} loading={faqLoading} dir={dir} />

      {/* ── Sticky bottom search bar (Same as Homepage) ────────────── */}
      <StickyBottomFinder locale={locale} categoryUid={category?.uid} basePath={basePath} />
    </div>
  );
}
