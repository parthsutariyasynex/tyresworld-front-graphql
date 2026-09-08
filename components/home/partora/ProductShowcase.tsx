"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import TyreListingCard from "@/components/TyreListingCard";
import TyreListingCardSkeleton from "@/components/TyreListingCardSkeleton";
import type { Product } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import type { ApiProductsResponse } from "@/lib/magento";
import { APP_CONFIG } from "@/src/config/app-config";

/* Same tab source the existing FeaturedProducts section uses — the
   category UIDs stay in APP_CONFIG, none are hardcoded here. */
const TABS = APP_CONFIG.homepage.featuredCategories;
const PAGE_SIZE = 8;

type TabId = (typeof TABS)[number]["id"];

/**
 * Categories / Products — Partora's category-card grid rebuilt as a
 * category-tabbed product grid, because TyresWorld has live product data
 * where Partora only has category tiles.
 *
 * Fetches the same `/api/products?categoryUid=…&pageSize=…` contract the
 * rest of the storefront uses, and renders the existing TyreListingCard
 * untouched so pricing, cart and fitment behaviour are identical.
 */
export default function ProductShowcase({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  /* TyreListingCard takes the narrowed Locale union. */
  const loc: Locale = isAr ? "ar" : "en";

  const [activeTab, setActiveTab] = useState<TabId>(TABS[0].id);
  const [cache, setCache] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tab = TABS.find((t) => t.id === activeTab);
    if (!tab) return;

    if (cache[tab.id]) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    fetch(`/api/products?categoryUid=${encodeURIComponent(tab.uid)}&pageSize=${PAGE_SIZE}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((json: ApiProductsResponse) => {
        if (!active) return;
        setCache((c) => ({ ...c, [tab.id]: json?.products ?? [] }));
      })
      .catch((err) => {
        console.error("Failed to load products", err);
        if (active) setCache((c) => ({ ...c, [tab.id]: [] }));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const products = cache[activeTab] ?? [];

  return (
    <section className="ptr-section ptr-section--tint">
      <div className="ptr-container">
        <header className="ptr-head">
          <div>
            <h2 className="ptr-h2">{isAr ? "تسوق حسب الفئة" : "Shop by Category"}</h2>
            <p className="ptr-sub">
              {isAr
                ? "إطارات وجنوط وبطاريات أصلية بأسعار الإمارات — مع التركيب."
                : "Genuine tyres, wheels and batteries at UAE prices — fitting included."}
            </p>
          </div>

          <Link href={`/${locale}/tyres`} className="ptr-link">
            {isAr ? "عرض الكل" : "View all"}
            <ArrowRight size={15} strokeWidth={2.2} />
          </Link>
        </header>

        {/* Category chips */}
        <div className="ptr-chips" role="tablist" aria-label={isAr ? "الفئات" : "Categories"}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`ptr-chip ${activeTab === tab.id ? "is-active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="ptr-products">
          {loading
            ? Array.from({ length: PAGE_SIZE }, (_, i) => <TyreListingCardSkeleton key={i} />)
            : products.map((product) => (
                <TyreListingCard key={product.id} product={product} locale={loc} />
              ))}
        </div>

        {!loading && products.length === 0 && (
          <p className="ptr-empty" role="status">
            {isAr ? "لا توجد منتجات في هذه الفئة حالياً." : "No products in this category right now."}
          </p>
        )}
      </div>
    </section>
  );
}
