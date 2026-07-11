"use client";

import { useState, useEffect, useId } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw, Wifi, WifiOff } from "lucide-react";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
// import { allProducts } from "@/lib/data";
import type { Product } from "@/lib/data";
import type { ApiProductsResponse } from "@/lib/magento";
import { APP_CONFIG } from "@/src/config/app-config";

/* Featured-category tabs are centralized in APP_CONFIG.homepage — no
   category UIDs are hardcoded in the component. */
const TABS = APP_CONFIG.homepage.featuredCategories;

type TabId = (typeof TABS)[number]["id"];

const PAGE_SIZE = 12;

/* ─────────────────────────────────────────────────────────────────
   PER-TAB CACHE + FETCH STATE
   Each tab is its own Magento category, so we fetch on demand and
   cache the result instead of filtering a single pool client-side.
───────────────────────────────────────────────────────────────── */
type TabData = { products: Product[]; total: number; source: "api" | "fallback" };
type Status = "idle" | "loading" | "error";

/* ─────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────── */
export default function FeaturedProducts() {
  const sectionId = useId();

  const [activeTab, setActiveTab] = useState<TabId>("All");
  const [cache, setCache] = useState<Record<string, TabData>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* ── Fetch one category from the GraphQL proxy ─────────────────── */
  async function loadTab(tab: (typeof TABS)[number], force = false) {
    if (!force && cache[tab.id]) { setStatus("idle"); return; }

    setStatus("loading");
    setErrorMsg(null);

    try {
      const res = await fetch(
        `/api/products?categoryUid=${encodeURIComponent(tab.uid)}&pageSize=${PAGE_SIZE}`,
        { cache: "no-store" }
      );
      const json = (await res.json()) as ApiProductsResponse;

      /* Auth error — surface the GraphQL token hint */
      if (res.status === 401) {
        setStatus("error");
        setErrorMsg("GraphQL authentication failed. Add your MAGENTO_API_TOKEN to .env.local.");
        return;
      }

      /* Other error — fall back to static data for this tab */
      if (!res.ok || json.error) {
        console.warn("[FeaturedProducts] API error, using static fallback:", json.error);
        setCache((c) => ({
          ...c,
          // [tab.id]: { products: allProducts, total: allProducts.length, source: "fallback" },
        }));
        setStatus("idle");
        return;
      }

      /* Success */
      setCache((c) => ({
        ...c,
        [tab.id]: {
          products: json.products,
          total: json.total ?? json.products.length,
          source: json.products.length > 0 ? "api" : "fallback",
        },
      }));
      setStatus("idle");
    } catch {
      console.warn("[FeaturedProducts] Network error, using static fallback.");
      setCache((c) => ({
        ...c,
        // [tab.id]: { products: allProducts, total: allProducts.length, source: "fallback" },
      }));
      setStatus("idle");
    }
  }

  /* ── Load the active tab whenever it changes (cached after first) ─ */
  useEffect(() => {
    const tab = TABS.find((t) => t.id === activeTab)!;
    loadTab(tab);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = cache[activeTab];
  const filtered = status === "loading" ? [] : current?.products ?? [];

  /* ── Source pill ───────────────────────────────────────────────── */
  const sourcePill =
    status !== "loading" && current ? (
      current.source === "api" ? (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
          <Wifi size={10} /> Live from GraphQL
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink/40 bg-ink/5 px-2.5 py-1 rounded-full">
          <WifiOff size={10} /> Static data
        </span>
      )
    ) : null;

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  return (
    <section className="py-20 lg:py-28 bg-cream" aria-labelledby={sectionId}>
      <div className="container">

        {/* ── Section header ──────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <span className="eyebrow mb-3 block">
              <span className="w-5 h-px bg-ink-muted" />
              Carefully selected
            </span>
            <h2 id={sectionId} className="section-title flex flex-wrap items-center gap-3">
              Bestsellers
              {sourcePill}
            </h2>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/55 hover:text-ink transition-colors group self-start sm:self-auto"
          >
            Shop all products
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* ── Auth error banner ───────────────────────────────── */}
        {status === "error" && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800 mb-1">
                Magento GraphQL authentication required
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">{errorMsg}</p>
              <code className="block mt-2 text-[11px] bg-amber-100 text-amber-800 rounded-lg px-3 py-2 font-mono">
                MAGENTO_API_TOKEN=&lt;your-bearer-token&gt;
              </code>
            </div>
            <button
              onClick={() => loadTab(TABS.find((t) => t.id === activeTab)!, true)}
              className="flex-shrink-0 flex items-center gap-2 text-xs font-semibold text-amber-700 border border-amber-300 bg-white px-4 py-2.5 rounded-xl hover:bg-amber-50 transition-colors"
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {/* ── Category tabs ───────────────────────────────────── */}
        <div
          role="tablist"
          aria-label="Filter products by category"
          className="flex items-center gap-2 mb-10 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = cache[tab.id]?.total;          // only known once loaded
            const isLoading = status === "loading";

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls="product-grid"
                disabled={isLoading}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "flex-shrink-0 inline-flex items-center gap-2 rounded-full text-sm font-semibold",
                  "px-5 py-2.5 transition-all duration-200 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  isActive
                    ? "bg-ink text-white shadow-[0_4px_14px_rgba(11,11,15,0.22)] scale-[1.02]"
                    : "bg-white text-ink/55 border border-ink/10 hover:border-ink/25 hover:text-ink",
                ].join(" ")}
              >
                {tab.label}
                {count != null && (
                  <span
                    className={[
                      "min-w-[20px] h-5 px-1 rounded-full text-[10px] font-bold",
                      "flex items-center justify-center transition-colors",
                      isActive ? "bg-white/20 text-white" : "bg-cream text-ink/40",
                    ].join(" ")}
                  >
                    {count > 999 ? `${Math.floor(count / 1000)}k+` : count}
                  </span>
                )}
              </button>
            );
          })}

          {status === "loading" && (
            <span className="ml-2 text-ink/30">
              <RefreshCw size={14} className="animate-spin" />
            </span>
          )}
        </div>

        {/* ── Product grid ────────────────────────────────────── */}
        <div
          id="product-grid"
          role="tabpanel"
          aria-live="polite"
          aria-busy={status === "loading"}
        >
          {/* Loading — show skeletons */}
          {status === "loading" && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
              {[...Array(PAGE_SIZE)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Success — animated staggered cards */}
          {status !== "loading" && filtered.length > 0 && (
            <div
              key={activeTab}
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10"
            >
              {filtered.map((product, i) => (
                <div
                  key={product.id}
                  className="animate-fade-in"
                  style={{
                    animationDelay: `${Math.min(i * 45, 270)}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {status !== "loading" && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                  stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <p className="text-ink/40 font-medium">
                No {activeTab !== "All" ? activeTab : ""} products found
              </p>
              <button
                onClick={() => setActiveTab("All")}
                className="btn-secondary text-xs px-5 py-2"
              >
                Show all products
              </button>
            </div>
          )}
        </div>

        {/* ── Count + source row ──────────────────────────────── */}
        {status !== "loading" && current && filtered.length > 0 && (
          <p className="text-center text-xs text-ink/30 mt-8 flex items-center justify-center gap-2">
            Showing {filtered.length} of {current.total.toLocaleString()} product
            {current.total !== 1 ? "s" : ""}
            {activeTab !== "All" && ` in ${TABS.find((t) => t.id === activeTab)!.label}`}
            {current.source === "api" && (
              <span className="text-emerald-500">· synced from Magento</span>
            )}
          </p>
        )}

        {/* ── Bottom CTA ──────────────────────────────────────── */}
        <div className="mt-10 text-center">
          <Link href="/" className="btn-primary text-sm px-8 py-3.5">
            View all products
            <ArrowRight size={15} />
          </Link>
        </div>

      </div>
    </section>
  );
}
