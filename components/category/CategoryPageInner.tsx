"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SORT_OPTS } from "@/components/category/sortOptions";
import TyreListingCard from "@/components/TyreListingCard";
import TyreListingCardSkeleton from "@/components/TyreListingCardSkeleton";
import StaggeredTyreCard from "@/components/StaggeredTyreCard";
import TyreFinder from "@/components/TyreFinder";
import CategoryFilterBar from "@/components/category/CategoryFilterBar";
import StickyBottomFinder from "@/components/home/partora/StickyBottomFinder";
import CategorySeoSection from "@/components/CategorySeoSection";
import TyreGuideSeoContent from "@/components/TyreGuideSeoContent";
import CategoryFaqSection, { type FaqItem } from "@/components/CategoryFaqSection";
import { storeCode, type Locale } from "@/lib/i18n";
import FilterPanel, { type FilterGroup } from "@/components/FilterPanel";
import type { Product } from "@/lib/data";
import Pagination from "@/components/tyre/Pagination";
import { buildBrandSlug } from "@/lib/filterBuilder";

const PAGE_SIZE = 12;

const SIZE_KEYS = new Set([
  "width",
  "height",
  "haight",
  "rim",
  "width_rear",
  "rear_width",
  "rwidth",
  "haight_rear",
  "height_rear",
  "rear_height",
  "rheight",
  "rim_rear",
  "rear_rim",
  "rrim",
]);

const SYSTEM_PARAMS = new Set([
  "page",
  "sort",
  "product_list_order",
  "q",
  "search",
  "category_uid",
  "category_id",
  "categoryUid",
  "store",
  "pageSize",
  "product_list_limit",
]);

interface CategoryInfo {
  uid: string;
  name: string;
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  /** The real on-page H1 (Magento's category_page_title field) — distinct
      from `name` (breadcrumbs/nav) and `metaTitle` (<title> tag). Shown
      verbatim, in its own casing, when Magento has it. */
  pageTitle?: string | null;
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
function SortBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const cur = SORT_OPTS.find(o => o.value === value) ?? SORT_OPTS[0];

