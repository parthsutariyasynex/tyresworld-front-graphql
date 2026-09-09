"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ProductImage from "./ProductImage";
import { Loader2, Check, ShoppingCart, Truck, MapPin } from "lucide-react";
import type { Product } from "@/lib/data";
import { useCart } from "@/lib/cart-context";
import { getBrandLogo } from "@/lib/brandLogos";
import { useOfferLabels } from "@/lib/useOfferLabels";
import { Money } from "@/components/Price";
import { APP_CONFIG } from "@/src/config/app-config";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [cartAdded, setCartAdded] = useState(false);
  const [adding, setAdding] = useState(false);

  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "ar" ? "ar" : "en";
  const isAr = locale === "ar";

  const href = product.urlKey
    ? `/${locale}/product/${product.urlKey}`
    : product.sku
    ? `/${locale}/product/${product.sku}`
    : "#";

  const isOutOfStock = product.inStock === false || product.price <= 0;
  const unitPrice = product.price > 0 ? product.price : 0;
  const brandLabel = product.brandName ?? String(product.brand ?? "");
  const brandLogo = product.brandLogoUrl ?? getBrandLogo(product.brand);
  const brandSlug = product.brandName?.toLowerCase().replace(/[^a-z0-9]+/g, "").replace(/(^-|-$)/g, "");
  const brandHref = brandSlug ? `/${locale}/tyres/brand/${brandSlug}` : null;

  const offerLabels = useOfferLabels(locale === "ar" ? "ar" : "default");
  const offerLabel = product.offersId ? offerLabels[product.offersId] : undefined;
  const badgeText = product.badge || (product.pattern ? "PERFORMANCE" : undefined);

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (cartAdded || adding || isOutOfStock) return;
    setAdding(true);
    try {
      const result = await addItem(product, 1);
      if (!result.error) {
        setCartAdded(true);
        setTimeout(() => setCartAdded(false), 2000);
      }
    } finally {
      setAdding(false);
    }
  }

  const waUrl = `https://api.whatsapp.com/send/?phone=${APP_CONFIG.contact.whatsapp}&text=${encodeURIComponent(
    `Hi tyresworld.ae\n\nI would like to enquire about ${product.name}`,
  )}`;

  return (
    <div className="group relative flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.09)] transition-all duration-300 overflow-hidden">
      {/* ── Top Red Banner: Dynamic Offer (Only rendered when product has an offer) ── */}
      {offerLabel && (
        <div className="bg-[#ed1c24] text-white text-center py-2 px-2 font-black text-[14px] sm:text-[15px] uppercase tracking-wide shrink-0">
          <span>{offerLabel}</span>
        </div>
      )}

      {/* ── Top Header: Brand Logo & Performance Badge ─────────── */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-1 min-h-[38px]">
        {/* Brand Logo */}
        <div className="flex items-center">
          {brandHref ? (
            <Link href={brandHref} aria-label={`${brandLabel} tyres`}>
              {brandLogo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={brandLogo}
                  alt={brandLabel}
                  className="max-h-6 max-w-[100px] w-auto object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="text-xs font-black uppercase tracking-wider text-gray-900">
                  {brandLabel}
                </span>
              )}
            </Link>
          ) : brandLogo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={brandLogo}
              alt={brandLabel}
              className="max-h-6 max-w-[100px] w-auto object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-xs font-black uppercase tracking-wider text-gray-900">
              {brandLabel}
            </span>
          )}
        </div>

        {/* Performance Badge (when no top banner or secondary badge) */}
        {!offerLabel && badgeText && (
          <div className="bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
            <span className="text-[11px] leading-none">🔥</span>
            <span className="text-[10px] font-black tracking-wider text-[#ed1c24] uppercase">
              {badgeText}
            </span>
          </div>
        )}
      </div>

      {/* ── Image Container ──────────────────────────────────── */}
      <div className="relative w-full aspect-square bg-[#f8f9fa] flex items-center justify-center p-3 overflow-hidden rounded-xl mx-auto my-1 max-w-[calc(100%-1.5rem)]">
        <ProductImage
          src={product.image}
          alt={product.name}
          fill
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300 ease-out"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Bottom-left warranty */}
        {product.warrantyPeriod && (
          <span className="absolute left-2 bottom-2 z-10 text-[10.5px] font-black uppercase text-gray-900 leading-none">
            {product.warrantyPeriod}
          </span>
        )}

        {/* Bottom-right year */}
        {product.year && (
          <span className="absolute right-2 bottom-2 z-10 text-[11px] font-black text-gray-900 leading-none">
            {product.year}
          </span>
        )}

        {/* Link overlay */}
        <Link href={href} aria-label={product.name} className="absolute inset-0 z-[5]" />
      </div>

      {/* ── Content Section ─────────────────────────────────── */}
      <div className="p-4 pt-2 flex flex-col flex-1">
        {/* Product Title */}
        <Link
          href={href}
          className="text-[15px] sm:text-[16px] font-bold text-gray-900 leading-snug line-clamp-2 hover:text-[#ed1c24] transition-colors"
          title={product.name}
        >
          {product.name}
        </Link>

        {/* Seller / Store Subtitle */}
        <p className="text-xs text-gray-400 font-normal mt-1 truncate">
          {brandLabel
            ? `${brandLabel}'s Store`
            : product.category
            ? `${product.category} Store`
            : "Authorized Store"}
        </p>

        {/* Price in Brand Dark / Neutral styling */}
        <div className="text-[20px] sm:text-[22px] font-black text-gray-900 mt-2.5 flex items-center gap-1.5 leading-none tracking-tight">
          {unitPrice > 0 ? (
            <Money value={unitPrice} digits={2} />
          ) : (
            <span className="text-base text-gray-800">{isAr ? "السعر عند الطلب" : "Price on Request"}</span>
          )}
        </div>

        {/* Tag / Category Sub-line */}
        <p className="text-[11.5px] text-gray-400 font-normal mt-1 truncate">
          {product.category || "Performance Parts"}
        </p>

        {/* Stock Status */}
        <p className={`text-[11px] font-semibold mt-1 ${isOutOfStock ? "text-[#ed1c24]" : "text-[#16a34a]"}`}>
          {isOutOfStock
            ? isAr ? "غير متوفر" : "Out of stock"
            : product.quantity
            ? `${product.quantity} in stock`
            : isAr ? "متوفر بالمخزون" : "In stock"}
        </p>

        {/* Bottom Actions Row */}
        <div className="mt-auto pt-3.5 flex items-center justify-between gap-2">
          {/* Badges: Delivery & Pickup */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200/60 text-[10px] sm:text-[10.5px] font-medium">
              <Truck size={11} className="stroke-[2.2]" />
              <span>{isAr ? "توصيل" : "Delivery"}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200/60 text-[10px] sm:text-[10.5px] font-medium">
              <MapPin size={11} className="stroke-[2.2]" />
              <span>{isAr ? "استلام" : "Pickup"}</span>
            </span>
          </div>

          {/* Add to Cart / Enquiry Button (Brand Red #ed1c24 & Black Theme) */}
          {isOutOfStock ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#ed1c24] hover:bg-[#111111] active:scale-[0.98] text-white text-[12px] sm:text-[13px] font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs whitespace-nowrap"
            >
              <ShoppingCart size={14} className="stroke-[2.2]" />
              <span>{isAr ? "استفسار" : "Enquiry"}</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding}
              className={`text-white text-[12px] sm:text-[13px] font-bold px-3.5 sm:px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs whitespace-nowrap cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed ${
                cartAdded
                  ? "bg-[#16a34a]"
                  : "bg-[#ed1c24] hover:bg-[#111111] active:scale-[0.98]"
              }`}
            >
              {adding ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{isAr ? "جاري الإضافة…" : "Adding…"}</span>
                </>
              ) : cartAdded ? (
                <>
                  <Check size={14} className="stroke-[2.5]" />
                  <span>{isAr ? "تمત الإضافة" : "Added"}</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={14} className="stroke-[2.2]" />
                  <span>{isAr ? "أضف للسلة" : "Add to Cart"}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
