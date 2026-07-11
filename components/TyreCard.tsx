"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Check, ShoppingBag } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import type { Product } from "@/lib/data";
import { useOfferLabels } from "@/lib/useOfferLabels";
import { getBrandLogo } from "@/lib/brandLogos";
import { useCart } from "@/lib/cart-context";
import { Money } from "@/components/Price";

/* ── Brand styling ─────────────────────────────────────────────── */
const BRAND_STYLE: Record<string, { bg: string; text: string; tagline?: string }> = {
  pirelli:     { bg: "#FFCB00", text: "#000" },
  michelin:    { bg: "#003087", text: "#fff" },
  bridgestone: { bg: "#E31837", text: "#fff" },
  continental: { bg: "#F97316", text: "#fff" },
  goodyear:    { bg: "#003087", text: "#fff" },
  dunlop:      { bg: "#E31837", text: "#fff" },
  yokohama:    { bg: "#111",    text: "#fff" },
  bfgoodrich:  { bg: "#fff",    text: "#003087" },
  hankook:     { bg: "#E31837", text: "#fff" },
  falken:      { bg: "#111",    text: "#fff" },
  maxxis:      { bg: "#E31837", text: "#fff" },
  toyo:        { bg: "#E31837", text: "#fff" },
  kumho:       { bg: "#003087", text: "#fff" },
  nitto:       { bg: "#111",    text: "#fff" },
  cooper:      { bg: "#003087", text: "#fff" },
  arivo:       { bg: "#fff",    text: "#111", tagline: "BRITISH TECHNOLOGY" },
};

/* ── Brand warranty map ────────────────────────────────────────── */
const WARRANTY_MAP: Record<string, string> = {
  continental: "5 YEARS WARRANTY",
  goodyear:    "5 YEARS WARRANTY",
  michelin:    "5 YEARS WARRANTY",
  bridgestone: "5 YEARS WARRANTY",
  dunlop:      "5 YEARS WARRANTY",
  yokohama:    "5 YEARS WARRANTY",
  hankook:     "5 YEARS WARRANTY",
  kumho:       "5 YEARS WARRANTY",
  toyo:        "5 YEARS WARRANTY",
  falken:      "5 YEARS WARRANTY",
  nexen:       "5 YEARS WARRANTY",
  roadstone:   "5 YEARS WARRANTY",
};

/* ── Name parser — extracts pattern, size, loadIndex, year ──────── */
function parseTyreName(name: string) {
  const sizeMatch = name.match(/(\d{3}\/\d{2,3}\s*[Rr]\d{2})/);
  const yearMatch = name.match(/\b(20\d{2})\b/);
  const rfMatch   = /\b(MOE|RFT?|SSR|ZP|ROF|RunFlat|Run[\s-]Flat)\b/i.test(name);
  const brand     = name.split(" ")[0] ?? "";
  const size      = sizeMatch?.[1]?.trim() ?? null;
  const year      = yearMatch?.[1] ?? null;

  let pattern:   string | null = null;
  let loadIndex: string | null = null;

  if (sizeMatch && sizeMatch.index !== undefined) {
    const afterSize = name.slice(sizeMatch.index + size!.length).trim();
    const loadMatch = afterSize.match(/^(\d{2,3}[A-Za-z]{1,2}(?:\/\d{2,3}[A-Za-z]{1,2})?)\b/);
    loadIndex = loadMatch?.[1]?.toUpperCase() ?? null;
    const rest = (loadMatch ? afterSize.slice(loadMatch[0].length) : afterSize).trim();
    pattern = rest
      .replace(/\b20\d{2}\b/, "")
      .replace(/\b(SSR \*|SSR\*|SSR|MOE|MO1|MO|AO|N[0-4]|VOL|RSC|RFT|ZP|AR|LS|J|HN|GD)\b/g, "")
      .replace(/\b(run.?flat|runflat|XL)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim() || null;
  }

  return { brand, size, loadIndex, pattern, year, isRunFlat: rfMatch };
}

/* ── Stars ───────────────────────────────────────────────────────── */
function Stars({ rating }: { rating: number }) {
  if (!rating) return <span className="text-[11px] italic text-gray-400">Not rated yet</span>;
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} width="13" height="13" viewBox="0 0 12 12" fill={i < full ? "#ed1c24" : "#E5E7EB"}>
            <path d="M6 1l1.4 2.8 3.1.4-2.2 2.2.5 3.1L6 8.1l-2.8 1.4.5-3.1L1.5 4.2l3.1-.4z" />
          </svg>
        ))}
      </div>
      <span className="text-[11px] text-gray-500 font-medium">{rating}/5</span>
    </div>
  );
}

