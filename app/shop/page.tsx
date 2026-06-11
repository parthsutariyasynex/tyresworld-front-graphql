"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Grid3X3, List, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import FilterSidebar from "@/components/shop/FilterSidebar";
import SortDropdown from "@/components/shop/SortDropdown";
import Pagination from "@/components/shop/Pagination";
import type { Product } from "@/lib/data";
import type { FilterGroup } from "@/lib/magento";

// Magento store root ("All Products") — same uid the homepage "All" tab uses.
const ROOT_CATEGORY_UID = "Mg==";
const PAGE_SIZE = 12;

// Params that are NOT attribute filters.
const RESERVED = new Set(["categoryUid", "search", "sort", "page"]);

type FetchState = {
  loading: boolean;
  products: Product[];
  total: number;
  totalPages: number;
  groups: FilterGroup[];
  error?: string;
};

function ShopInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = searchParams.get("sort") || "featured";
  const page = Math.max(1, Number(searchParams.get("page") || 1));

  const [grid, setGrid] = useState<"grid" | "list">("grid");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [state, setState] = useState<FetchState>({
    loading: true, products: [], total: 0, totalPages: 1, groups: [],
  });

  /* ── Selected attribute filters (every non-reserved param) ─────── */
  const selected = useMemo(() => {
    const m: Record<string, string[]> = {};
    searchParams.forEach((val, key) => {
      if (!RESERVED.has(key) && val) m[key] = val.split(",").filter(Boolean);
    });
    return m;
  }, [searchParams]);

  /* ── Build the /api/products URL from the current params ───────── */
  const apiUrl = useMemo(() => {
    const p = new URLSearchParams(searchParams.toString());
    if (!p.get("categoryUid")) p.set("categoryUid", ROOT_CATEGORY_UID);
    p.set("pageSize", String(PAGE_SIZE));
    return `/api/products?${p.toString()}`;
  }, [searchParams]);

  /* ── Fetch products + aggregations whenever the URL changes ────── */
  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true }));
    fetch(apiUrl, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!active) return;
        setState({
          loading: false,
          products: j.products ?? [],
          total: j.total ?? 0,
          totalPages: j.totalPages ?? 1,
          groups: j.aggregations ?? [],
          error: j.error,
        });
      })
      .catch(() => {
        if (active) setState((s) => ({ ...s, loading: false, error: "Failed to load products." }));
      });
    return () => { active = false; };
  }, [apiUrl]);

  /* ── URL writers (filters/sort/page persist in query params) ───── */
  const updateParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(searchParams.toString());
      mutate(p);
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const onToggleFilter = useCallback((code: string, value: string) => {
    updateParams((p) => {
      const cur = p.get(code)?.split(",").filter(Boolean) ?? [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      if (next.length) p.set(code, next.join(",")); else p.delete(code);
      p.delete("page"); // any filter change resets to page 1
    });
  }, [updateParams]);

  const onClearFilters = useCallback(() => {
    updateParams((p) => {
      Array.from(p.keys()).forEach((k) => { if (!RESERVED.has(k)) p.delete(k); });
      p.delete("page");
    });
  }, [updateParams]);

  const onSortChange = useCallback((v: string) => {
    updateParams((p) => { p.set("sort", v); p.delete("page"); });
  }, [updateParams]);

  const onPageChange = useCallback((n: number) => {
    updateParams((p) => { p.set("page", String(n)); });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [updateParams]);

  /* ── Active filter chips (resolve value → human label) ─────────── */
  const labelFor = useCallback(
    (code: string, value: string) =>
      state.groups.find((g) => g.code === code)?.options.find((o) => o.value === value)?.label ?? value,
    [state.groups]
  );
  const activeCount = Object.values(selected).reduce((n, v) => n + v.length, 0);

  return (
    <>
      {/* Page header */}
      <div className="bg-cream py-12 lg:py-16 border-b border-ink/5">
        <div className="container">
          <p className="text-xs text-ink/40 mb-3">
            <a href="/" className="hover:text-ink transition-colors">Home</a> / <span className="text-ink">Shop</span>
          </p>
          <h1 className="section-title mb-2">All Products</h1>
          <p className="text-ink/50 text-sm">
            {state.loading ? "Loading…" : `${state.total.toLocaleString()} product${state.total !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <div className="container py-10 lg:py-14">
        <div className="flex gap-10">
          {/* Sidebar (desktop) */}
          <div className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24">
              <FilterSidebar
                groups={state.groups}
                selected={selected}
                onToggle={onToggleFilter}
                onClear={onClearFilters}
                loading={state.loading}
              />
            </div>
          </div>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-7 pb-5 border-b border-ink/6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-2 text-sm font-medium border border-ink/10 px-3.5 py-2 rounded-xl hover:border-ink/25 transition-colors"
                >
                  <SlidersHorizontal size={15} />
                  Filters
                  {activeCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                      {activeCount}
                    </span>
                  )}
                </button>
                <span className="text-sm text-ink/40 hidden sm:inline">
                  {state.loading ? "…" : `${state.total.toLocaleString()} results`}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <SortDropdown value={sort} onChange={onSortChange} />
                <div className="hidden sm:flex items-center bg-cream rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setGrid("grid")}
                    className={`p-2 rounded-lg transition-colors ${grid === "grid" ? "bg-white shadow-card text-ink" : "text-ink/40 hover:text-ink"}`}
                    aria-label="Grid view"
                  >
                    <Grid3X3 size={16} />
                  </button>
                  <button
                    onClick={() => setGrid("list")}
                    className={`p-2 rounded-lg transition-colors ${grid === "list" ? "bg-white shadow-card text-ink" : "text-ink/40 hover:text-ink"}`}
                    aria-label="List view"
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {activeCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {Object.entries(selected).flatMap(([code, vals]) =>
                  vals.map((v) => (
                    <button
                      key={`${code}:${v}`}
                      onClick={() => onToggleFilter(code, v)}
                      className="flex items-center gap-1.5 text-xs font-medium bg-ink text-white px-3 py-1.5 rounded-full"
                    >
                      {labelFor(code, v)} <X size={11} />
                    </button>
                  ))
                )}
                <button
                  onClick={onClearFilters}
                  className="text-xs font-medium text-ink/50 hover:text-ink px-2 py-1.5"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Grid */}
            {state.loading ? (
              <div className={`grid gap-x-4 gap-y-10 ${grid === "grid" ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
                {[...Array(PAGE_SIZE)].map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : state.products.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-ink/40 text-lg mb-4">
                  {state.error ?? "No products match your filters."}
                </p>
                {activeCount > 0 && (
                  <button onClick={onClearFilters} className="btn-secondary text-sm px-6 py-2.5">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className={`grid gap-x-4 gap-y-10 ${grid === "grid" ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
                {state.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            <Pagination current={page} total={state.totalPages} onChange={onPageChange} />
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[300px] bg-white overflow-y-auto animate-slide-in-left">
            <div className="flex items-center justify-between px-5 h-16 border-b border-ink/5 sticky top-0 bg-white z-10">
              <span className="font-semibold text-sm text-ink">Filters</span>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-full hover:bg-cream">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-2">
              <FilterSidebar
                groups={state.groups}
                selected={selected}
                onToggle={onToggleFilter}
                onClear={onClearFilters}
                loading={state.loading}
              />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-ink/5 p-5">
              <button onClick={() => setSidebarOpen(false)} className="btn-primary w-full text-sm py-3.5">
                Show {state.total.toLocaleString()} results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container py-20 text-center text-ink/40">Loading shop…</div>}>
      <ShopInner />
    </Suspense>
  );
}
