"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductDetailInner from "@/components/ProductDetailInner";
import type { ProductDetail } from "@/lib/magento";
import { storeCode, type Locale } from "@/lib/i18n";

/* ── Skeleton ──────────────────────────────────────────────────── */
function ProductDetailSkeleton() {
  return (
    <>
      <div className="bg-black py-9 animate-pulse">
        <div className="container flex justify-center">
          <div className="h-8 w-2/3 bg-white/10 rounded" />
        </div>
      </div>
      <div className="bg-white border-b border-gray-100 py-3">
        <div className="container">
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="container py-8">
        <div className="grid lg:grid-cols-[380px_1fr] gap-8">
          <div className="border border-gray-200 aspect-square bg-gray-100 animate-pulse rounded" />
          <div className="space-y-4">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-48 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 w-64 bg-gray-100 rounded animate-pulse" />
            <div className="h-40 w-full bg-gray-50 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */
export default function ProductDetailPage() {
  const params  = useParams();
  const locale  = String(params.locale  ?? "en");
  const urlKey  = decodeURIComponent(String(params.urlKey ?? ""));

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!urlKey) return;
    let active = true;
    setLoading(true);
    setError(null);

    fetch(`/api/product?urlKey=${encodeURIComponent(urlKey)}&store=${storeCode(locale as Locale)}`)
      .then(r => r.json())
      .then(j => {
        if (!active) return;
        if (j.product) setProduct(j.product);
        else setError(j.error ?? "Product not found.");
      })
      .catch(() => active && setError("Failed to load product."))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [urlKey, locale]);

  if (loading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div className="container py-24 text-center max-w-md mx-auto">
        <h1 className="text-2xl font-black text-gray-900 mb-3">Product not found</h1>
        <p className="text-gray-500 mb-8">{error}</p>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 bg-gray-900 text-white font-bold text-sm px-6 py-3"
        >
          <ArrowLeft size={15} /> Back to Home
        </Link>
      </div>
    );
  }

  return <ProductDetailInner product={product} locale={locale} />;
}
