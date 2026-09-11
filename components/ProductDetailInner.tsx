"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Info, X, Loader2, Check, ShoppingBag, Star, ArrowLeft, ArrowRight, CheckCircle, Gauge, Leaf } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import type { ProductDetail } from "@/lib/magento";
import type { Product } from "@/lib/data";
import type { ApiProductsResponse } from "@/lib/magento";
import { useOfferLabels } from "@/lib/useOfferLabels";
import { getBrandLogo } from "@/lib/brandLogos";
import { useCart } from "@/lib/cart-context";
import TyreListingCard from "@/components/TyreListingCard";
import TyreListingCardSkeleton from "@/components/TyreListingCardSkeleton";
import TyreFinder from "@/components/TyreFinder";
import StickyBottomFinder from "@/components/home/partora/StickyBottomFinder";
import DriverReviewsWidget from "@/components/DriverReviews/DriverReviewsWidget";
import VehicleFitmentModal from "@/components/VehicleFitmentModal";
import { APP_CONFIG } from "@/src/config/app-config";
import JsonLd from "@/components/JsonLd";
import { useCurrencyCode } from "@/lib/store-config-context";
import { Money } from "@/components/Price";


/* ══════════════════════════════════════════════════════════════════
   TYRE NAME PARSER
   Parses "Continental 275/40 R22 107Y Runflat ContiPremiumContact 6 SSR * 2025"
   into structured spec fields.
══════════════════════════════════════════════════════════════════ */
interface TyreSpecs {
  size: string | null;   // "275/40 R22"
  loadIndex: string | null;   // "107Y"
  pattern: string | null;   // "ContiPremiumContact 6"
  oemMarking: string | null;   // "SSR *"
  year: string | null;   // "2025"
  isRunFlat: boolean;
  hasXL: boolean;
}

const OEM_TOKENS = [
  "SSR *", "SSR*", "SSR", "MOE", "MO1", "MO", "AO",
  "N0", "N1", "N2", "N3", "N4", "VOL", "RSC", "RFT",
  "ZP", "AR", "LS", "J", "HN", "GD",
];

function parseTyreProductName(name: string): TyreSpecs {
  const yearMatch = name.match(/\b(20\d{2})\b/);
  const year = yearMatch?.[1] ?? null;

  const sizeMatch = name.match(/(\d{3}\/\d{2,3}\s*[Rr]\d{2})/);
  if (!sizeMatch || sizeMatch.index === undefined) {
    return { size: null, loadIndex: null, pattern: null, oemMarking: null, year, isRunFlat: false, hasXL: false };
  }

  const size = sizeMatch[1].trim();
  const brand = name.slice(0, sizeMatch.index).trim();      // unused but kept for clarity
  void brand;
  const afterSize = name.slice(sizeMatch.index + size.length).trim();

  // Load index: first token like 107Y, 101V, 91W
  const loadMatch = afterSize.match(/^(\d{2,3}[A-Za-z]{1,2}(?:\/\d{2,3}[A-Za-z]{1,2})?)\b/);
  const loadIndex = loadMatch?.[1]?.toUpperCase() ?? null;
  const rest = (loadMatch ? afterSize.slice(loadMatch[0].length) : afterSize).trim();

  const isRunFlat = /\b(run.?flat|runflat|rft|rsc|zp)\b/i.test(name);
  const hasXL = /\bXL\b/.test(rest);

  // Strip year from end of rest
  const restNoYear = year ? rest.replace(new RegExp(`\\s*\\b${year}\\b\\s*$`), "").trim() : rest;

  // OEM: check if restNoYear ends with any known OEM token
  let oemMarking: string | null = null;
  for (const oem of OEM_TOKENS) {
    if (restNoYear.endsWith(oem) || restNoYear.endsWith(oem + " ")) {
      oemMarking = oem;
      break;
    }
  }

  // Pattern: remove OEM from end, then remove runflat/XL keywords
  let patternRaw = oemMarking
    ? restNoYear.slice(0, restNoYear.lastIndexOf(oemMarking)).trim()
    : restNoYear;

  const pattern = patternRaw
    .replace(/\b(run.?flat|Runflat|RunFlat|RFT|XL)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim() || null;

  return { size, loadIndex, pattern, oemMarking, year, isRunFlat, hasXL };
}

/* ══════════════════════════════════════════════════════════════════
   BRAND LOGO
 ══════════════════════════════════════════════════════════════════ */
function BrandLogoDisplay({ brandId, brandName }: { brandId?: string; brandName?: string }) {
  const logo = getBrandLogo(brandId) || getBrandLogo(brandName);
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo} alt={brandName ?? ""} className="h-12 w-auto object-contain" />
    );
  }
  if (brandName) {
    return <p className="text-xl font-black uppercase tracking-widest text-gray-900">{brandName}</p>;
  }
  return null;
}

function SpecsRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const stars = [];
  const activeColor = "#b02a8a"; // Magenta/purple rating color from screenshot
  const inactiveColor = "#e5e7eb"; // Light gray

  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars.push(
        <svg key={i} className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={activeColor}>
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      );
    } else if (i - 0.5 <= rating) {
      stars.push(
        <div key={i} className="relative w-3.5 h-3.5">
          <svg className="absolute top-0 left-0 w-3.5 h-3.5" viewBox="0 0 24 24" fill={inactiveColor}>
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
          <div className="absolute top-0 left-0 overflow-hidden w-[50%] h-full">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={activeColor}>
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </div>
        </div>
      );
    } else {
      stars.push(
        <svg key={i} className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={inactiveColor}>
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      );
    }
  }

  // No reviews from the backend → show empty state, not a fake 0.0/5 score.
  if (!reviewCount && !rating) {
    return <span className="text-[12px] italic text-gray-400">Not rated yet</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">{stars}</div>
      <span className="text-[12px] font-black ml-1" style={{ color: activeColor }}>
        {rating.toFixed(1)}/5
      </span>
      <span className="text-[11px] text-gray-500 ml-1">
        ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
      </span>
    </div>
  );
}

function SpecsTable({
  specs,
  product,
  onCheckFitment,
}: {
  specs: TyreSpecs;
  product: ProductDetail;
  onCheckFitment?: () => void;
}) {
  const brandName = product.brandName ?? product.brand ?? null;
  const origin = product.country ?? product.origin ?? null;
  // No fabricated fallback — show "—" like every other spec when Magento has no warranty value.
  const warranty = product.warrantyPeriod ?? null;

  const rows = [
    {
      left: { label: "Brand", value: brandName },
      right: { label: "Pattern", value: specs.pattern },
    },
    {
      left: { label: "Size", value: specs.size },
      right: { label: "Load Index", value: specs.loadIndex },
    },
    {
      left: { label: "Origin", value: origin },
      right: { label: "Year", value: specs.year },
    },
    {
      left: { label: "Warranty Period", value: warranty },
      right: specs.isRunFlat
        ? { label: "Run Flat", value: "Yes" }
        : specs.oemMarking
        ? { label: "OEM Marking", value: specs.oemMarking }
        : { label: "", value: "" },
    },
  ];

  return (
    <div className="border border-gray-200/90 rounded-xl overflow-hidden bg-white shadow-2xs flex flex-col justify-between">
      {/* ── Header ── */}
      <div className="px-5 pt-4 pb-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-950 font-sans">
          PRODUCT SPECIFICATIONS
        </h3>
      </div>

      {/* ── 2-Column Table Grid ── */}
      <div className="divide-y divide-gray-100 px-5">
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-2 py-3 text-[13px] items-center">
            {/* Left Column */}
            <div className="flex items-center gap-2 sm:gap-3 pr-2">
              <span className="text-gray-500 font-medium w-24 sm:w-28 shrink-0">{row.left.label}</span>
              <span className="text-gray-950 font-bold truncate">{row.left.value ?? "—"}</span>
            </div>
            {/* Right Column */}
            <div className="flex items-center gap-2 sm:gap-3 pl-2">
              {row.right.label ? (
                <>
                  <span className="text-gray-500 font-medium w-20 sm:w-24 shrink-0">{row.right.label}</span>
                  <span className="text-gray-950 font-bold truncate">{row.right.value ?? "—"}</span>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* ── Check Vehicle Section ── */}
      <div className="p-4 flex items-center gap-3 bg-[#f8f9fa] border-t border-gray-100 mt-2">
        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[#5ac8d8]/20 shadow-2xs">
          <svg className="w-5 h-5 text-[#ed1c24]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.5 11.5L20 8.5C19.5 8 18.5 7.5 17.5 7.5H6.5C5.5 7.5 4.5 8 4 8.5L0.5 11.5C0.2 11.8 0 12.1 0 12.5V17C0 17.6 0.4 18 1 18H3C3 19.7 4.3 21 6 21C7.7 21 9 19.7 9 18H15C15 19.7 16.3 21 18 21C19.7 21 21 19.7 21 18H23C23.6 18 24 17.6 24 17V12.5C24 12.1 23.8 11.8 23.5 11.5ZM6 19.5C5.2 19.5 4.5 18.8 4.5 18C4.5 17.2 5.2 16.5 6 16.5C6.8 16.5 7.5 17.2 7.5 18C7.5 18.8 6.8 19.5 6 19.5ZM18 19.5C17.2 19.5 16.5 18.8 16.5 18C16.5 17.2 17.2 16.5 18 16.5C18.8 16.5 19.5 17.2 19.5 18C19.5 18.8 18.8 19.5 18 19.5ZM21.5 13.5H2.5V12.5L5.5 9.8C5.8 9.5 6.2 9.4 6.6 9.4H17.4C17.8 9.4 18.2 9.5 18.5 9.8L21.5 12.5V13.5Z" />
          </svg>
        </div>
        <button
          type="button"
          onClick={onCheckFitment}
          className="btn-slide-black text-[11px] sm:text-xs font-black uppercase tracking-wider py-3 px-5 rounded-md text-center cursor-pointer shadow-2xs"
        >
          <span>CHECK IF THIS TYRE FITS IN YOUR VEHICLE</span>
        </button>
      </div>
    </div>
  );
}

function PricingCard({
  product,
  onPriceInfoClick,
}: {
  product: ProductDetail;
  onPriceInfoClick: () => void;
  onShareClick?: () => void;
}) {
  const currency = product.currency || undefined;
  const hasPrice = product.price > 0;
  const fmt = (v: number) => <Money value={v} currency={currency} />;

  const { addItem } = useCart();
  const [qty, setQty] = useState(4);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const isOutOfStock = product.inStock === false;
  const setOf4Price = hasPrice ? product.price * 4 : 0;

  async function handleAddToCart() {
    if (adding) return;
    setAdding(true);
    setAddError(null);
    try {
      const result = await addItem(product, qty);
      if (result.error) {
        setAddError(result.error);
        setTimeout(() => setAddError(null), 4000);
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Main Pricing Box ── */}
      <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-2xs">
        {/* Label */}
        <button
          type="button"
          onClick={onPriceInfoClick}
          className="text-xs text-gray-700 font-medium hover:text-gray-900 hover:underline cursor-pointer"
          aria-label="What's included in the fully fitted price"
        >
          Fully Fitted Price per Item
        </button>

        {/* Big Price */}
        {hasPrice ? (
          <div className="mt-1 mb-2">
            <p className="text-3xl font-black text-gray-950 tracking-tight">
              {fmt(product.price)}
            </p>
            <p className="text-sm font-bold text-gray-900 mt-1">
              Set of 4: <span className="font-extrabold">{fmt(setOf4Price)}</span>
            </p>
          </div>
        ) : (
          <p className="text-xl font-bold text-gray-950 mt-1 mb-3">Price on Contact</p>
        )}

        {/* CTA & Quantity */}
        {isOutOfStock || !hasPrice ? (
          <a
            href={`https://wa.me/${APP_CONFIG.contact.whatsapp}?text=${encodeURIComponent(`Hi, I'm interested in: ${product.name}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#049b43] hover:bg-[#038237] text-white font-bold text-sm py-3 rounded-md transition-colors w-full cursor-pointer"
          >
            <WaIcon />
            Contact Us
          </a>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 h-10 bg-[#f0f0f0] text-gray-950 border border-gray-200 text-center font-black rounded-md text-sm focus:outline-none shrink-0"
              />
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding}
                className="btn-slide-black flex-1 h-10 text-xs font-black uppercase tracking-wider rounded-md disabled:opacity-60 cursor-pointer shadow-2xs"
              >
                <span>{adding ? "Adding..." : "ADD TO CART"}</span>
              </button>
            </div>
            {addError && <p className="text-[11px] text-red-500 text-center">{addError}</p>}
          </div>
        )}

        {/* Split in 4 Payment with Tabby & Tamara */}
        <div className="mt-4 pt-3.5 border-t border-gray-100">
          <p className="text-xs text-gray-600 font-medium mb-2">Split in 4 Payment with</p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center bg-[#05FFD2] text-black text-xs font-black px-3 py-1 rounded-md leading-none select-none">
              tabby
            </span>
            <span className="inline-flex items-center justify-center bg-black text-white text-xs font-bold px-3 py-1 rounded-md leading-none select-none">
              tamara
            </span>
          </div>
        </div>
      </div>

      {/* ── 3 Trust Badges Card ── */}
      <div className="bg-white border border-gray-200/90 rounded-xl p-4 space-y-4 shadow-2xs">
        {/* Fast Shipping & Installation */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ed1c24] text-white flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-gray-900 leading-tight">
              FAST SHIPPING &amp; INSTALLATION
            </p>
            <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
              We deliver and install most orders on the same day.
            </p>
          </div>
        </div>

        {/* Free Wheel Balancing */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ed1c24] text-white flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="2" x2="12" y2="8" />
              <line x1="12" y1="16" x2="12" y2="22" />
              <line x1="2" y1="12" x2="8" y2="12" />
              <line x1="16" y1="12" x2="22" y2="12" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-gray-900 leading-tight">
              FREE WHEEL BALANCING
            </p>
            <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
              Free wheel balancing included with every tyre installation.
            </p>
          </div>
        </div>

        {/* Always Authentic */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ed1c24] text-white flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-gray-900 leading-tight">
              ALWAYS AUTHENTIC
            </p>
            <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
              We only sell 100% authentic products backed by manufacturers warranty
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RATINGS SECTION  — matches reference driverreviews design
══════════════════════════════════════════════════════════════════ */
const DR_MAGENTA = "#8b1a6b";

function RatingsSection({
  product,
  onWriteReviewClick,
}: {
  product: ProductDetail;
  onWriteReviewClick: () => void;
}) {
  const count = product.reviewCount ?? 0;
  const rating = product.rating ?? 0;

  // Build heading title: "BRAND PATTERN" e.g. "PIRELLI P ZERO PZ4"
  const specs = parseTyreProductName(product.name);
  const brandName = String(product.brandName ?? product.brand ?? "").toUpperCase();
  const patternName = (specs.pattern ?? "").toUpperCase();
  const displayTitle = [brandName, patternName].filter(Boolean).join(" ") || product.name.toUpperCase();

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between pb-4 mb-5"
        style={{ borderBottom: `2px solid ${DR_MAGENTA}` }}
      >
        <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-gray-900">
          RATINGS &amp; REVIEWS
        </h2>
        {/* driverreviews logo */}
        <div className="text-right leading-tight">
          <p className="text-[10px] text-gray-400">Powered by</p>
          <p className="font-black text-[17px] tracking-tight text-gray-900">
            driver<span style={{ color: DR_MAGENTA }}>reviews</span>
          </p>
        </div>
      </div>

        {/* ── Review count line ────────────────────────────────── */}
        <p className="text-[15px] font-black uppercase text-gray-900 mb-1">
          THERE ARE{" "}
          <span style={{ color: DR_MAGENTA }}>{count}</span>{" "}
          REVIEWS OF THE{" "}
          <span style={{ color: DR_MAGENTA }}>{displayTitle}</span>
        </p>
        <p className="text-[13px] text-gray-500 mb-5">
          {count} total ratings, with {count} review comments
        </p>

        <div className="border-t border-gray-200 pt-5">
          <p className="text-[14px] font-semibold text-gray-700 mb-3">Overall rating</p>

          {/* ── Overall rating box ───────────────────────────── */}
          <div className="border border-gray-200 rounded-sm px-4 py-3 flex items-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map(i => (
              <svg
                key={i}
                width="22"
                height="22"
                viewBox="0 0 12 12"
                fill={count > 0 && i <= Math.round(rating) ? DR_MAGENTA : "#E5E7EB"}
              >
                <path d="M6 1l1.4 2.8 3.1.4-2.2 2.2.5 3.1L6 8.1l-2.8 1.4.5-3.1L1.5 4.2l3.1-.4z" />
              </svg>
            ))}
            <span className="text-xl font-black text-gray-900 ml-1">
              {count > 0 ? `${rating.toFixed(1)}/5` : "Not rated yet"}
            </span>
          </div>

          {/* ── Write a Review CTA — jumps to the form below ─────── */}
          <div className="flex justify-center mb-5">
            <button
              type="button"
              onClick={onWriteReviewClick}
              className="btn-slide-black text-[14px] font-bold px-14 py-3 rounded-md"
            >
              <span>Write a Review</span>
            </button>
          </div>
        </div>

        {/* ── Footer disclaimer ────────────────────────────────── */}
        <div className="bg-gray-50 border border-gray-100 px-4 py-3 text-[13px] text-gray-600 rounded-sm">
          If you purchased this product but did not receive a tyre review email,{" "}
          <button type="button" className="hover:underline" style={{ color: DR_MAGENTA }}>
            contact us
          </button>.{" "}
          <button type="button" className="hover:underline" style={{ color: DR_MAGENTA }}>
            Learn more
          </button>{" "}
          about how DriverReviews moderates reviews.
        </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   OVERVIEW TAB — product description
══════════════════════════════════════════════════════════════════ */
function OverviewTabContent({ product }: { product: ProductDetail }) {
  const hasDescription = !!(product.shortDescriptionHtml || product.descriptionHtml);

  if (!hasDescription) {
    return (
      <p className="text-sm text-gray-400 italic">
        No description available for this product yet.
      </p>
    );
  }

  const htmlClasses =
    "text-[14px] leading-relaxed text-gray-700 [&_p]:mb-3 [&_p:last-child]:mb-0 " +
    "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 " +
    "[&_li]:mb-1 [&_strong]:font-bold [&_strong]:text-gray-900 [&_a]:text-[#ed1c24] [&_a]:underline";

  return (
    <div className="space-y-5">
      {product.shortDescriptionHtml && (
        <div
          className={htmlClasses}
          dangerouslySetInnerHTML={{ __html: product.shortDescriptionHtml }}
        />
      )}
      {product.descriptionHtml && (
        <div
          className={htmlClasses}
          dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PRODUCT INFO TABS — Overview / Specifications / Reviews
   Tab state is lifted to the parent so the quick-specs strip above
   can jump straight to the Specifications tab.
══════════════════════════════════════════════════════════════════ */
type ProductTabKey = "overview" | "reviews";

const PRODUCT_TABS: { key: ProductTabKey; label: string }[] = [
  { key: "overview", label: "Details" },
  { key: "reviews", label: "Reviews" },
];

function ProductInfoTabs({
  activeTab,
  onTabChange,
  product,
}: {
  activeTab: ProductTabKey;
  onTabChange: (tab: ProductTabKey) => void;
  product: ProductDetail;
}) {
  return (
    <div id="product-info-tabs" className="mt-8 lg:mt-10 scroll-mt-24">
      {/* ── Tab bar ── */}
      <div className="flex gap-8 border-b border-gray-200 pb-2 mb-6" role="tablist">
        {PRODUCT_TABS.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(t.key)}
              className={`text-sm font-bold transition-colors cursor-pointer ${
                isActive ? "text-gray-950 font-black" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab panels ── */}
      <div>
        {activeTab === "overview" && <OverviewTabContent product={product} />}

        {activeTab === "reviews" && (
          <div>
            <WriteReviewCard product={product} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RELATED PRODUCTS — same tyre size
══════════════════════════════════════════════════════════════════ */
function RelatedProductsSection({
  size,
  currentSku,
  locale = "en",
}: {
  size: string | null;
  currentSku?: string;
  locale?: string;
}) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!size) return;
    setLoading(true);
    fetch(`/api/products?search=${encodeURIComponent(size)}&pageSize=12`)
      .then(r => r.json())
      .then((j: ApiProductsResponse) => {
        setProducts(
          (j.products ?? [])
            .filter(p => !currentSku || p.sku !== currentSku)
            .slice(0, 10)
        );
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [size, currentSku]);

  if (!size || (!loading && products.length === 0)) return null;

  return (
    <section className="py-10 bg-white border-t border-gray-100">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black uppercase tracking-widest">
            SEE OTHER TYRES IN{" "}
            <span className="text-[#ed1c24]">SAME SIZE</span>
          </h2>
          <Link
            href={`/${locale}/tyres?search=${encodeURIComponent(size ?? "")}`}
            className="btn-slide-black text-xs font-black uppercase tracking-widest px-4 py-2"
          >
            <span>VIEW ALL</span>
          </Link>
        </div>

        {/* Carousel */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <TyreListingCardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="relative">
            <div className="px-6 sm:px-10">
              <Swiper
                onSwiper={(s) => { swiperRef.current = s; }}
                modules={[Autoplay]}
                slidesPerView={1}
                spaceBetween={14}
                loop={products.length >= 4}
                speed={600}
                autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                breakpoints={{
                  640: { slidesPerView: 2, spaceBetween: 16 },
                  1024: { slidesPerView: 4, spaceBetween: 20 },
                }}
              >
                {products.map(p => (
                  <SwiperSlide key={p.id} className="!h-auto">
                    <TyreListingCard product={p} locale={locale as any} enableHoverZoom />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Prev arrow */}
            <button
              type="button"
              onClick={() => swiperRef.current?.slidePrev()}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#ed1c24] hover:bg-[#c6181d] flex items-center justify-center text-white shadow-md transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Next arrow */}
            <button
              type="button"
              onClick={() => swiperRef.current?.slideNext()}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#ed1c24] hover:bg-[#c6181d] flex items-center justify-center text-white shadow-md transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ICONS
══════════════════════════════════════════════════════════════════ */
function WaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════ */
export default function ProductDetailInner({
  product,
  locale = "en",
}: {
  product: ProductDetail;
  locale?: string;
}) {
  const offerLabels = useOfferLabels();
  const offerLabel = product.offersId ? offerLabels[product.offersId] : undefined;

  const specs = parseTyreProductName(product.name);
  const [activeImg, setActiveImg] = useState(0);
  const [isPriceInfoOpen, setIsPriceInfoOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isVehicleFitmentOpen, setIsVehicleFitmentOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProductTabKey>("overview");

  const sizeMatch = specs.size?.match(/(\d{3})\/(\d{2,3})\s*R(\d{2})/i);
  const width = product.width ?? sizeMatch?.[1] ?? "";
  const height = product.height ?? sizeMatch?.[2] ?? "";
  const rim = product.rim ?? sizeMatch?.[3] ?? "";

  const gallery = product.gallery?.length
    ? product.gallery
    : [{ url: product.image, label: product.name }];

  const currentImg = gallery[activeImg]?.url ?? product.image;

  /* ── Breadcrumb categories ──────────────────────────────────── */
  const tyreCategory = product.categories?.find(c =>
    /tyre|tire|wheel/i.test(c.name) || c.urlKey?.includes("tyre") || c.urlKey?.includes("tire")
  ) ?? product.categories?.[0];

  const displayTitle = [
    specs.size,
    specs.pattern?.toUpperCase(),
    specs.oemMarking
  ].filter(Boolean).join(" ") || product.name;

  /* ── Product structured data (schema.org) ───────────────────── */
  const storeCurrency = useCurrencyCode();
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image,
    sku: product.sku,
    description:
      (product.shortDescriptionHtml ?? "").replace(/<[^>]+>/g, "").trim() || product.name,
    ...(product.brandName ? { brand: { "@type": "Brand", name: product.brandName } } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency || storeCurrency,
      price: product.price,
      availability:
        product.inStock === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
    ...(product.rating && product.reviewCount
      ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: product.rating,
          reviewCount: product.reviewCount,
        },
      }
      : {}),
  };

  return (
    <>
      <JsonLd data={productJsonLd} />

      {/* ── Top Hero Title Banner (Dark patterned tyre-tread header) ── */}
      <div className="page-title-wrapper bg-cover-image py-9 sm:py-11 text-center">
        <div className="container">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-wider text-center drop-shadow-md">
            {product.name}
          </h1>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-200/80">
        <div className="container py-3">
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
            <Link href={`/${locale}`} className="hover:text-gray-900 transition-colors">Home</Link>
            <span className="text-gray-300">›</span>
            <Link href={`/${locale}/tyres`} className="hover:text-gray-900 transition-colors">Tyres</Link>
            {specs.size && (
              <>
                <span className="text-gray-300">›</span>
                <span className="text-gray-600">{specs.size}</span>
              </>
            )}
            <span className="text-gray-300">›</span>
            <span className="text-gray-900 font-medium line-clamp-1 max-w-[260px] lg:max-w-none">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* ── Main product section ────────────────────────────────────── */}
      <div className="bg-white py-6 lg:py-8">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr_300px] gap-6 lg:gap-8 items-start">

            {/* ── LEFT: Image Card ─────────────────────────────────── */}
            <div className="w-full">
              <div className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-shadow">
                {/* Top Red Offer Banner */}
                <div className="bg-[#ed1c24] py-3 px-4 text-center">
                  <p className="text-white font-black text-sm sm:text-base uppercase tracking-wider">
                    {offerLabel || "FREE Wheel Alignment"}
                  </p>
                </div>

                <div className="flex items-center justify-center p-6 bg-white overflow-hidden" style={{ minHeight: 340 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentImg}
                    alt={product.name}
                    className="max-h-[340px] w-full object-contain group-hover:scale-105 transition-transform duration-300 ease-out"
                  />
                </div>

                {gallery.length > 1 && (
                  <div className="flex gap-2 p-4 border-t border-gray-100 overflow-x-auto justify-center bg-gray-50">
                    {gallery.map((g, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`w-12 h-12 border rounded-md flex-shrink-0 flex items-center justify-center p-1 transition-all ${i === activeImg ? "border-[#ed1c24] ring-1 ring-[#ed1c24] bg-white" : "border-gray-200 hover:border-gray-400 bg-white"
                          }`}
                        aria-label={`Image ${i + 1}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={g.url} alt={g.label} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── MIDDLE: Info & Specs ────────────────────────────── */}
            <div className="w-full">
              {/* Brand logo */}
              <BrandLogoDisplay brandId={product.brand} brandName={product.brandName} />

              {/* Title */}
              {displayTitle && (
                <h2 className="text-2xl lg:text-3xl font-black text-gray-950 mt-2 mb-4 uppercase tracking-tight font-sans">
                  {displayTitle}
                </h2>
              )}

              {/* Full specification table — matching screenshot */}
              <div>
                <SpecsTable
                  specs={specs}
                  product={product}
                  onCheckFitment={() => setIsVehicleFitmentOpen(true)}
                />
              </div>
            </div>

            {/* ── RIGHT: Pricing Card ────────────────────────────── */}
            <div className="w-full">
              <PricingCard
                product={product}
                onPriceInfoClick={() => setIsPriceInfoOpen(true)}
                onShareClick={() => setIsShareOpen(true)}
              />
            </div>

          </div>

          {/* ── Overview / Specifications / Reviews tabs ────────── */}
          <ProductInfoTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            product={product}
          />
        </div>
      </div>

      {/* ── Inclusions Popup Modal ─────────────────────────────────── */}
      {isPriceInfoOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsPriceInfoOpen(false)}
            aria-hidden="true"
          />

          {/* Modal card — same shape as VehicleFitmentModal */}
          <div className="relative w-full max-w-[480px] max-h-[90vh] bg-white rounded-[22px] shadow-2xl overflow-hidden flex flex-col border border-gray-100 z-10">

            {/* ── RED HEADER ── */}
            <div
              className="text-white p-[20px_20px_14px] relative rounded-t-[22px] flex-shrink-0"
              style={{ background: "linear-gradient(#D52D27 0%, #D52D27 100%)" }}
            >
              {/* Close X */}
              <button
                type="button"
                className="absolute top-4 right-5 text-white/90 hover:text-white hover:scale-110 transition-transform p-1 cursor-pointer z-10"
                onClick={() => setIsPriceInfoOpen(false)}
                aria-label="Close"
              >
                <X size={20} strokeWidth={2.5} />
              </button>

              {/* Title row + badge */}
              <div className="flex items-start justify-between gap-2 mb-3.5 pr-8">
                <div className="min-w-0 flex-1">
                  <h4 className="text-xl sm:text-2xl font-bold text-white leading-tight m-0 tracking-tight">
                    Fully Fitted Price
                  </h4>
                  <p className="text-white/85 text-xs sm:text-[13px] font-normal mt-1 mb-0 leading-relaxed">
                    Per tyre — everything included, no hidden fees.
                  </p>
                </div>
                {/* Badge chip — same as TYRE SIZE box */}
                <div className="bg-[#851214] rounded-xl px-4 py-2 text-center min-w-[90px] border border-white/10 shrink-0">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-white/70 block leading-tight">Price</span>
                  <span className="text-sm font-bold text-white tracking-widest block mt-0.5 leading-tight">FITTED</span>
                </div>
              </div>

              {/* Amber chips — WIDTH / HEIGHT / RIM style */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <CheckCircle size={18} strokeWidth={2.5} />, label: "VAT",       val: "Included" },
                  { icon: <Gauge       size={18} strokeWidth={2.5} />, label: "Balancing", val: "Free" },
                  { icon: <Leaf        size={18} strokeWidth={2.5} />, label: "Disposal",  val: "Eco-free" },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="relative rounded-xl p-3 flex items-center gap-3 text-left bg-white/10 border border-white/20 select-none"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#f4a923] text-white">
                      {c.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider block leading-tight text-white">
                        {c.label}
                      </span>
                      <span className="text-xs sm:text-[13px] font-bold block leading-tight mt-0.5 truncate text-[#f4a923]">
                        {c.val}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── WHITE BODY ── */}
            <div className="px-5 py-4 flex-1 overflow-y-auto finder-modal-scroll bg-white">
              <ul className="space-y-3">
                {[
                  "VAT",
                  "Professional tyre fitting (Beadlock wheels excluded)",
                  "Wheel balancing",
                  "New standard rubber valve",
                  "Delivery to the installer",
                  "Eco-friendly disposal of old tyres",
                  "Bonus: When you buy 4 tyres, enjoy 1 FREE tyre rotation every 20,000 km (up to once per year)",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full border-2 border-[#ed1c24] flex items-center justify-center shrink-0 mt-0.5 text-[#ed1c24]">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#ed1c24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <span className={idx === 6 ? "text-gray-500 text-xs leading-relaxed" : ""}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── FOOTER — same as VehicleFitmentModal ── */}
            <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between bg-white shrink-0 rounded-b-[22px]">
              <button
                type="button"
                className="text-sm font-bold text-gray-900 hover:text-black flex items-center gap-1.5 transition-colors cursor-pointer"
                onClick={() => setIsPriceInfoOpen(false)}
              >
                <ArrowLeft size={16} strokeWidth={2.5} />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPriceInfoOpen(false)}
                className="bg-black hover:bg-gray-900 text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-lg px-8 py-2.5 sm:py-3 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
              >
                <span>Done</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Related products ───────────────────────────────────────── */}
      <RelatedProductsSection size={specs.size} currentSku={product.sku} locale={locale} />

      {/* ── Share Modal ────────────────────────────────────────────── */}
      <ShareModal
        product={product}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      {/* ── Vehicle Fitment Modal ─────────────────────────────────── */}
      {width && height && rim && (
        <VehicleFitmentModal
          open={isVehicleFitmentOpen}
          onClose={() => setIsVehicleFitmentOpen(false)}
          productName={product.name}
          width={width}
          height={height}
          rim={rim}
          locale={locale as any}
        />
      )}

      {/* ── Sticky Bottom Floating Search (Appears on scroll) ─────── */}
      <StickyBottomFinder locale={locale} categoryUid={APP_CONFIG.magento.tyresCategoryUid} />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SHARE MODAL COMPONENT (sendEmailToFriend)
   Uses the /api/share endpoint to dispatch a Magento request.
══════════════════════════════════════════════════════════════════ */
function ShareModal({
  product,
  isOpen,
  onClose,
}: {
  product: ProductDetail;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [recipName, setRecipName] = useState("");
  const [recipEmail, setRecipEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Prefill sender if customer info exists
  useEffect(() => {
    if (isOpen) {
      setStatusMsg(null);
      try {
        const stored = localStorage.getItem("customer_info");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.firstname) {
            setSenderName(`${parsed.firstname} ${parsed.lastname || ""}`.trim());
          }
          if (parsed.email) {
            setSenderEmail(parsed.email);
          }
        }
      } catch { }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleShare(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatusMsg(null);

    try {
      const token = localStorage.getItem("customer_token") || undefined;
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.sku,
          senderName,
          senderEmail,
          senderMessage: message,
          recipients: [{ name: recipName, email: recipEmail }],
          token,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setStatusMsg({ ok: true, text: "Product shared successfully!" });
        setRecipName("");
        setRecipEmail("");
        setMessage("");
        setTimeout(onClose, 2000);
      } else {
        setStatusMsg({ ok: false, text: data.error || "Failed to share product. Please check fields." });
      }
    } catch {
      setStatusMsg({ ok: false, text: "A network error occurred. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl border border-gray-150 max-w-lg w-full p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-black uppercase tracking-wider text-gray-900 mb-2">
          Share Tyre with a Friend
        </h3>
        <p className="text-xs text-gray-500 mb-6 uppercase tracking-wider font-bold">
          {product.name}
        </p>

        <form onSubmit={handleShare} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                Your Name *
              </label>
              <input
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                Your Email *
              </label>
              <input
                type="email"
                required
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                Friend's Name *
              </label>
              <input
                type="text"
                required
                value={recipName}
                onChange={(e) => setRecipName(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                Friend's Email *
              </label>
              <input
                type="email"
                required
                value={recipEmail}
                onChange={(e) => setRecipEmail(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
              Message (Optional)
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black font-medium resize-none"
            />
          </div>

          {statusMsg && (
            <p className={`text-xs font-semibold ${statusMsg.ok ? "text-emerald-600" : "text-red-500"}`}>
              {statusMsg.text}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded border border-gray-300 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded bg-black hover:bg-[#ed1c24] text-white text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-60 flex items-center gap-1.5"
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              {submitting ? "Sending..." : "Send Email"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   WRITE A REVIEW MODAL COMPONENT (createProductReview)
   Queries ratings metadata scales and submits user feedback.
══════════════════════════════════════════════════════════════════ */
interface RatingScale {
  id: string;
  name: string;
  values: { value_id: string; value: string }[];
}

/* ══════════════════════════════════════════════════════════════════
   WRITE YOUR OWN REVIEW — inline card, embedded directly in the
   Reviews tab (matches the storefront's "Write Your Own Review"
   block: rate-per-aspect stars, nickname, summary, detailed text).
══════════════════════════════════════════════════════════════════ */
function WriteReviewCard({ product }: { product: ProductDetail }) {
  const [nickname, setNickname] = useState("");
  const [summary, setSummary] = useState("");
  const [text, setText] = useState("");
  const [scales, setScales] = useState<RatingScale[]>([]);
  const [ratings, setRatings] = useState<Record<string, string>>({}); // { scaleId: valueId }
  const [hoveredStars, setHoveredStars] = useState<Record<string, number>>({});
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Default Quality / Value / Price scales matching Magento review form
  const defaultScales: RatingScale[] = [
    {
      id: "Quality",
      name: "Quality",
      values: [
        { value_id: "1", value: "1" },
        { value_id: "2", value: "2" },
        { value_id: "3", value: "3" },
        { value_id: "4", value: "4" },
        { value_id: "5", value: "5" },
      ],
    },
    {
      id: "Value",
      name: "Value",
      values: [
        { value_id: "1", value: "1" },
        { value_id: "2", value: "2" },
        { value_id: "3", value: "3" },
        { value_id: "4", value: "4" },
        { value_id: "5", value: "5" },
      ],
    },
    {
      id: "Price",
      name: "Price",
      values: [
        { value_id: "1", value: "1" },
        { value_id: "2", value: "2" },
        { value_id: "3", value: "3" },
        { value_id: "4", value: "4" },
        { value_id: "5", value: "5" },
      ],
    },
  ];

  useEffect(() => {
    setLoadingMetadata(true);
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => {
        const activeScales = data.ratings?.length ? data.ratings : defaultScales;
        setScales(activeScales);
      })
      .catch(() => {
        setScales(defaultScales);
      })
      .finally(() => setLoadingMetadata(false));

    try {
      const stored = localStorage.getItem("customer_info");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.firstname) setNickname(parsed.firstname);
      }
    } catch { }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatusMsg(null);

    const formattedRatings = Object.entries(ratings).map(([scaleId, valId]) => ({
      id: scaleId,
      value_id: valId,
    }));

    try {
      const token = localStorage.getItem("customer_token") || undefined;
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "create",
          token,
          input: {
            sku: product.sku,
            nickname,
            summary,
            text,
            ratings: formattedRatings,
          },
        }),
      });

      const data = await res.json();
      if (data.review || !data.error) {
        setStatusMsg({ ok: true, text: "Review submitted successfully! It will appear once approved." });
        setSummary("");
        setText("");
        setRatings({});
      } else {
        setStatusMsg({ ok: false, text: data.error || "Failed to submit review." });
      }
    } catch {
      setStatusMsg({ ok: false, text: "A network error occurred. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const activeScales = scales.length > 0 ? scales : defaultScales;

  return (
    <div id="write-review" className="bg-white border border-gray-200/80 rounded-sm p-6 sm:p-8 scroll-mt-24">
      {/* ── Title & Subtitle ── */}
      <h3 className="text-[15px] font-bold text-gray-900 mb-1">
        Write Your Own Review
      </h3>
      <p className="text-[13px] text-gray-700 mb-5">
        You&apos;re reviewing: <strong className="font-bold text-gray-900">{product.name}</strong>
      </p>

      {loadingMetadata ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <Loader2 className="animate-spin text-gray-400" size={24} />
          <p className="text-xs text-gray-400 font-medium">Loading form...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── 3-Column Rating Box (Quality | Value | Price) ── */}
          <div className="border border-gray-200/80 bg-[#fbfbfb] rounded-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200/90">
              {activeScales.map((s, idx) => {
                const currentValId = ratings[s.id];
                const activeValueNum = currentValId
                  ? s.values.find((v) => v.value_id === currentValId)?.value
                  : undefined;
                const currentRatingNum = activeValueNum ? parseInt(activeValueNum, 10) || 0 : 0;
                const hovered = hoveredStars[s.id] ?? 0;
                const displayScore = hovered > 0 ? hovered : currentRatingNum;

                return (
                  <div
                    key={s.id}
                    className={`flex flex-col items-center justify-center text-center ${
                      idx > 0 ? "md:pl-4 pt-3 md:pt-0" : ""
                    }`}
                  >
                    <span className="text-[13px] font-bold text-gray-900 mb-1.5">
                      {s.name}
                    </span>

                    {/* 5 Stars */}
                    <div className="flex items-center gap-1">
                      {s.values.map((v, starIdx) => {
                        const starNum = starIdx + 1;
                        const isFilled = starNum <= displayScore;

                        return (
                          <button
                            key={v.value_id}
                            type="button"
                            onClick={() => setRatings((prev) => ({ ...prev, [s.id]: v.value_id }))}
                            onMouseEnter={() => setHoveredStars((prev) => ({ ...prev, [s.id]: starNum }))}
                            onMouseLeave={() => setHoveredStars((prev) => ({ ...prev, [s.id]: 0 }))}
                            title={`${v.value} Star${v.value === "1" ? "" : "s"}`}
                            className="p-1 cursor-pointer transition-transform hover:scale-120 active:scale-95"
                          >
                            <Star
                              size={21}
                              strokeWidth={1.3}
                              className={`transition-colors duration-150 ${
                                isFilled
                                  ? "text-amber-400 fill-amber-400 drop-shadow-xs"
                                  : "text-gray-300 fill-none hover:text-amber-400"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Nickname ── */}
          <div>
            <label className="block text-[13px] font-bold text-gray-900 mb-1.5">
              Nickname <span className="text-[#ed1c24]">*</span>
            </label>
            <input
              type="text"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full border border-gray-200/90 rounded-sm px-3.5 py-2.5 text-[13px] text-gray-900 bg-white hover:border-gray-400 focus:outline-none focus:border-[#ed1c24] focus:ring-1 focus:ring-[#ed1c24] transition-all"
            />
          </div>

          {/* ── Summary ── */}
          <div>
            <label className="block text-[13px] font-bold text-gray-900 mb-1.5">
              Summary <span className="text-[#ed1c24]">*</span>
            </label>
            <input
              type="text"
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full border border-gray-200/90 rounded-sm px-3.5 py-2.5 text-[13px] text-gray-900 bg-white hover:border-gray-400 focus:outline-none focus:border-[#ed1c24] focus:ring-1 focus:ring-[#ed1c24] transition-all"
            />
          </div>

          {/* ── Review ── */}
          <div>
            <label className="block text-[13px] font-bold text-gray-900 mb-1.5">
              Review <span className="text-[#ed1c24]">*</span>
            </label>
            <textarea
              rows={6}
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full border border-gray-200/90 rounded-sm p-3.5 text-[13px] text-gray-900 bg-white hover:border-gray-400 focus:outline-none focus:border-[#ed1c24] focus:ring-1 focus:ring-[#ed1c24] transition-all resize-y"
            />
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded text-[13px] font-medium ${
                statusMsg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          {/* ── Submit Review Button on Left with PLP Hover ── */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="btn-slide-black text-[13px] font-bold py-2.5 px-6 rounded-md disabled:opacity-60 shadow-2xs"
            >
              <span>{submitting ? "Submitting..." : "Submit Review"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
