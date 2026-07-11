"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Check } from "lucide-react";
import ProductImage from "./ProductImage";
import type { Product } from "@/lib/data";
import { type Locale } from "@/lib/i18n";
import { getBrandLogo } from "@/lib/brandLogos";
import { useOfferLabels } from "@/lib/useOfferLabels";
import { useCart } from "@/lib/cart-context";
import { useCompare } from "@/lib/compare-context";
import { Money } from "@/components/Price";

/* ── Brand display ─────────────────────────────────────────────── */
function BrandDisplay({ product }: { product: Product }) {
  const logoUrl = product.brandLogoUrl ?? getBrandLogo(product.brand);

  if (logoUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={logoUrl}
        alt={product.brandName ?? String(product.brand ?? "") ?? "Brand"}
        className="max-h-9 max-w-[140px] object-contain"
      />
    );
  }

  return (
    <span className="text-black font-bold text-sm uppercase">
      {product.brandName ?? product.brand ?? "—"}
    </span>
  );
}

/* ── Stars (Orange/Yellow like the screenshot) ────────────────── */
function Stars({ rating, count }: { rating: number; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24"
            fill={i < Math.round(rating) ? "#ffa800" : "#e5e7eb"}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </span>
      <span className="text-[12px] text-gray-900 font-bold">{rating ? rating.toFixed(1) : "0.0"}/5</span>
      <span className="text-[12px] text-gray-500 font-medium">({count} {count === 1 ? "review" : "reviews"})</span>
    </span>
  );
}

/* ── Tyre size from product fields or name ─────────────────────── */
function getTyreSize(p: Product): string {
  if (p.tyreSize) return p.tyreSize;
  if (p.size) return p.size;
  if (p.width && p.height && p.rim) return `${p.width}/${p.height} R${p.rim}`;
  const m = p.name.match(/\d{3}\/\d{2,3}\s*R\d{2}(\s+\d{2,3}[A-Z]{1,2})?/i);
  return m ? m[0].trim() : "";
}

/* ── Car side-view silhouette ──────────────────────────────────── */
function CarSvg() {
  return (
    <svg viewBox="0 0 56 24" width="44" height="18" aria-hidden="true">
      {/* Body + cabin (black) */}
      <path
        fill="#111"
        d="M2,14 L2,9 L6,9 L10,5 L14,2 L34,2 L40,5 L46,9 L54,9 L54,14 Z"
      />
      {/* Window glass (white cutout) */}
      <path
        fill="#fff"
        d="M13,13 L15,5 L33,5 L38,9 L38,13 Z"
      />
      {/* Front wheel */}
      <circle cx="13" cy="19" r="5" fill="#111" />
      <circle cx="13" cy="19" r="2.5" fill="#fff" />
      {/* Rear wheel */}
      <circle cx="43" cy="19" r="5" fill="#111" />
      <circle cx="43" cy="19" r="2.5" fill="#fff" />
    </svg>
  );
}

/* ── WhatsApp icon ─────────────────────────────────────────────── */
function WAIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════
   CARD COMPONENT
   ════════════════════════════════════════════════════════════════ */