/* ── Car icon ────────────────────────────────────────────────────── */
function CarIcon() {
  return (
    <svg width="30" height="16" viewBox="0 0 60 28" fill="#111" aria-hidden>
      <path d="M55 18H5C3.3 18 2 16.7 2 15v-2c0-1 .5-1.8 1.3-2.3L8 8.5C9.2 6.9 11.1 6 13 6h24c2 0 4 .9 5.3 2.5l5.4 4.2H55c1.7 0 3 1.3 3 3V15c0 1.7-1.3 3-3 3z" />
      <circle cx="14" cy="20" r="5" fill="#111" />
      <circle cx="14" cy="20" r="2.5" fill="#fff" />
      <circle cx="44" cy="20" r="5" fill="#111" />
      <circle cx="44" cy="20" r="2.5" fill="#fff" />
    </svg>
  );
}

/* ── RunFlat badge ───────────────────────────────────────────────── */
function RunFlatBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-[#111] text-white text-[9px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5">
      <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="10" cy="10" r="8" />
        <circle cx="10" cy="10" r="3" fill="currentColor" />
      </svg>
      Run-Flat
    </span>
  );
}

/* ── WhatsApp icon ───────────────────────────────────────────────── */
function WaIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TyreCard — matches reference PowerTyre product card design
═══════════════════════════════════════════════════════════════════ */
export default function TyreCard({ product }: { product: Product }) {
  const { brand, size, loadIndex, pattern, year, isRunFlat } = parseTyreName(product.name);
  const href     = product.urlKey ? `/en/product/${product.urlKey}` : product.sku ? `/product/${product.sku}` : "/";
  const waUrl    = `https://wa.me/966500000000?text=${encodeURIComponent(`Hi, I'm interested in: ${product.name}`)}`;
  const bStyle   = BRAND_STYLE[brand.toLowerCase()] ?? { bg: "#fff", text: "#111" };
  const logoUrl  = product.brandLogoUrl ?? getBrandLogo(product.brand);
  const warranty = WARRANTY_MAP[brand.toLowerCase()] ?? "1 YEAR WARRANTY";

  const offerLabels = useOfferLabels();
  const offerLabel  = product.offersId ? offerLabels[product.offersId] : undefined;

  const { addItem } = useCart();
  const [qty,        setQty]        = useState(1);
  const [adding,     setAdding]     = useState(false);
  const [cartAdded,  setCartAdded]  = useState(false);
  const [addError,   setAddError]   = useState<string | null>(null);

  const isOutOfStock       = product.inStock === false;
  const showPriceOnContact = product.price <= 0 || isOutOfStock;

  async function handleAddToCart() {
    if (adding || cartAdded) return;
    setAdding(true);
    setAddError(null);
    try {
      const result = await addItem(product, qty);
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

  // Show pattern name only; fallback to name minus brand prefix and year
  const displayName = pattern
    ?? product.name.replace(/^\S+\s+/, "").replace(/\s+\d{4}$/, "").trim();
  const sizeLabel = [size, loadIndex].filter(Boolean).join(" ");

  return (
    <article className="bg-white border border-gray-200 overflow-hidden flex flex-col h-full">

      {/* ── Offer banner — dynamic from Magento ─────────────── */}
      {offerLabel && (
        <div className="bg-[#ed1c24] text-center py-2.5 px-3">
          <p className="text-white font-black text-[13px] leading-tight">{offerLabel}</p>
        </div>
      )}

      {/* ── Brand header ─────────────────────────────────────── */}
      <div
        className="flex flex-col items-center justify-center px-4 py-2 border-b border-gray-100"
        style={{ background: bStyle.bg, minHeight: "62px" }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={product.brandName ?? brand}
            loading="lazy"
            style={{ maxHeight: "34px", maxWidth: "150px", objectFit: "contain", display: "block" }}
          />
        ) : (
          <span
            className="text-base font-black uppercase tracking-widest leading-none"
            style={{ color: bStyle.text }}
          >
            {product.brandName ?? brand}
          </span>
        )}
        {bStyle.tagline && (
          <p className="text-[9px] uppercase tracking-widest text-gray-500 mt-1">{bStyle.tagline}</p>
        )}
      </div>

      {/* ── Image + badges ───────────────────────────────────── */}
      <Link href={href} className="block relative bg-white" style={{ aspectRatio: "4/3" }}>
        <ProductImage
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
          className="object-contain p-4"
        />

        {/* Warranty badge */}
        <span className="absolute bottom-0 left-0 bg-[#ed1c24] text-white text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 leading-none">
          {warranty}
        </span>

        {/* Year */}
        {year && (
          <span className="absolute bottom-1.5 right-3 text-[12px] font-medium text-gray-500">
            {year}
          </span>
        )}

        {/* Out-of-stock overlay */}
        {product.inStock === false && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <span className="text-xs font-semibold text-gray-400 bg-white/90 px-3 py-1 rounded">
              Out of stock
            </span>
          </div>
        )}
      </Link>

      {/* ── Info section ─────────────────────────────────────── */}
      <div className="flex flex-col px-3.5 pt-3 pb-3.5 flex-1 gap-1.5">

        {/* Pattern name */}
        <Link
          href={href}
          className="text-[14px] font-bold text-gray-900 leading-snug hover:text-[#ed1c24] transition-colors line-clamp-2"
        >
          {displayName}
        </Link>

        {/* Size + load index */}
        {sizeLabel && (
          <p className="text-[12px] text-gray-600 font-medium">{sizeLabel}</p>
        )}

        {/* Car icon + run-flat + country */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CarIcon />
            {isRunFlat && <RunFlatBadge />}
          </div>
          {product.country && (
            <span className="text-[11px] text-gray-500">{product.country}</span>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 flex-wrap">
          <Stars rating={product.rating} />
          {product.rating > 0 && product.reviewCount > 0 && (
            <span className="text-[10px] text-gray-400">({product.reviewCount} reviews)</span>
          )}
        </div>

        <div className="border-t border-gray-100 my-0.5" />

        {/* Price */}
        <div>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">
            Fully Fitted Price per Item
          </p>
          {showPriceOnContact ? (
            <p className="text-[17px] font-black text-gray-900 leading-tight">Price on Contact</p>
          ) : (
            <>
              <p className="text-[17px] font-black text-gray-900 leading-tight">
                <Money value={product.price} currency={product.currency} />
              </p>
              {product.originalPrice && product.originalPrice > product.price && (
                <p className="text-[12px] text-gray-400 line-through">
                  <Money value={product.originalPrice} currency={product.currency} />
                </p>
              )}
            </>
          )}
        </div>

        {/* Installments */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-gray-500 font-medium">Pay In Installments</span>
          <span className="bg-[#1DBF73] text-white text-[9px] font-black px-2 py-0.5 rounded leading-none">tabby</span>
          <span className="bg-[#7B2FBE] text-white text-[9px] font-black px-2 py-0.5 rounded leading-none">tamara</span>
        </div>

        {/* CTA — Contact Us for OUT_OF_STOCK, qty + ADD TO CART for IN_STOCK */}
        {isOutOfStock ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5c] text-white text-[13px] font-bold rounded-full py-2.5 transition-colors"
          >
            <WaIcon />
            Contact Us
          </a>
        ) : (
          <div className="mt-auto flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              {/* Quantity selector */}
              <div className="flex items-center border border-gray-200 rounded-full overflow-hidden h-9 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-9 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none"
                >
                  −
                </button>
                <span className="w-6 text-center text-[13px] font-bold select-none">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(q => q + 1)}
                  className="w-9 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none"
                >
                  +
                </button>
              </div>
              {/* Add to cart */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-full h-9 text-[12px] font-bold transition-colors disabled:opacity-60 ${
                  cartAdded ? "bg-emerald-500 text-white" : "bg-gray-900 hover:bg-gray-800 text-white"
                }`}
              >
                {adding ? <Loader2 size={12} className="animate-spin" />
                  : cartAdded ? <Check size={12} />
                  : <ShoppingBag size={12} />}
                {adding ? "Adding…" : cartAdded ? "Added!" : "ADD TO CART"}
              </button>
            </div>
            {addError && (
              <p className="text-[11px] text-red-500 text-center leading-tight">{addError}</p>
            )}
          </div>
        )}

      </div>
    </article>
  );
}
