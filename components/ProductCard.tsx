"use client";

import { useState } from "react";
import Link from "next/link";
import ProductImage from "./ProductImage";
import { ShoppingBag, Heart, Check } from "lucide-react";
import type { Product } from "@/lib/data";
import { useCart } from "@/lib/cart-context";

/* ─── Badge styles ────────────────────────────────────────────── */
const BADGE_STYLES: Record<string, string> = {
  New:        "bg-ink text-white",
  Sale:       "bg-accent text-white",
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
  const { addItem } = useCart();
  const [wishlisted, setWishlisted]     = useState(false);
  const [cartAdded,  setCartAdded]      = useState(false);
  const [imgLoaded,  setImgLoaded]      = useState(false);

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (cartAdded) return;
    try {
      await addItem(product);      // adds to the Magento server cart
      setCartAdded(true);
      setTimeout(() => setCartAdded(false), 2000);
    } catch (err) {
      console.warn("[ProductCard] add to cart failed:", err);
    }
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    setWishlisted((v) => !v);
  }

  const href = product.urlKey ? `/product/${product.urlKey}` : "/shop";

  return (
    <article className="group flex flex-col cursor-pointer">

      {/* ── Image block ────────────────────────────────────────── */}
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-cream mb-4">

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

        {/* Badge */}
        {product.badge && (
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

        {/* Quick-add button — slides up on hover */}
        <div className="absolute bottom-0 inset-x-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10">
          <button
            onClick={handleAddToCart}
            aria-label={cartAdded ? "Added to cart" : "Quick add to cart"}
            className={[
              "w-full flex items-center justify-center gap-2",
              "text-xs font-semibold py-2.5 rounded-xl shadow-card",
              "transition-all duration-200",
              cartAdded
                ? "bg-emerald-500 text-white"
                : "bg-white text-ink hover:bg-ink hover:text-white",
            ].join(" ")}
          >
            {cartAdded ? (
              <>
                <Check size={13} />
                Added to cart!
              </>
            ) : (
              <>
                <ShoppingBag size={13} />
                Quick add
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Product info ───────────────────────────────────────── */}
      <div className="flex flex-col gap-1 px-0.5 flex-1">

        {/* Category */}
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ink/35">
          {product.category}
        </p>

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
          <span className="text-sm font-bold text-ink">
            ${product.price}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-ink/30 line-through">
              ${product.originalPrice}
            </span>
          )}
          {discount && (
            <span className="ml-auto text-[10px] font-bold text-accent bg-accent/8 px-1.5 py-0.5 rounded-full">
              Save {discount}%
            </span>
          )}
        </div>

      </div>
    </article>
  );
}
