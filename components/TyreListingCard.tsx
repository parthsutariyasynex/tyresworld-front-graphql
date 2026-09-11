"use client";

import { useState, useEffect, useRef } from "react";
import VehicleFitmentModal from "@/components/VehicleFitmentModal";
import Link from "next/link";
import { Loader2, Check, ChevronDown } from "lucide-react";
import FullyFittedPriceModal from "@/components/FullyFittedPriceModal";
import ProductImage from "./ProductImage";
import type { Product } from "@/lib/data";
import { type Locale } from "@/lib/i18n";
import { getBrandLogo } from "@/lib/brandLogos";
import { useOfferLabels } from "@/lib/useOfferLabels";
import { useCart } from "@/lib/cart-context";
import { Money } from "@/components/Price";
import { APP_CONFIG } from "@/src/config/app-config";

/** Tyre size from product fields, falling back to parsing the name. */
function getTyreSize(p: Product): string {
  if (p.tyreSize) return p.tyreSize;
  if (p.size) return p.size;
  if (p.width && p.height && p.rim) return `${p.width}/${p.height} R${p.rim}`;
  const m = p.name.match(/\d{3}\/\d{2,3}\s*R\d{2}(\s+\d{2,3}[A-Z]{1,2})?/i);
  return m ? m[0].trim() : "";
}

/** Pattern / model name, with brand, size and year stripped off. */
function getPatternName(p: Product): string {
  if (p.pattern) return p.pattern;
  const clean = p.name
    .replace(new RegExp(p.brandName ?? String(p.brand ?? ""), "gi"), "")
    .replace(/\d{3}\/\d{2,3}\s*R\d{2}(\s+\d{2,3}[A-Z]{1,2})?/gi, "")
    .replace(/\b(202[4-9]|203[0-9])\b/g, "")
    .trim();
  return clean || p.name;
}

/** Car icon — the sedan glyph from /icons/sprite.png (CSS sprite:
    car region is 69×24 at (27,26) in the 800×800 sheet). */
function CarSprite() {
  return (
    <span
      role="img"
      aria-label="Compatible Vehicles"
      className="inline-block align-middle select-none hover:opacity-75 transition-opacity"
      style={{
        width: "41px",
        height: "14px",
        backgroundImage: "url(/icons/sprite.png)",
        backgroundRepeat: "no-repeat",
        backgroundSize: "466.67px auto",
        backgroundPosition: "-15.75px -15.17px",
      }}
    />
  );
}