export default function TyreListingCard({
  product,
  locale = "en",
}: {
  product: Product;
  locale?: Locale;
}) {
  const href = product.urlKey ? `/${locale}/product/${product.urlKey}` : "#";
  const tyreSize = getTyreSize(product);
  const origin = product.country ?? product.origin ?? "-";
  const year = product.year ?? "";
  const warranty = product.warrantyPeriod ?? "5 YEARS WARRANTY";

  const offerLabels = useOfferLabels();
  const offerLabel = product.offersId ? offerLabels[product.offersId] : undefined;

  const { addItem } = useCart();
  const { isCompared, addToCompare, removeFromCompare } = useCompare();
  const [qty, setQty] = useState(4); // Default to 4 like the screenshot
  const [adding, setAdding] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [showQtyDropdown, setShowQtyDropdown] = useState(false);

  const isOutOfStock = product.inStock === false || product.price <= 0;
  const showPriceOnContact = isOutOfStock;

  const waUrl = `https://wa.me/966500000000?text=${encodeURIComponent(`Hi, I'm interested in: ${product.name}`)}`;

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

  return (
    <article className="bg-white border border-gray-200 rounded-xl flex flex-col relative shadow-sm hover:shadow-md transition-shadow">

      {/* ── Offer ribbon — dynamic from Magento, never hardcoded ── */}
      {offerLabel && (
        <div className="bg-[#ed1c24] text-center py-2 px-3 rounded-t-xl">
          <p className="text-white font-black text-[13px] leading-tight tracking-wide">
            {offerLabel}
          </p>
        </div>
      )}

      {/* ── Brand & Compare Header ── */}
      <div className={`flex items-center justify-between h-[54px] px-4 border-b border-gray-100 bg-white ${!offerLabel ? "rounded-t-xl" : ""}`}>
        <BrandDisplay product={product} />
        {/* Compare Checkbox */}
        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-500 hover:text-black transition-colors select-none">
          <span className="text-[12px] font-medium text-gray-500">Compare</span>
          <input
            type="checkbox"
            className="w-4.5 h-4.5 rounded border-gray-300 text-[#ed1c24] focus:ring-[#ed1c24] cursor-pointer"
            checked={isCompared(product.id)}
            onChange={(e) => {
              if (e.target.checked) {
                addToCompare(product);
              } else {
                removeFromCompare(product.id);
              }
            }}
          />
        </label>
      </div>

      {/* ── Tyre Image Section ── */}
      <div className="relative bg-white flex items-center justify-center p-3" style={{ height: "180px" }}>
        {/* clickable overlay */}
        <Link href={href} aria-label={product.name} className="absolute inset-0 z-[5]" />

        <ProductImage
          src={product.image}
          alt={product.name}
          fill
          className="object-contain p-2"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Warranty badge */}
        <span className="absolute bottom-2 left-0 z-10 bg-[#ed1c24] text-white text-[9px] font-black uppercase px-2 py-[4.5px] leading-none">
          {warranty}
        </span>

        {/* Year */}
        {year && (
          <span className="absolute bottom-2 right-3 z-10 text-gray-800 text-[12px] font-bold">
            {year}
          </span>
        )}
      </div>

      {/* ── Name + Size Section ── */}
      <div className="px-4 py-3 text-center border-t border-gray-100 bg-white flex-grow flex flex-col justify-center">
        <Link
          href={href}
          className="block text-[14px] font-bold text-gray-900 hover:text-[#ed1c24] transition-colors leading-snug line-clamp-2"
        >
          {product.name}
        </Link>
        {tyreSize && (
          <p className="text-[15px] font-black text-gray-900 mt-1">{tyreSize}</p>
        )}
      </div>

      {/* ── Vehicle Specs Row ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-b border-gray-100 bg-white">
        <CarSvg />
        <span className="text-[12px] font-bold text-gray-900 uppercase">{origin || "-"}</span>
      </div>

      {/* ── Rating Row ── */}
      <div className="flex items-center justify-center py-2.5 bg-white border-b border-gray-100">
        <Stars rating={product.rating} count={product.reviewCount} />
      </div>

      {/* ── Price Section ── */}
      <div className="text-center py-3 bg-white border-b border-gray-100">
        <p className="text-[11px] text-gray-500 font-medium">Fully Fitted Price per Item</p>
        <p className="text-[20px] font-black text-[#ed1c24] mt-0.5">
          {!showPriceOnContact
            ? <Money value={product.price} digits={2} />
            : "Price on Request"}
        </p>
        {!showPriceOnContact && (
          <p className="text-[12px] text-gray-500 mt-1 font-medium">
            Set of {qty}: <span className="font-bold text-gray-900"><Money value={product.price * qty} digits={2} /></span>
          </p>
        )}
      </div>

      {/* ── Installments Row ── */}
      <div className="flex items-center justify-center gap-1.5 py-2.5 bg-white border-b border-gray-100 flex-wrap">
        <span className="text-[11px] text-gray-500 font-medium">Pay In Installments</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#3dedb2] text-black">
          tabby
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#ffcc5c] text-black">
          tamara
        </span>
        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#1e293b] text-white">
          EMKПN
        </span>
      </div>

      {/* ── Add Error alert if present ── */}
      {addError && (
        <div className="bg-red-50 py-1.5 px-3 border-b border-red-100">
          <p className="text-[11px] text-red-500 text-center font-medium leading-tight">{addError}</p>
        </div>
      )}

      {/* ── Bottom unified CTA bar ── */}
      <div className="mt-auto w-full">
        {isOutOfStock ? (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5c] text-white font-bold text-[13px] uppercase transition-colors rounded-b-xl"
            style={{ height: 44 }}
          >
            <WAIcon />
            <span>Contact Us</span>
          </a>
        ) : (
          <div className="relative flex items-center w-full" style={{ height: 44 }}>
            {/* Quantity selector button */}
            <div className="w-[35%] h-full relative" onMouseLeave={() => setShowQtyDropdown(false)}>
              <button
                type="button"
                onClick={() => setShowQtyDropdown(!showQtyDropdown)}
                className="w-full h-full bg-[#ed1c24] hover:bg-[#d61820] text-white font-bold text-[14px] flex items-center justify-center gap-1.5 transition-colors focus:outline-none rounded-bl-xl"
              >
                <span>{qty}</span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="transition-transform duration-200" style={{ transform: showQtyDropdown ? "rotate(180deg)" : "rotate(0)" }}>
                  <path d="M1 1L5 5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Dropdown list (extends downwards, absolute positioned) */}
              {showQtyDropdown && (
                <div className="absolute left-0 top-[44px] w-full bg-[#ed1c24] border-t border-[#d61820] z-[99] shadow-lg flex flex-col rounded-b-xl overflow-hidden">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setQty(num);
                        setShowQtyDropdown(false);
                      }}
                      className={`w-full py-2.5 text-center text-white font-bold text-[13.5px] transition-colors border-b border-[#e1141c]/30 last:border-b-0 ${
                        qty === num ? "bg-[#2563eb]" : "hover:bg-[#d61820]"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add to cart button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding}
              className={`w-[65%] h-full text-white font-bold text-[13px] uppercase flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60 focus:outline-none rounded-br-xl ${
                cartAdded ? "bg-emerald-500 hover:bg-emerald-600" : "bg-black hover:bg-gray-900"
              }`}
            >
              {adding ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Adding…</span>
                </>
              ) : cartAdded ? (
                <>
                  <Check size={13} />
                  <span>Added!</span>
                </>
              ) : (
                <span>ADD TO CART</span>
              )}
            </button>
          </div>
        )}
      </div>

    </article>
  );
}
