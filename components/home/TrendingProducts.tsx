"use client";

import { useEffect, useState } from "react";
import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import type { Product } from "@/lib/data";
import type { ApiProductsResponse } from "@/lib/magento";

const COUNT = 8;

export default function TrendingProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // "Trending" = first page of the Tyres category, sorted by Magento position.
    fetch(`/api/products?categoryUid=MTg=&pageSize=${COUNT}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((json: ApiProductsResponse) => {
        if (active) setProducts(json.products ?? []);
      })
      .catch(() => { /* leave empty */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <section className="py-20 lg:py-28">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <span className="eyebrow mb-3 block">
              <span className="w-5 h-px bg-ink-muted" />
              What&apos;s hot right now
            </span>
            <h2 className="section-title flex items-center gap-3">
              Trending
              <span className="inline-flex items-center gap-1.5 text-base font-sans font-medium text-accent bg-accent/8 px-3 py-1 rounded-full">
                <TrendingUp size={14} />
                This week
              </span>
            </h2>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink/60 hover:text-ink transition-colors group"
          >
            View all trends
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
          {loading
            ? [...Array(COUNT)].map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </div>
    </section>
  );
}