export default function TyreListingCard({
  product,
  locale = "en",
  enableHoverZoom = true,
}: {
  product: Product;
  locale?: Locale;
  /** Image zoom-on-hover */
  enableHoverZoom?: boolean;
}) {
  const href = product.urlKey ? `/${locale}/product/${product.urlKey}` : "#";
  const tyreSize = getTyreSize(product);
  const pattern = getPatternName(product);
  const year = product.year ?? product.name.match(/\b(202[4-9]|203[0-9])\b/)?.[0] ?? "";
  const warranty = product.warrantyPeriod ?? "";
  const origin = product.country ?? product.origin ?? "";

  /* Width / height / rim for the "search this size" trigger — the theme's
     buy-tyre-search-trigger. Use the product's own fields, falling back to
     parsing the size string ("175/70 R14"). */
  const sizeMatch = tyreSize.match(/(\d{3})\/(\d{2,3})\s*R(\d{2})/i);
  const width = product.width ?? sizeMatch?.[1];
  const height = product.height ?? sizeMatch?.[2];
  const rim = product.rim ?? sizeMatch?.[3];
  const sizeSearchHref =
    width && height && rim
      ? `/${locale}/tyres?width=${width}&height=${height}&rim=${rim}`
      : null;

  const brandLabel = product.brandName ?? String(product.brand ?? "");
  const brandLogo = product.brandLogoUrl ?? getBrandLogo(product.brand) ?? getBrandLogo(product.brandName);
  const brandSlug = product.brandName?.toLowerCase().replace(/[^a-z0-9]+/g, "").replace(/(^-|-$)/g, "");
  const brandHref = brandSlug
    ? `/${locale}/tyres/brand/${brandSlug}`
    : null;

  const offerLabels = useOfferLabels(locale === "ar" ? "ar" : "default");
  const offerLabel = product.offersId ? offerLabels[product.offersId] : undefined;

  const { addItem } = useCart();

  const [qty, setQty] = useState(4);
  const [adding, setAdding] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [fitmentOpen, setFitmentOpen] = useState(false);
  const [qtyOpen, setQtyOpen] = useState(false);
  const [priceInfoOpen, setPriceInfoOpen] = useState(false);
  const qtyRef = useRef<HTMLDivElement>(null);

  /* Close the quantity menu on an outside click. */
  useEffect(() => {
    if (!qtyOpen) return;
    const onDown = (e: MouseEvent) => {
      if (qtyRef.current && !qtyRef.current.contains(e.target as Node)) setQtyOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [qtyOpen]);

  const isOutOfStock = product.inStock === false || product.price <= 0;
  const unitPrice = product.price > 0 ? product.price : 0;
  const setPrice = unitPrice * qty;

  async function handleAddToCart() {
    if (adding || cartAdded || isOutOfStock) return;
    setAdding(true);
    try {
      const result = await addItem(product, qty);
      if (!result.error) {
        setCartAdded(true);
        setTimeout(() => setCartAdded(false), 2000);
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <li className="list-none h-full">
      <div className={`flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow${enableHoverZoom ? " group" : ""}`}>

        {/* ── Top Red Banner: Dynamic Offer (Only rendered when product has an offer) ── */}
        {offerLabel && (
          <div className="bg-[#ed1c24] text-white text-center py-2 px-2 font-black text-[14px] sm:text-[15px] uppercase tracking-wide shrink-0">
            <span>{offerLabel}</span>
          </div>
        )}

        <div className="flex flex-col flex-1 p-3 pt-2">

          {/* ── Brand Logo ───────────────────────────────────────── */}
          <div className="flex items-center justify-center h-8 my-2 px-2">
            {brandHref ? (
              <Link href={brandHref} aria-label={`${brandLabel} tyres`}>
                {brandLogo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={brandLogo} alt={brandLabel} className="max-h-7 max-w-[120px] w-auto object-contain" loading="lazy" />
                ) : (
                  <span className="text-[13px] font-black uppercase tracking-wider text-gray-900">{brandLabel}</span>
                )}
              </Link>
            ) : brandLogo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={brandLogo} alt={brandLabel} className="max-h-7 max-w-[120px] w-auto object-contain" loading="lazy" />
            ) : (
              <span className="text-[13px] font-black uppercase tracking-wider text-gray-900">{brandLabel}</span>
            )}
          </div>

          {/* ── Image + Overlays (Warranty & Year) ────────────────── */}
          <div className="relative w-full my-1">
            <Link href={href} className="block relative w-full h-[145px] sm:h-[155px]" aria-label={product.name}>
              <ProductImage
                src={product.image}
                alt={product.name}
                fill
                className={`object-contain p-1${enableHoverZoom ? " group-hover:scale-105 transition-transform duration-300 ease-out" : ""}`}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
              />
            </Link>

            {/* Bottom-left warranty */}
            {warranty && (
              <span className="absolute left-0.5 bottom-0.5 z-10 text-[10.5px] font-black uppercase text-gray-900 leading-none">
                {warranty}
              </span>
            )}

            {/* Bottom-right year */}
            {year && (
              <span className="absolute right-0.5 bottom-0.5 z-10 text-[11px] font-black text-gray-900 leading-none">
                {year}
              </span>
            )}
          </div>

          {/* ── Pattern & Tyre Size ──────────────────────────────── */}
          <div className="text-center mt-2.5 px-1">
            <Link href={href} className="block text-[14px] sm:text-[15px] font-black text-gray-900 hover:text-[#ed1c24] transition-colors leading-tight line-clamp-1">
              {pattern}
            </Link>
            {tyreSize && (
              <span className="block text-[13px] sm:text-[13.5px] font-bold text-gray-800 mt-0.5">
                {tyreSize}
              </span>
            )}
          </div>

          {/* ── Vehicle (search this size) + Origin ───────────────── */}
          <div className="border-t border-b border-gray-100 py-1.5 px-3 flex items-center justify-between my-2">
            {width && height && rim ? (
              <button
                type="button"
                onClick={() => setFitmentOpen(true)}
                aria-label={`Vehicles that fit ${tyreSize}`}
                title="See which cars fit this size"
                className="inline-flex items-center text-gray-900 hover:text-[#ed1c24] transition-colors cursor-pointer"
              >
                <CarSprite />
              </button>
            ) : (
              <span><CarSprite /></span>
            )}
            {origin && <span className="text-[11px] font-bold text-gray-800">{origin}</span>}
          </div>

          {/* ── Price Section ────────────────────────────────────── */}
          <div className="text-center px-1">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPriceInfoOpen(true); }}
              className="text-[10.5px] font-medium text-gray-500 hover:text-gray-800 hover:underline cursor-pointer"
              aria-label="What's included in the fully fitted price"
            >
              Fully Fitted Price per Item
            </button>
            <div className="flex items-center justify-center gap-1 font-black text-gray-900 text-[19px] sm:text-[21px] leading-tight my-0.5">
              <Money value={unitPrice} digits={2} />
            </div>
            <div className="text-[11.5px] font-bold text-gray-700">
              Set of {qty}: <Money value={setPrice} digits={2} />
            </div>
          </div>

          {/* ── Pay In Installments (Tabby / Tamara) ─────── */}
          <div className="flex items-center gap-1.5 my-2 flex-wrap">
            <span className="text-[10.5px] text-gray-500 font-medium">Pay In Installments</span>
            <span className="inline-flex items-center justify-center bg-[#05FFD2] text-black text-[9.5px] font-black px-2 py-0.5 rounded-md leading-none select-none">tabby</span>
            <span className="inline-flex items-center justify-center bg-gradient-to-r from-[#9CE6FE] via-[#FFAF75] to-[#DF82E0] text-black text-[9.5px] font-black px-2 py-0.5 rounded-md leading-none select-none">tamara</span>
          </div>

          {/* ── Bottom Actions ────────────────────────────────────
               Out of stock: full-width red "MAKE ENQUIRY", no qty select.
               In stock: qty select + black/red Add to Cart. */}
          {isOutOfStock ? (
            <div className="pt-1 mt-auto">
              <a
                className="btn-enquiry"
                href={`https://api.whatsapp.com/send/?phone=${APP_CONFIG.contact.whatsapp}&text=${encodeURIComponent(
                  `Hi tyresworld.ae\n\nI would like to enquire about ${product.name}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                title="MAKE ENQUIRY"
              >
                <span>MAKE ENQUIRY</span>
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-1 mt-auto">
              {/* Custom quantity dropdown — the native <select> popup
                  can't be styled (renders the OS dark menu). */}
              <div className="qty-select" ref={qtyRef}>
                <button
                  type="button"
                  className="qty-trigger"
                  onClick={() => setQtyOpen(o => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={qtyOpen}
                  aria-label={`Quantity: ${qty}`}
                >
                  <span>{qty}</span>
                  <ChevronDown size={13} className={`qty-caret ${qtyOpen ? "rotate-180" : ""}`} />
                </button>

                {qtyOpen && (
                  <ul className="qty-menu" role="listbox" aria-label="Quantity">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <li key={n} role="option" aria-selected={n === qty}>
                        <button
                          type="button"
                          className={`qty-option ${n === qty ? "is-selected" : ""}`}
                          onClick={() => { setQty(n); setQtyOpen(false); }}
                        >
                          {n}
                          {n === qty && <Check size={13} className="qty-check" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Keep the value in the DOM for form/accessibility parity. */}
                <input type="hidden" name="qty" value={qty} readOnly />
              </div>

              <button
                type="button"
                className={`btn-tocart ${cartAdded ? "is-added" : ""}`}
                onClick={handleAddToCart}
                disabled={adding}
                title="Add to Cart"
              >
                {adding ? (
                  <><Loader2 size={13} className="animate-spin mr-1.5" /><span>Adding…</span></>
                ) : cartAdded ? (
                  <><Check size={13} className="mr-1.5" /><span>Added</span></>
                ) : (
                  <span>ADD TO CART</span>
                )}
              </button>
            </div>
          )}

        </div>
      </div>

      {width && height && rim && (
        <VehicleFitmentModal
          open={fitmentOpen}
          onClose={() => setFitmentOpen(false)}
          productName={product.name}
          width={width}
          height={height}
          rim={rim}
          locale={locale}
        />
      )}

      <FullyFittedPriceModal isOpen={priceInfoOpen} onClose={() => setPriceInfoOpen(false)} />
    </li>
  );
}
