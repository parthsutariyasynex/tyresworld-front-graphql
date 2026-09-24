"use client";

import { useState, useEffect, useRef } from "react";
import VehicleFitmentModal from "@/components/VehicleFitmentModal";
import Link from "next/link";
import { Loader2, Check, ChevronDown } from "lucide-react";
import FullyFittedPriceModal from "@/components/FullyFittedPriceModal";
import ProductImage from "./ProductImage";
import type { Product } from "@/lib/data";
import { type Locale } from "@/lib/i18n";
import { useOfferLabels } from "@/lib/useOfferLabels";
import { useCart } from "@/lib/cart-context";
import { useOverviewDrawer } from "@/lib/overview-drawer-context";
import { buildTyreSizeSlug, buildBrandSlug } from "@/lib/filterBuilder";
import { Money } from "@/components/Price";
import { APP_CONFIG } from "@/src/config/app-config";
import { isMotorcycleProduct } from "@/lib/magento";

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

/** Car icon — sprite renderer supporting responsive sizing */
function CarSprite({ className = "w-[41px] h-[14px] [background-size:466.67px_auto] [background-position:-15.75px_-15.17px]" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Compatible Vehicles"
      className={`inline-block align-middle select-none hover:opacity-75 transition-opacity shrink-0 ${className}`}
      style={{
        backgroundImage: "url(/icons/sprite.png)",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}

function formatWarrantyBadge(w?: string | null): string | null {
  if (!w || !w.trim()) return null;
  const clean = w.trim();
  const num = clean.match(/\d+/)?.[0];
  if (num) return `${num} YR WARRANTY`;
  if (clean.toLowerCase().includes("warranty")) return clean.toUpperCase();
  return `${clean.toUpperCase()} WARRANTY`;
}

/** Motorcycle icon — same /icons/sprite.png sheet, the "bike" region.
    Values (48×25, background-size 1000% auto, position 44.6% 2.1%) are
    copied verbatim from the live site's own computed style for
    `.vehicle.sprite.bike`, not estimated — those percentages only resolve
    correctly at this exact element size against this exact sprite file. */
function BikeSprite() {
  return (
    <span
      role="img"
      aria-label="Motorcycle"
      className="inline-block align-middle select-none"
      style={{
        width: "48px",
        height: "25px",
        backgroundImage: "url(/icons/sprite.png)",
        backgroundRepeat: "no-repeat",
        backgroundSize: "1000% auto",
        backgroundPosition: "44.6% 2.1%",
      }}
    />
  );
}

export default function TyreListingCard({
  product,
  locale = "en",
  enableHoverZoom = true,
  vehicleIcon = "car",
}: {
  product: Product;
  locale?: Locale;
  /** Image zoom-on-hover */
  enableHoverZoom?: boolean;
  /** Which vehicle glyph + behaviour to show next to the origin — "car"
      (default) is a clickable "which cars fit this size" trigger, matching
      every non-motorcycle category on the live site; "bike" (only passed
      for the motorcycle-tyre category) is the live site's plain, non-clickable
      bike icon — motorcycle tyres have no vehicle-fitment lookup there. */
  vehicleIcon?: "car" | "bike";
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
      ? buildTyreSizeSlug({ width, height, rim })
      : null;

  const brandLabel = product.brandName ?? String(product.brand ?? "");
  const brandLogo = product.brandLogoUrl;
  const brandSlug = buildBrandSlug(product.brandName || brandLabel);
  const brandHref = brandSlug
    ? `/tyres/brand/${brandSlug}`
    : null;

  const offerLabels = useOfferLabels("default");
  const offerLabel = product.offersId ? offerLabels[product.offersId] : undefined;

  const { addItem } = useCart();
  const { openDrawer } = useOverviewDrawer();

  const isBike = vehicleIcon === "bike" || isMotorcycleProduct(product);
  const defaultCardQty =
    product.qtyOptions?.defaultQty && product.qtyOptions.defaultQty > 0
      ? product.qtyOptions.defaultQty
      : isBike
      ? 2
      : 4;
  const [qty, setQty] = useState(defaultCardQty);
  // Options come from Klever's kleverQtyOptions (per-SKU salable/max qty) —
  // no fallback list is fabricated when the API returns none.
  const qtyMenuOptions = Array.from(new Set([...(product.qtyOptions?.options ?? []), qty])).sort((a, b) => a - b);
  const qtySelectable = qtyMenuOptions.length > 1;
  const [adding, setAdding] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
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

  /* The live site never offers Add to Cart for motorcycle tyres — every
     one of dozens of checked products shows "Make Enquiry" regardless of
     its real Magento stock_status (confirmed IN_STOCK for at least one),
     so this isn't a stock check for bikes, it's a fixed category rule
     (motorcycle fitting needs a staff consultation, unlike car tyres). */
  const isOutOfStock =
    isBike ||
    product.inStock === false ||
    product.price <= 0 ||
    product.qtyOptions?.canAddToCart === false;
  const unitPrice = product.price > 0 ? product.price : 0;

  /* Real per-set price from Magento's own pricing/promo rules (kleverSetPricing)
     when the selected qty is a real set tier (1/2/4) — set4 already has any
     matching bulk-buy discount applied server-side (resolveSetPricing in
     lib/magento.ts), computed from the API's own real promo_discount_amount/
     promo_discount_step fields, not guessed client-side. Falls back to a
     plain unitPrice × qty multiplication for any other quantity, or if the
     backend returned no set pricing for this SKU at all. */
  let realSetPrice =
    qty === 1 ? product.setPricing?.set1
    : qty === 2 ? product.setPricing?.set2
    : qty === 4 ? product.setPricing?.set4
    : undefined;

  /* Quantities beyond the API's own set1/set2/set4 tiers (e.g. 8, two sets
     of 4) — extend the SAME real discount rate/step the API already
     returned, rather than losing it above the highest tier Magento quotes. */
  const { promoDiscountAmount, promoDiscountStep } = product.setPricing ?? {};
  if (
    realSetPrice == null &&
    promoDiscountStep === 4 &&
    promoDiscountAmount != null &&
    promoDiscountAmount > 0 &&
    promoDiscountAmount < 100 &&
    qty > 0 &&
    qty % 4 === 0
  ) {
    realSetPrice = qty * unitPrice * (1 - promoDiscountAmount / 100);
  }

  const setPrice = realSetPrice ?? unitPrice * qty;

  async function handleAddToCart() {
    if (adding || cartAdded || isOutOfStock) return;
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
        openDrawer("cart");
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <li className="list-none self-end w-full flex flex-col">
      
      {/* ── Top Banner: Dynamic Offer (Light Red Theme) ── */}
      {offerLabel && (
        <div className="bg-[#fef2f2] text-[#ed1c24] text-center py-2 px-2 font-black text-xs uppercase tracking-wider flex items-center justify-center shrink-0 border border-b-0 border-red-100 rounded-t-2xl">
          <span>{offerLabel}</span>
        </div>
      )}

      <div className={`flex flex-col bg-white border border-gray-200/90 overflow-hidden shadow-xs hover:shadow-md transition-shadow ${offerLabel ? "rounded-b-2xl border-t-0" : "rounded-2xl"}${enableHoverZoom ? " group" : ""}`}>

        <div className="flex flex-col flex-1 p-2.5 sm:p-3 pt-1.5 sm:pt-2">

          {/* ── 1. Top Header: Warranty Badge (Left) & Brand Logo (Right) ── */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full min-h-[28px] sm:min-h-[38px] mb-1.5 sm:mb-2">
            {/* Warranty Badge (Top Left - only shown if present on product) */}
            {formatWarrantyBadge(warranty) ? (
              <span className="inline-flex items-center bg-[#f0f2f5] text-gray-800 text-[10px] sm:text-[12px] font-extrabold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full uppercase tracking-tight shadow-2xs shrink-0 max-w-[48%] truncate">
                {formatWarrantyBadge(warranty)}
              </span>
            ) : (
              <div />
            )}

            {/* Brand Logo (Top Right) */}
            <div className="flex items-center justify-end max-w-[65%] shrink-0">
              {brandHref ? (
                <Link href={brandHref} aria-label={`${brandLabel} tyres`}>
                  {brandLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={brandLogo} alt={brandLabel} className="w-[85px] sm:w-[130px] h-auto max-h-8 sm:max-h-11 object-contain" loading="lazy" />
                  ) : (
                    <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-tight text-gray-900 truncate">{brandLabel}</span>
                  )}
                </Link>
              ) : brandLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brandLogo} alt={brandLabel} className="w-[85px] sm:w-[130px] h-auto max-h-8 sm:max-h-11 object-contain" loading="lazy" />
              ) : (
                <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-tight text-gray-900 truncate">{brandLabel}</span>
              )}
            </div>
          </div>

          {/* ── 2. Tyre Image Section (Clear, no text overlapping the tyre) ── */}
          <div className="relative w-full h-[100px] sm:h-[120px] my-0.5">
            <Link href={href} className="block relative w-full h-full" aria-label={product.name}>
              <ProductImage
                src={product.image}
                alt={product.name}
                fill
                className={`object-contain p-0.5 drop-shadow-xs${enableHoverZoom ? " group-hover:scale-105 transition-transform duration-300 ease-out" : ""}`}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px"
              />
            </Link>
          </div>

          {/* ── 2A. Mobile & Tablet Information Section (< 1024px) ── */}
          <div className="flex lg:hidden flex-col flex-1 justify-between my-1">
            {/* Row A: Pattern Name & Origin on Left, Unit Price on Right */}
            <div className="flex items-start justify-between gap-1.5">
              <div className="min-w-0 flex-1">
                <Link href={href} className="text-[12px] sm:text-[13.5px] font-black text-gray-900 hover:text-[#ed1c24] transition-colors leading-tight block truncate" title={pattern}>
                  {pattern}
                </Link>
                {(year || origin) && (
                  <div className="text-[8.5px] sm:text-[10px] font-medium text-gray-500 mt-0.5 truncate">
                    {[year, origin].filter(Boolean).join(" | ")}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="font-black text-gray-950 text-[14.5px] sm:text-[17.5px] leading-tight">
                  <Money value={unitPrice} digits={2} />
                </div>
              </div>
            </div>

            {/* Row B: Tyre Size & Compatible Vehicle Fitment (Full Width, Never Truncated) */}
            <div className="border border-gray-200/90 rounded-md h-[26px] sm:h-[29px] px-1.5 sm:px-2 flex items-center justify-between my-1 bg-white shadow-2xs w-full">
              <span className="text-[9.5px] sm:text-[11px] font-black text-gray-900 tracking-tight truncate min-w-0 pr-1">
                {tyreSize || "Standard"}
              </span>

              {isBike ? (
                <span className="shrink-0 ml-1"><BikeSprite /></span>
              ) : width && height && rim ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFitmentOpen(true);
                  }}
                  aria-label={`Vehicles that fit ${tyreSize}`}
                  title="See which cars fit this size"
                  className="inline-flex items-center text-gray-900 hover:text-[#ed1c24] transition-colors cursor-pointer shrink-0 ml-1"
                >
                  <CarSprite className="w-[28px] h-[10px] [background-size:318px_auto] [background-position:-10.7px_-10.3px]" />
                </button>
              ) : (
                <span className="shrink-0 ml-1"><CarSprite className="w-[28px] h-[10px] [background-size:318px_auto] [background-position:-10.7px_-10.3px]" /></span>
              )}
            </div>

            {/* Row C: Set Price (Left) + Fully Fitted Link (Right) */}
            <div className="flex items-center justify-between gap-1 my-0.5 text-[8.5px] sm:text-[10px]">
              <span className="font-bold text-gray-700 whitespace-nowrap">
                Set of {qty}: <span className="font-black text-gray-950"><Money value={setPrice} digits={2} /></span>
              </span>

              {!isBike && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPriceInfoOpen(true); }}
                  className="text-[7.5px] sm:text-[9px] font-medium text-gray-500 hover:text-gray-800 hover:underline cursor-pointer whitespace-nowrap shrink-0 ml-auto"
                  aria-label="What's included in the fully fitted price"
                >
                  Fully Fitted Price
                </button>
              )}
            </div>

            {/* Row D: Pay In Installments (Tabby & Tamara) */}
            {!isBike && (
              <div className="flex items-center gap-1 my-0.5">
                <span className="text-[7.5px] sm:text-[8.5px] text-gray-500 font-medium shrink-0">Pay In</span>
                <span className="inline-flex items-center justify-center bg-[#05FFD2] text-black text-[7px] sm:text-[8px] font-black px-1.5 py-0.5 rounded-xs leading-none select-none">tabby</span>
                <span className="inline-flex items-center justify-center bg-gradient-to-r from-[#9CE6FE] via-[#FFAF75] to-[#DF82E0] text-black text-[7px] sm:text-[8px] font-black px-1.5 py-0.5 rounded-xs leading-none select-none">tamara</span>
              </div>
            )}
          </div>

          {/* ── 2B. Desktop Two-Column Information Section (>= 1024px) ── */}
          <div className="hidden lg:grid grid-cols-2 gap-2 my-1 flex-1">
            {/* Left Column: Name, Year & Country, Size + Car Icon */}
            <div className="flex flex-col justify-between">
              <div>
                {/* Pattern / Model Name */}
                <Link href={href} className="text-[13.5px] font-black text-gray-900 hover:text-[#ed1c24] transition-colors leading-tight block truncate" title={pattern}>
                  {pattern}
                </Link>

                {/* Year & Origin */}
                {(year || origin) && (
                  <div className="text-[10.5px] font-medium text-gray-500 mt-0.5 truncate">
                    {[year, origin].filter(Boolean).join(" | ")}
                  </div>
                )}
              </div>

              {/* Tyre Size & Compatible Vehicle Box */}
              <div className="border border-gray-200/90 rounded-md h-[30px] px-2 flex items-center justify-between mt-1 bg-white shadow-2xs">
                <span className="text-[11px] font-extrabold text-gray-900 truncate">
                  {tyreSize || "Standard"}
                </span>

                {isBike ? (
                  <span><BikeSprite /></span>
                ) : width && height && rim ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFitmentOpen(true);
                    }}
                    aria-label={`Vehicles that fit ${tyreSize}`}
                    title="See which cars fit this size"
                    className="inline-flex items-center text-gray-900 hover:text-[#ed1c24] transition-colors cursor-pointer shrink-0 ml-1"
                  >
                    <CarSprite className="w-[41px] h-[14px] [background-size:466.67px_auto] [background-position:-15.75px_-15.17px]" />
                  </button>
                ) : (
                  <span className="shrink-0 ml-1"><CarSprite className="w-[41px] h-[14px] [background-size:466.67px_auto] [background-position:-15.75px_-15.17px]" /></span>
                )}
              </div>
            </div>

            {/* Right Column: Price, Set of Price, Fully Fitted, Installments */}
            <div className="flex flex-col justify-between text-right">
              <div>
                {/* Price */}
                <div className="font-black text-gray-900 text-[18px] leading-tight">
                  <Money value={unitPrice} digits={2} />
                </div>

                {/* Set of X Price */}
                <div className="text-[10.5px] font-bold text-gray-700">
                  Set of {qty}: <Money value={setPrice} digits={2} />
                </div>

                {/* Fully Fitted Price per item popup */}
                {isBike ? (
                  <span className="text-[9.5px] font-medium text-gray-500 block mt-0.5">
                    Fully Fitted Price
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPriceInfoOpen(true); }}
                    className="text-[9.5px] font-medium text-gray-500 hover:text-gray-800 hover:underline cursor-pointer block ml-auto mt-0.5"
                    aria-label="What's included in the fully fitted price"
                  >
                    Fully Fitted Price
                  </button>
                )}

                {/* Pay in Installments (Tabby & Tamara) */}
                {!isBike && (
                  <div className="flex items-center justify-end gap-1 mt-0.5 flex-wrap">
                    <span className="text-[8.5px] text-gray-500 font-medium">Pay In</span>
                    <span className="inline-flex items-center justify-center bg-[#05FFD2] text-black text-[7.5px] font-black px-1.5 py-0.5 rounded-xs leading-none select-none">tabby</span>
                    <span className="inline-flex items-center justify-center bg-gradient-to-r from-[#9CE6FE] via-[#FFAF75] to-[#DF82E0] text-black text-[7.5px] font-black px-1.5 py-0.5 rounded-xs leading-none select-none">tamara</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── 3. Bottom Actions ───────────────────────────────── */}
          {isOutOfStock ? (
            <div className="pt-1 mt-auto">
              <a
                className="btn-enquiry h-8 sm:h-8.5 text-xs"
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
            <>
            <div className="flex items-center gap-1.5 pt-1 mt-auto">
              {/* Quantity dropdown */}
              <div className="qty-select" ref={qtyRef}>
                <button
                  type="button"
                  className="qty-trigger h-8 sm:h-8.5 px-2.5 text-xs"
                  disabled={!qtySelectable}
                  onClick={() => setQtyOpen(o => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={qtyOpen}
                  aria-label={`Quantity: ${qty}`}
                >
                  <span className="font-bold text-xs sm:text-sm">{qty}</span>
                  <ChevronDown size={12} className={`qty-caret ${qtyOpen ? "rotate-180" : ""}`} />
                </button>

                {qtyOpen && qtySelectable && (
                  <ul className="qty-menu" role="listbox" aria-label="Quantity">
                    {qtyMenuOptions.map((n) => (
                      <li key={n} role="option" aria-selected={n === qty}>
                        <button
                          type="button"
                          className={`qty-option ${n === qty ? "is-selected" : ""}`}
                          onClick={() => { setQty(n); setQtyOpen(false); }}
                        >
                          {n}
                          {n === qty && <Check size={12} className="qty-check" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <input type="hidden" name="qty" value={qty} readOnly />
              </div>

              <button
                type="button"
                className={`btn-tocart h-8 sm:h-8.5 px-3 text-xs ${cartAdded ? "is-added" : ""}`}
                onClick={handleAddToCart}
                disabled={adding}
                title="Add to Cart"
              >
                {adding ? (
                  <><Loader2 size={12} className="animate-spin mr-1" /><span>Adding…</span></>
                ) : cartAdded ? (
                  <><Check size={12} className="mr-1" /><span>Added</span></>
                ) : (
                  <span>ADD TO CART</span>
                )}
              </button>
            </div>
            {addError && (
              <p className="text-[10px] text-[#ed1c24] font-semibold mt-1 text-center line-clamp-2">{addError}</p>
            )}
            </>
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
