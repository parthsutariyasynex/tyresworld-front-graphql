"use client";

import { useState } from "react";
import Link from "next/link";
import ProductImage from "./ProductImage";
import { ShoppingBag, Heart, Check, Loader2, AlertCircle } from "lucide-react";
import type { Product } from "@/lib/data";
import { useCart } from "@/lib/cart-context";
import { getBrandLogo } from "@/lib/brandLogos";
import { useOfferLabels } from "@/lib/useOfferLabels";
import { useWishlist } from "@/lib/wishlist-context";
import { useAuth } from "@/lib/auth-context";
import { Money } from "@/components/Price";

/* ─── Badge styles ────────────────────────────────────────────── */
const BADGE_STYLES: Record<string, string> = {
  New: "bg-ink text-white",
  Sale: "bg-accent text-white",
  Bestseller: "bg-cream text-ink border border-ink/10",
};

/* ─── Star row ───────────────────────────────────────────────── */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill={i < Math.round(rating) ? "#FF6B35" : "#E5E7EB"}
          aria-hidden
        >
          <path d="M6 1l1.4 2.8 3.1.4-2.2 2.2.5 3.1L6 8.1l-2.8 1.4.5-3.1L1.5 4.2l3.1-.4z" />
        </svg>
      ))}
    </div>
  );
}

/* ─── Component ───────────────────────────────────────────────── */
export default function ProductCard({ product }: { product: Product }) {
  const { addItem, currency } = useCart();
  const { isLoggedIn } = useAuth();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.sku);
  const [cartAdded, setCartAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  const fmt = (v: number) => <Money value={v} currency={currency || "SAR"} />;

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (cartAdded || adding) return;
    setAdding(true);
    setAddError(null);
    try {
      const result = await addItem(product);
      if (result.error) {
        setAddError(result.error);
        setTimeout(() => setAddError(null), 4000);
      } else {
        setCartAdded(true);
        setTimeout(() => setCartAdded(false), 2000);
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      alert("Please log in to manage your wishlist.");
      return;
    }
    if (wishlisted) {
      await removeFromWishlist(product.sku);
    } else {
      await addToWishlist(product);
    }
  }

  const isOutOfStock = product.inStock === false;
  const href = product.urlKey ? `/en/product/${product.urlKey}` : product.sku ? `/product/${product.sku}` : "/";
  const waUrl = `https://wa.me/966500000000?text=${encodeURIComponent(`Hi, I'm interested in: ${product.name}`)}`;
  const brandLogo = getBrandLogo(product.brand);
  const offerLabels = useOfferLabels();
  const offerLabel = product.offersId ? offerLabels[product.offersId] : undefined;

  return (
    <article className="group flex flex-col cursor-pointer">

      {/* ── Image block ────────────────────────────────────────── */}
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-cream mb-4">

        {/* Offer ribbon — dynamic from Magento, never hardcoded */}
        {offerLabel && (
          <div className="absolute top-0 inset-x-0 z-20 bg-[#ed1c24] py-1.5 text-center">
            <p className="text-white font-black text-[11px] leading-tight tracking-wide">
              {offerLabel}
            </p>
          </div>
        )}

        {/* Skeleton shimmer until image loads */}
        {!imgLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-cream via-white/60 to-cream animate-pulse" />
        )}

        <ProductImage
          src={product.image}
          alt={product.name}
          fill
          onLoad={() => setImgLoaded(true)}
          className={[
            "object-cover transition-all duration-500 ease-out",
            "group-hover:scale-105",
            imgLoaded ? "opacity-100" : "opacity-0",
          ].join(" ")}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Clickable overlay → product detail (buttons below sit above it at z-10) */}
        <Link href={href} aria-label={product.name} className="absolute inset-0 z-[5]" />

        {/* Badge — out-of-stock takes priority over sale/new */}
        {product.inStock === false ? (
          <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full z-10 bg-ink/60 text-white">
            Out of stock
          </span>
        ) : product.badge && (
          <span
            className={`absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full z-10 ${BADGE_STYLES[product.badge]}`}
          >
            {product.badge}
            {product.badge === "Sale" && discount ? ` −${discount}%` : ""}
          </span>
        )}

        {/* Wishlist button */}
        <button
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={handleWishlist}
          className={[
            "absolute top-3 right-3 z-10 w-8 h-8 rounded-full",
            "flex items-center justify-center",
            "backdrop-blur-sm transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
            wishlisted
              ? "bg-red-50 opacity-100 scale-100"
              : "bg-white/80 opacity-0 group-hover:opacity-100 hover:scale-110",
          ].join(" ")}
        >
          <Heart
            size={14}
            className={
              wishlisted
                ? "fill-red-500 text-red-500"
                : "text-ink"
            }
          />
        </button>

        {/* Quick-add / Contact Us — slides up on hover */}
        <div className="absolute bottom-0 inset-x-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10">
          {isOutOfStock ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-xl bg-[#25D366] text-white shadow-card"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contact Us
            </a>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={adding}
              aria-label={cartAdded ? "Added to cart" : "Quick add to cart"}
              className={[
                "w-full flex items-center justify-center gap-2",
                "text-xs font-semibold py-2.5 rounded-xl shadow-card",
                "transition-all duration-200 disabled:cursor-not-allowed",
                cartAdded
                  ? "bg-emerald-500 text-white"
                  : addError
                    ? "bg-red-500 text-white"
                    : adding
                      ? "bg-ink/80 text-white"
                      : "bg-white text-ink hover:bg-ink hover:text-white",
              ].join(" ")}
            >
              {cartAdded ? (
                <><Check size={13} /> Added!</>
              ) : addError ? (
                <><AlertCircle size={13} /> Failed</>
              ) : adding ? (
                <><Loader2 size={13} className="animate-spin" /> Adding…</>
              ) : (
                <><ShoppingBag size={13} /> Quick add</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Product info ───────────────────────────────────────── */}
      <div className="flex flex-col gap-1 px-0.5 flex-1">

        {/* Brand logo / category */}
        {brandLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brandLogo}
            alt={product.brandName ?? product.category}
            className="h-8 w-auto object-contain self-start"
          />
        ) : (
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink/35">
            {product.category}
          </p>
        )}

        {/* Name */}
        <Link href={href} className="text-sm font-medium text-ink leading-snug group-hover:text-accent transition-colors duration-150 line-clamp-2">
          {product.name}
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <Stars rating={product.rating} />
          <span className="text-[11px] text-ink/35">
            ({product.reviewCount})
          </span>
        </div>

        {/* Price row */}
        <div className="flex items-center gap-2 mt-auto pt-2">
          {isOutOfStock || product.price <= 0 ? (
            <span className="text-sm font-bold text-ink">Price on Contact</span>
          ) : (
            <>
              <span className="text-sm font-bold text-ink">{fmt(product.price)}</span>
              {product.originalPrice && (
                <span className="text-xs text-ink/30 line-through">{fmt(product.originalPrice)}</span>
              )}
              {discount && (
                <span className="ml-auto text-[10px] font-bold text-accent bg-accent/8 px-1.5 py-0.5 rounded-full">
                  Save {discount}%
                </span>
              )}
            </>
          )}
        </div>

      </div>
    </article>
  );
}