  return (
    <div className="relative">

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
                {opt.en}
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
  /** Render the TyreFinder widget under the hero (tyre categories). */
  showTyreFinder?: boolean;
  /** Hide the top hero banner (for landing pages that provide their own) */
  hideHeroBanner?: boolean;
  /** Hide the breadcrumb bar */
  hideBreadcrumbs?: boolean;
  /** Custom base path for pagination/sort/filter URL updates */
  basePath?: string;
  /** Fixed brand filter to apply to all queries (e.g. "Kumho") */
  brandFilter?: string;
  /** Brand logo URL to display in hero banner if applicable */
  brandLogo?: string;
  /** Brand description from API */
  brandDescription?: string | null;
  /** Tyre-size filters parsed from a canonical /tyres/<w-h-r> slug URL —
      seeded into `selected` the same way `brandFilter` already is, so the
      existing filter/fetch logic below needs no changes at all. */
  sizeFilters?: Record<string, string>;
  /** Non-size filters (year, pattern, etc.) parsed from a canonical
      /tyres/<code>/<value> slug URL — same seeding mechanism as
      `sizeFilters`, kept as its own prop so the size-URL wiring above is
      never touched by this. */
  pathFilters?: Record<string, string>;
}

/* ════════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════════ */
export default function CategoryPageInner({
  urlKey,
  locale,
  heroTitle,
  showTyreFinder,
  hideHeroBanner,
  hideBreadcrumbs,
  basePath: basePathProp,
  brandFilter,
  brandLogo,
  brandDescription,
  sizeFilters,
  pathFilters,
}: CategoryPageInnerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dir = "ltr";
  const store = storeCode(locale);
  const basePath = basePathProp ?? `/${urlKey}`;

  // "low-to-high" is the real default — matches the live site's actual
  // default ordering (Magento's own store-level "Default Sort By"), and
  // matches what the toolbar button already displays as selected
  // (SORT_OPTS.find(...) ?? SORT_OPTS[0], which is "Price: Low to High")
  // even when no explicit sort param was ever set.
  const sort = searchParams.get("product_list_order") ?? searchParams.get("sort") ?? "low-to-high";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));

  const [category, setCategory] = useState<CategoryInfo | null>(null);
  const [catLoading, setCatLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  /* Front+rear (staggered) pairing now happens server-side in
     /api/category-page, which also paginates by the actual pair count
     instead of Magento's front-only total — see that route for why.
     `null` means this wasn't a staggered request; `total: 0` means one was
     made but nothing paired, so the plain `products` listing is shown instead. */
  const [staggered, setStaggered] = useState<{
    total: number;
    totalPages: number;
    products: Product[];
    rearProducts: Product[];
    bundlePrices: (number | undefined)[];
    frontSet2Prices: (number | undefined)[];
    rearSet2Prices: (number | undefined)[];
  } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(false);
  /* Lazily seeded from the URL on first render (not an empty object then
     patched in a follow-up effect) — otherwise the very first product
     request fires with zero filters before this hydrates, so the page
     flashes the full unfiltered listing before the real, URL-scoped one
     replaces it a moment later. */
  const [selected, setSelected] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    for (const [key, val] of searchParams.entries()) {
      if (SYSTEM_PARAMS.has(key)) continue;
      if (val) initial[key] = val.split(",").filter(Boolean);
    }
    if (brandFilter && !initial.mgs_brand) {
      initial.mgs_brand = [brandFilter];
    }
    if (sizeFilters) {
      for (const [key, val] of Object.entries(sizeFilters)) {
        if (val && !initial[key]) initial[key] = [val];
      }
    }
    if (pathFilters) {
      for (const [key, val] of Object.entries(pathFilters)) {
        if (val && !initial[key]) initial[key] = [val];
      }
    }
    return initial;
  });

  // Sync URL searchParams to selected state when the query changes after mount.
  useEffect(() => {
    const initial: Record<string, string[]> = {};
    for (const [key, val] of searchParams.entries()) {
      if (SYSTEM_PARAMS.has(key)) continue;
      if (val) {
        initial[key] = val.split(",").filter(Boolean);
      }
    }
    if (brandFilter && !initial.mgs_brand && basePath.startsWith("/tyres/brand/")) {
      initial.mgs_brand = [brandFilter];
    }
    if (sizeFilters) {
      for (const [key, val] of Object.entries(sizeFilters)) {
        if (val && !initial[key]) initial[key] = [val];
      }
    }
    if (pathFilters) {
      for (const [key, val] of Object.entries(pathFilters)) {
        if (val && !initial[key]) initial[key] = [val];
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
  }, [searchParams, brandFilter, basePath, sizeFilters, pathFilters]);

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
    if (brandFilter && !selected.mgs_brand?.length && basePath.startsWith("/tyres/brand/")) {
      p.set("mgs_brand", brandFilter);
    }

    const url = `/api/category-page?${p}`;

    // Same inputs as the request already in flight / just completed.
    if (requestUrlRef.current === url) return;
    requestUrlRef.current = url;

    setLoading(true); setCatLoading(true); setApiError(null); setFiltersLoading(true);

    fetch(url, { cache: "no-store" })
      .then(async (r) => {
        const text = await r.text();
        try {
          return JSON.parse(text);
        } catch {
          throw new Error("Unable to load products. Please refresh and try again.");
        }
      })
      .then((j: {
        error?: string;
        category?: CategoryInfo;
        products?: Product[];
        total?: number;
        totalPages?: number;
        staggered?: {
          total?: number;
          totalPages?: number;
          products?: Product[];
          rearProducts?: Product[];
          bundlePrices?: (number | undefined)[];
          frontSet2Prices?: (number | undefined)[];
          rearSet2Prices?: (number | undefined)[];
        } | null;
        filters?: FilterGroup[];
      }) => {
        if (requestUrlRef.current !== url) return;
        if (j.error && !j.products?.length) { setApiError(j.error); }
        if (j.category) setCategory(j.category);
        const items: Product[] = j.products ?? [];
        setProducts(items);
        setTotal(j.total ?? 0);
        setTotalPages(j.totalPages ?? 1);

        if (j.staggered) {
          let pairs: {
            front: Product; rear: Product; bundlePrice: number | undefined;
            frontSet2Price: number | undefined; rearSet2Price: number | undefined;
          }[] = (j.staggered.products ?? []).map(
            (front: Product, i: number) => ({
              front,
              rear: j.staggered?.rearProducts?.[i] as Product,
              bundlePrice: j.staggered?.bundlePrices?.[i],
              frontSet2Price: j.staggered?.frontSet2Prices?.[i],
              rearSet2Price: j.staggered?.rearSet2Prices?.[i],
            }),
          );
          // Sort by the real bundle price (kleverTyreBundles) — the actual
          // "Set of 4" number shown on the card, not just the front tyre's
          // own unit price.
          if (sort === "high-to-low") pairs = [...pairs].sort((a, b) => (b.bundlePrice ?? 0) - (a.bundlePrice ?? 0));
          else if (sort === "low-to-high") pairs = [...pairs].sort((a, b) => (a.bundlePrice ?? 0) - (b.bundlePrice ?? 0));
          setStaggered({
            total: j.staggered.total ?? 0,
            totalPages: j.staggered.totalPages ?? 1,
            products: pairs.map((p) => p.front),
            rearProducts: pairs.map((p) => p.rear),
            bundlePrices: pairs.map((p) => p.bundlePrice),
            frontSet2Prices: pairs.map((p) => p.frontSet2Price),
            rearSet2Prices: pairs.map((p) => p.rearSet2Price),
          });
        } else {
          setStaggered(null);
        }
        if (Array.isArray(j.filters)) {
          setFilterGroups(j.filters);
        } else {
          setFilterGroups([]);
        }
        setFiltersLoading(false);
        setLoading(false); setCatLoading(false);
      })
      .catch((err: Error) => {
        if (requestUrlRef.current !== url) return;
        requestUrlRef.current = null;
        setApiError(err.message || "Failed to load products");
        setLoading(false);
        setCatLoading(false);
        setFiltersLoading(false);
        setFilterGroups([]);
      });
  }, [urlKey, sort, page, store, selected, searchParams, brandFilter, basePath]);

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

  /* ── SEO / FAQ from category or brand description ─────────────── */
  useEffect(() => {
    const desc = brandDescription || category?.description;
    if (!desc) { setCmsLoading(false); setFaqLoading(false); return; }
    const raw = desc
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&").replace(/\\"/g, '"')
      .replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");

    const faqIdx = raw.search(/<div[^>]*class=["']faq-section["'][^>]*>/i);
    let seoHtml = faqIdx >= 0 ? raw.substring(0, faqIdx) : raw;
    const h2Idx = seoHtml.search(/<h2[^>]*>/i);
    if (h2Idx >= 0) seoHtml = seoHtml.substring(h2Idx);

    setCmsContent(seoHtml.trim() || null); setCmsLoading(false);
    setFaqs(parseFaqsFromHtml(raw)); setFaqLoading(false);
  }, [category, brandDescription]);

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
    setSelected((prev) => {
      const next = { ...prev };
      if (values.length) {
        next[code] = values;
      } else {
        delete next[code];
      }
      return next;
    });
    requestUrlRef.current = null;

    const isBrand = code === "mgs_brand" || code === "brand";

    // When a brand is selected on general /tyres or brand page, always route to the canonical /tyres/brand/{brand-slug} SEO URL
    if (isBrand && values.length === 1 && (basePath === "/tyres" || basePath.startsWith("/tyres/brand/"))) {
      const brandGroup = filterGroups.find((g) => g.code === code || g.code === "mgs_brand" || g.code === "brand");
      const opt = brandGroup?.options.find((o) => o.value === values[0] || o.label === values[0]);
      const brandName = opt?.label || values[0];
      const brandSlug = buildBrandSlug(brandName);
      if (brandSlug) {
        const p = new URLSearchParams(searchParams.toString());
        p.delete("mgs_brand");
        p.delete("brand");
        p.delete("page");
        const query = p.toString() ? `?${p}` : "";
        router.replace(`/tyres/brand/${brandSlug}${query}`, { scroll: false });
        return;
      }
    }

    // If on a brand sub-route and brand is cleared, navigate back to /tyres preserving other filters
    if (isBrand && !values.length && basePath.startsWith("/tyres/brand/")) {
      const p = new URLSearchParams(searchParams.toString());
      p.delete("mgs_brand");
      p.delete("brand");
      p.delete("page");
      router.replace(p.toString() ? `/tyres?${p}` : "/tyres", { scroll: false });
      return;
    }

    const p = new URLSearchParams(searchParams.toString());
    if (values.length) {
      p.set(code, values.join(","));
    } else {
      p.delete(code);
    }
    p.delete("page");
    router.replace(`${basePath}?${p}`, { scroll: false });
  };

  /* Remove every applied filter in a single navigation. */
  const clearAllFilters = () => {
    setSelected({});
    requestUrlRef.current = null;
    const p = new URLSearchParams();
    const order = searchParams.get("product_list_order") ?? searchParams.get("sort");
    const q = searchParams.get("q");
    if (order) p.set("product_list_order", order);
    if (q) p.set("q", q);
    const targetBase = basePath.startsWith("/tyres/brand/") ? "/tyres" : basePath;
    router.replace(p.toString() ? `${targetBase}?${p}` : targetBase, { scroll: false });
  };

  const sidebarFilterCount = Object.entries(selected)
    .filter(([k]) => !SYSTEM_PARAMS.has(k) && !SIZE_KEYS.has(k))
    .reduce((s, [, v]) => s + v.length, 0);

  const hasVisibleFilters = filterGroups.some(
    (f) => !SIZE_KEYS.has(f.code.toLowerCase()) && f.options && f.options.length > 0
  );

  const hasActiveSizeFilter = Array.from(SIZE_KEYS).some(
    (k) => (selected[k]?.length ?? 0) > 0
  );
  const showActiveFiltersBar = hasActiveSizeFilter || sidebarFilterCount > 0;
  const isLoading = catLoading || (!!category?.uid && loading);

  // Paginate by the paired count while a staggered search is actually
  // showing paired cards; fall back to the plain front-only count once
  // there's nothing to pair (see the /api/category-page staggered branch).
  const isStaggeredDisplay = !!staggered && staggered.total > 0;
  const displayTotalPages = isStaggeredDisplay ? staggered.totalPages : totalPages;

  // heroTitle (a manual per-slug override, src/config/routes.ts) wins when
  // configured; otherwise use Magento's real category_page_title verbatim
  // (it's already in the right display casing, e.g. "Buy Car Battery
  // Online in UAE" — matches the live site's actual H1); only fall back to
  // the uppercased category name when Magento has neither.
  const displayTitle = heroTitle ?? category?.pageTitle ?? category?.name?.toUpperCase() ?? "";

  const categoryBgImage = (function getCategoryHeroBanner(k: string, t: string) {
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
    if (key.includes("battery") || title.includes("battery")) {
      return "/images/bg/car-battery-banner.png";
    }
    return null;
  })(urlKey, displayTitle);

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
  };
  const hasBakedInTitle = !!categoryBgImage && BAKED_IN_TITLE_BANNERS.has(categoryBgImage);
  const bannerAspectRatio = categoryBgImage ? BANNER_ASPECT_RATIOS[categoryBgImage] : undefined;

  const heroBannerStyle = categoryBgImage
    ? {
        backgroundImage: `url("${categoryBgImage}")`,
        backgroundSize: "cover" as const,
        backgroundPosition: "center" as const,
        backgroundRepeat: "no-repeat" as const,
        ...(bannerAspectRatio ? { aspectRatio: bannerAspectRatio } : {}),
      }
    : undefined;

  const productsLabel = `${total.toLocaleString()} Tyres`;

  const breadcrumbLabel =
    brandFilter ||
    category?.name ||
    (basePath === "/tyres" || basePath.startsWith("/tyres") ? "Tyres" : undefined) ||
    (urlKey ? urlKey.replace(/-/g, " ") : undefined) ||
    displayTitle;

  return (
    <div dir={dir}>

      {/* ── PLP Hero Banner (Dark-to-Light Red Gradient Card) ─────────────── */}
      {!hideHeroBanner && (
        <div className="bg-gray-50 pt-2 pb-0.5">
          <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#780a0f] via-[#b31219] to-[#ed1c24] px-3.5 py-4 sm:p-5 md:p-6 shadow-md border border-red-900/15">
              {/* Background ambient lighting and subtle decorative wave */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-black/25 blur-3xl pointer-events-none" />
              
              {/* ── Main Banner Content (Centered) ── */}
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                {/* Banner Content */}
                <div className="max-w-5xl mx-auto text-center flex flex-col items-center justify-center">
                  {catLoading && !displayTitle ? (
                    <div className="space-y-2 w-full flex flex-col items-center">
                      <div className="h-7 sm:h-8 bg-white/20 rounded-lg w-3/4 animate-pulse mx-auto" />
                      <div className="h-3.5 bg-white/10 rounded w-1/2 animate-pulse mx-auto" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center text-center w-full px-1">
                        <h1
                          id="page-title-heading"
                          className="text-base sm:text-xl md:text-2xl lg:text-[26px] font-black text-white tracking-tight leading-snug sm:leading-tight drop-shadow-sm text-center mx-auto"
                        >
                          <span className="base relative z-10" data-ui-id="page-title-wrapper">
                            {displayTitle}
                          </span>
                        </h1>
                      </div>

                      <p className="mt-1 sm:mt-1.5 text-[11px] sm:text-xs md:text-[13px] text-white/95 leading-relaxed font-normal max-w-3xl mx-auto text-center px-2">
                        {brandFilter
                          ? `Shop genuine ${brandFilter} tyres online in UAE at TyresWorld. Free mobile tyre fitting in Dubai, Abu Dhabi & Sharjah, manufacturer warranty, and best prices.`
                          : "Shop premium tyres in UAE with free mobile fitting, manufacturer warranty, and best prices across Dubai, Abu Dhabi, and UAE."}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* ── Breadcrumb Inside Banner (Centered Connected Ribbon Style) ── */}
              {!hideBreadcrumbs && displayTitle && (
                <div className="relative z-10 flex justify-center w-full mt-3 sm:mt-4 max-w-full px-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <Breadcrumbs label={breadcrumbLabel} variant="banner" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Breadcrumb fallback (when hero banner is hidden) ─────────── */}
      {hideHeroBanner && !hideBreadcrumbs && displayTitle && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-center w-full">
            <Breadcrumbs label={breadcrumbLabel} variant="bar" />
          </div>
        </div>
      )}

      {/* ── Filter drawer ──────────────────────────────────────────── */}
      {(hasVisibleFilters || sidebarFilterCount > 0) && (
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
      )}

      {/* ── Product grid ───────────────────────────────────────────── */}
      <div className="bg-gray-50">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-1 sm:pt-1.5 pb-8 sm:pb-12">

          {/* ── Horizontal Search Filter Bar (Matches reference screenshot) ── */}
          <CategoryFilterBar
            selected={selected}
            filterGroups={filterGroups}
            onOpenMoreFilters={() => setFilterOpen(true)}
            onChange={handleFilterChange}
            onClearAll={clearAllFilters}
            brandFilter={brandFilter}
            basePath={basePath}
            categoryUid={category?.uid}
            total={total}
            sort={sort}
            onSortChange={setSort}
          />

          {/* ── Toolbar: Total Count + Sort & Filter Controls ─ */}
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-2.5 flex-wrap">
            <div className="text-xs sm:text-sm font-black text-gray-900">
              {total > 0 && <span>{productsLabel}</span>}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {filterGroups.length === 0 && <SortBar value={sort} onChange={setSort} />}
            </div>
          </div>

          {catLoading && products.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <TyreListingCardSkeleton key={i} />)}
            </div>
          ) : apiError ? (
            <div className="text-center py-28">
              <p className="text-4xl mb-4">⚠️</p>
              <p className="text-gray-500 font-medium">{apiError}</p>
            </div>
          ) : products.length === 0 && !loading ? (
            <div className="text-center py-28">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-gray-400 text-lg font-medium">
                {"No tyres found."}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {"Try a different search or check back later."}
              </p>
            </div>
          ) : (
            <div className={`relative transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
              {(() => {
                if (isStaggeredDisplay) {
                  return (
                    <ul className="products-grid grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 list-none p-0 m-0">
                      {staggered.products.map((front, idx) => (
                        <StaggeredTyreCard
                          key={`${front.id}-${staggered.rearProducts[idx]?.id}-${idx}`}
                          frontProduct={front}
                          rearProduct={staggered.rearProducts[idx]}
                          bundlePrice={staggered.bundlePrices[idx]}
                          frontSet2Price={staggered.frontSet2Prices[idx]}
                          rearSet2Price={staggered.rearSet2Prices[idx]}
                          locale={locale}
                        />
                      ))}
                    </ul>
                  );
                }

                return (
                  <ul className="products-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5 list-none p-0 m-0 items-end">
                    {products.map(product => (
                      <TyreListingCard
                        key={product.id}
                        product={product}
                        locale={locale}
                        enableHoverZoom
                        vehicleIcon={urlKey.includes("motorcycle") || urlKey.includes("motorbike") ? "bike" : "car"}
                      />
                    ))}
                  </ul>
                );
              })()}
              <Pagination current={page} total={displayTotalPages} onChange={setPage} locale={locale} />
            </div>
          )}
        </div>
      </div>

      {/* ── SEO + FAQ ──────────────────────────────────────────────── */}
      <CategorySeoSection content={cmsContent} loading={cmsLoading} dir={dir} />
      <TyreGuideSeoContent locale={locale} />
      <CategoryFaqSection faqs={faqs} loading={faqLoading} dir={dir} />

      {/* ── Sticky bottom search bar (Same as Homepage) ────────────── */}
      <StickyBottomFinder locale={locale} categoryUid={category?.uid} basePath={basePath} />
    </div>
  );
}
