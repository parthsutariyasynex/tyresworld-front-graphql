"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Info, X, Loader2, Check, ShoppingBag, Star } from "lucide-react";
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
import { APP_CONFIG } from "@/src/config/app-config";
import JsonLd from "@/components/JsonLd";
import { useCurrencyCode } from "@/lib/store-config-context";
import { Money } from "@/components/Price";

import "swiper/css";

/* ══════════════════════════════════════════════════════════════════
   TYRE NAME PARSER
   Parses "Continental 275/40 R22 107Y Runflat ContiPremiumContact 6 SSR * 2025"
   into structured spec fields.
══════════════════════════════════════════════════════════════════ */
interface TyreSpecs {
  size:       string | null;   // "275/40 R22"
  loadIndex:  string | null;   // "107Y"
  pattern:    string | null;   // "ContiPremiumContact 6"
  oemMarking: string | null;   // "SSR *"
  year:       string | null;   // "2025"
  isRunFlat:  boolean;
  hasXL:      boolean;
}

const OEM_TOKENS = [
  "SSR *", "SSR*", "SSR", "MOE", "MO1", "MO", "AO",
  "N0", "N1", "N2", "N3", "N4", "VOL", "RSC", "RFT",
  "ZP", "AR", "LS", "J", "HN", "GD",
];

function parseTyreProductName(name: string): TyreSpecs {
  const yearMatch = name.match(/\b(20\d{2})\b/);
  const year      = yearMatch?.[1] ?? null;

  const sizeMatch = name.match(/(\d{3}\/\d{2,3}\s*[Rr]\d{2})/);
  if (!sizeMatch || sizeMatch.index === undefined) {
    return { size: null, loadIndex: null, pattern: null, oemMarking: null, year, isRunFlat: false, hasXL: false };
  }

  const size      = sizeMatch[1].trim();
  const brand     = name.slice(0, sizeMatch.index).trim();      // unused but kept for clarity
  void brand;
  const afterSize = name.slice(sizeMatch.index + size.length).trim();

  // Load index: first token like 107Y, 101V, 91W
  const loadMatch = afterSize.match(/^(\d{2,3}[A-Za-z]{1,2}(?:\/\d{2,3}[A-Za-z]{1,2})?)\b/);
  const loadIndex = loadMatch?.[1]?.toUpperCase() ?? null;
  const rest      = (loadMatch ? afterSize.slice(loadMatch[0].length) : afterSize).trim();

  const isRunFlat = /\b(run.?flat|runflat|rft|rsc|zp)\b/i.test(name);
  const hasXL     = /\bXL\b/.test(rest);

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
  const logo = getBrandLogo(brandId);
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
}: {
  specs: TyreSpecs;
  product: ProductDetail;
}) {
  const brandName = product.brandName ?? product.brand ?? null;
  const origin    = product.country ?? product.origin ?? null;
  const warranty  = product.warrantyPeriod ?? "5 Years Warranty";

  const rows = [
    {
      left: { label: "Brand", value: brandName },
      right: { label: "Pattern", value: specs.pattern }
    },
    {
      left: { label: "OEM Marking", value: specs.oemMarking },
      right: { label: "Size", value: specs.size }
    },
    {
      left: { label: "Load Index", value: specs.loadIndex },
      right: {
        label: "Run Flat",
        value: specs.isRunFlat ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-[3px] border-black bg-white">
              <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
            </span>
            <span className="font-bold text-gray-900">Run Flat</span>
          </span>
        ) : "No"
      }
    },
    {
      left: { label: "Origin", value: origin },
      right: { label: "Year", value: specs.year }
    },
    {
      left: { label: "Warranty Period", value: warranty },
      right: { label: "", value: "" }
    }
  ];

  return (
    <div className="border border-gray-200 rounded-[14px] overflow-hidden bg-white shadow-sm flex flex-col justify-between h-full">
      <div className="divide-y divide-gray-100">
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-2 divide-x divide-gray-100 text-[13px] items-center">
            {/* Left Column */}
            <div className="grid grid-cols-[115px_1fr] px-4 py-3 items-center">
              <span className="text-gray-500 font-medium">{row.left.label}</span>
              <span className="text-gray-900 font-bold truncate">
                {row.left.value ?? "—"}
              </span>
            </div>
            {/* Right Column */}
            <div className="grid grid-cols-[105px_1fr] px-4 py-3 items-center min-h-[45px]">
              {row.right.label ? (
                <>
                  <span className="text-gray-500 font-medium">{row.right.label}</span>
                  <span className="text-gray-900 font-bold truncate">
                    {row.right.value ?? "—"}
                  </span>
                </>
              ) : (
                <div className="col-span-full h-full" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Check Vehicle Section */}
      <div className="p-4 flex items-center gap-3 bg-[#f8f9fa] border-t border-gray-100 mt-auto">
        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[#e0f7f6] shadow-sm">
          <svg className="w-6 h-6 text-[#ed1c24]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.5 11.5L20 8.5C19.5 8 18.5 7.5 17.5 7.5H6.5C5.5 7.5 4.5 8 4 8.5L0.5 11.5C0.2 11.8 0 12.1 0 12.5V17C0 17.6 0.4 18 1 18H3C3 19.7 4.3 21 6 21C7.7 21 9 19.7 9 18H15C15 19.7 16.3 21 18 21C19.7 21 21 19.7 21 18H23C23.6 18 24 17.6 24 17V12.5C24 12.1 23.8 11.8 23.5 11.5ZM6 19.5C5.2 19.5 4.5 18.8 4.5 18C4.5 17.2 5.2 16.5 6 16.5C6.8 16.5 7.5 17.2 7.5 18C7.5 18.8 6.8 19.5 6 19.5ZM18 19.5C17.2 19.5 16.5 18.8 16.5 18C16.5 17.2 17.2 16.5 18 16.5C18.8 16.5 19.5 17.2 19.5 18C19.5 18.8 18.8 19.5 18 19.5ZM21.5 13.5H2.5V12.5L5.5 9.8C5.8 9.5 6.2 9.4 6.6 9.4H17.4C17.8 9.4 18.2 9.5 18.5 9.8L21.5 12.5V13.5Z" />
          </svg>
        </div>
        <button className="flex-1 bg-black hover:bg-[#ed1c24] text-white text-[11px] font-black uppercase tracking-wider py-3.5 px-4 rounded-md transition-colors text-center">
          CHECK IF THIS TYRE FITS IN YOUR VEHICLE
        </button>
      </div>
    </div>
  );
}

function PricingCard({
  product,
  onPriceInfoClick,
  onAddToCartSuccess,
  onShareClick,
}: {
  product: ProductDetail;
  onPriceInfoClick: () => void;
  onAddToCartSuccess: () => void;
  onShareClick: () => void;
}) {
  const currency = product.currency || undefined;
  const hasPrice = product.price > 0;
  const fmt = (v: number) => <Money value={v} currency={currency} />;

  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const isOutOfStock = product.inStock === false;

  async function handleAddToCart() {
    if (adding) return;
    setAdding(true);
    setAddError(null);
    try {
      const result = await addItem(product, qty);
      if (result.error) {
        setAddError(result.error);
        setTimeout(() => setAddError(null), 4000);
      } else {
        onAddToCartSuccess();
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="bg-[#f8f9fa] border border-gray-100 rounded-xl p-5 flex flex-col gap-4 h-fit sticky top-24 shadow-sm">
      {/* Price label */}
      <div>
        <div className="flex items-center gap-1.5 text-[13px] text-gray-800 font-medium">
          Fully Fitted Price per Item
          <button
            type="button"
            onClick={onPriceInfoClick}
            className="cursor-pointer text-gray-500 text-xs hover:text-gray-700 focus:outline-none"
            aria-label="Price inclusions info"
          >
            ⓘ
          </button>
        </div>
        {hasPrice ? (
          <div className="mt-1">
            <p className="text-2xl font-black text-gray-900">{fmt(product.price)}</p>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-sm text-gray-400 line-through">{fmt(product.originalPrice)}</p>
            )}
          </div>
        ) : (
          <p className="text-xl font-bold text-gray-950 mt-1">Price on Contact</p>
        )}
      </div>

      {/* CTA — Contact Us for OUT_OF_STOCK / Price on Contact, qty + ADD TO CART for IN_STOCK */}
      {isOutOfStock || !hasPrice ? (
        <a
          href={`https://wa.me/966500000000?text=${encodeURIComponent(`Hi, I'm interested in: ${product.name}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-[#049b43] hover:bg-[#038237] text-white font-bold text-sm py-3 rounded-full transition-colors w-full"
        >
          <WaIcon />
          Contact Us
        </a>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {/* Quantity input - simple gray box */}
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-10 h-10 bg-[#f0f0f0] text-gray-900 border-none text-center font-bold rounded-md text-[14px] focus:outline-none focus:ring-0 shrink-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {/* Add to cart button next to it */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding}
              className="flex-1 h-10 bg-black hover:bg-[#ed1c24] text-white font-extrabold text-[12px] uppercase tracking-wider rounded-md transition-colors disabled:opacity-60"
            >
              {adding ? "Adding..." : "ADD TO CART"}
            </button>
          </div>

          {addError && (
            <p className="text-[11px] text-red-500 text-center leading-tight">{addError}</p>
          )}
        </div>
      )}

      <hr className="border-gray-100 my-1" />

      {/* Installments Card Wrapper */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col gap-2 mt-1">
        <p className="text-[11px] text-gray-500 font-medium">Split in 4 Payment with</p>
        <div className="flex items-center gap-2.5">
          {/* Tabby */}
          <div className="inline-flex items-center justify-center bg-[#05FFD2] text-black px-3.5 py-1.5 rounded-lg font-black text-[11px] tracking-wide select-none">
            tabby
          </div>
          {/* Tamara */}
          <div className="inline-flex items-center justify-center bg-gradient-to-r from-[#FFB399] via-[#FF7D82] to-[#C095FF] text-black px-3.5 py-1.5 rounded-lg font-black text-[11px] tracking-wide select-none">
            tamara
          </div>
          {/* EMKAN */}
          <div className="text-[#2e3162] font-black text-[14px] tracking-widest uppercase select-none font-sans">
            EMKΛN
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
  const count  = product.reviewCount ?? 0;
  const rating = product.rating ?? 0;

  // Build heading title: "BRAND PATTERN" e.g. "PIRELLI P ZERO PZ4"
  const specs       = parseTyreProductName(product.name);
  const brandName   = String(product.brandName ?? product.brand ?? "").toUpperCase();
  const patternName = (specs.pattern ?? "").toUpperCase();
  const displayTitle = [brandName, patternName].filter(Boolean).join(" ") || product.name.toUpperCase();

  return (
    <section className="border-t border-gray-100 bg-white py-10">
      <div className="container">

        {/* ── Header ──────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between pb-4 mb-5"
          style={{ borderBottom: `2px solid ${DR_MAGENTA}` }}
        >
          <h2 className="text-2xl font-black uppercase tracking-wider text-gray-900">
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
          <div className="border border-gray-200 rounded-sm px-4 py-3 flex items-center gap-2 mb-5">
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

          {/* ── Two-column panel ─────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

            {/* Star breakdown bars */}
            <div className="border border-gray-200 rounded-sm p-4 space-y-3">
              {[5, 4, 3, 2, 1].map(star => (
                <div key={star} className="flex items-center gap-3">
                  <button
                    type="button"
                    className="text-[13px] flex-shrink-0 w-10 text-left hover:underline"
                    style={{ color: DR_MAGENTA }}
                  >
                    {star} star
                  </button>
                  <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: "0%", background: DR_MAGENTA }}
                    />
                  </div>
                  <span className="text-[13px] text-gray-600 w-8 text-right">0%</span>
                </div>
              ))}
            </div>

            {/* Right panel — placeholder for review comments */}
            <div className="border border-gray-200 rounded-sm bg-gray-50" style={{ minHeight: 180 }} />
          </div>

          {/* ── Show All Reviews / Write Review buttons ──────────────────────── */}
          <div className="flex justify-center mb-5 gap-4 flex-wrap">
            <button
              type="button"
              className="bg-gray-900 hover:bg-[#ed1c24] text-white font-bold text-[14px] px-14 py-3 transition-colors"
            >
              Show All Reviews
            </button>
            <button
              type="button"
              onClick={onWriteReviewClick}
              className="border border-gray-900 text-gray-900 hover:bg-black hover:text-white font-bold text-[14px] px-14 py-3 transition-colors"
            >
              Write a Review
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
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RELATED PRODUCTS — same tyre size
══════════════════════════════════════════════════════════════════ */
function RelatedProductsSection({
  size,
  currentSku,
}: {
  size: string | null;
  currentSku?: string;
}) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(false);

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
      .catch(() => {})
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
            href={`/en/run-flat-tires?search=${encodeURIComponent(size ?? "")}`}
            className="border border-gray-900 text-xs font-black uppercase tracking-widest px-4 py-2 hover:bg-gray-900 hover:text-white transition-colors"
          >
            VIEW ALL
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
                  640:  { slidesPerView: 2, spaceBetween: 16 },
                  1024: { slidesPerView: 4, spaceBetween: 20 },
                }}
              >
                {products.map(p => (
                  <SwiperSlide key={p.id} className="!h-auto">
                    <TyreListingCard product={p} />
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
  const offerLabel  = product.offersId ? offerLabels[product.offersId] : undefined;

  const specs       = parseTyreProductName(product.name);
  const [activeImg, setActiveImg] = useState(0);
  const [isPriceInfoOpen, setIsPriceInfoOpen] = useState(false);
  const [isAddedToCartOpen, setIsAddedToCartOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);

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

      {/* ── Tyre Search ───────────────────────────────────────── */}
      <TyreFinder categoryUid={APP_CONFIG.magento.tyresCategoryUid} />

      {/* ── Breadcrumb ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="container py-3">
          <nav className="flex items-center gap-1 text-[12px] text-gray-500 flex-wrap">
            <Link href={`/${locale}`} className="hover:text-gray-900 transition-colors">Home</Link>
            <span className="text-gray-300 mx-1.5">/</span>
            <Link href={`/${locale}/run-flat-tires`} className="hover:text-gray-900 transition-colors">Tyres</Link>
            {specs.size && (
              <>
                <span className="text-gray-300 mx-1.5">/</span>
                <span className="text-gray-600">{specs.size}</span>
              </>
            )}
            <span className="text-gray-300 mx-1.5">/</span>
            <span className="text-gray-800 font-medium line-clamp-1 max-w-[260px] lg:max-w-none">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* ── Main product section ────────────────────────────────────── */}
      <div className="bg-white py-6 lg:py-8">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr_280px] gap-6 lg:gap-8 items-start">

            {/* ── LEFT: Image Card ─────────────────────────────────── */}
            <div className="w-full">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {offerLabel && (
                  <div className="bg-[#ed1c24] py-3 px-4 text-center">
                    <p className="text-white font-black text-sm lg:text-base uppercase tracking-wide">
                      {offerLabel}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-center p-6 bg-white" style={{ minHeight: 340 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                     src={currentImg}
                     alt={product.name}
                     className="max-h-[340px] w-full object-contain"
                  />
                </div>

                {gallery.length > 1 && (
                  <div className="flex gap-2 p-4 border-t border-gray-100 overflow-x-auto justify-center bg-gray-50">
                    {gallery.map((g, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`w-12 h-12 border rounded-md flex-shrink-0 flex items-center justify-center p-1 transition-all ${
                          i === activeImg ? "border-[#ed1c24] ring-1 ring-[#ed1c24] bg-white" : "border-gray-200 hover:border-gray-400 bg-white"
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

              {/* Combined Title */}
              {displayTitle && (
                <h1 className="text-2xl lg:text-3xl font-black text-gray-900 mt-2 uppercase tracking-tight">
                  {displayTitle}
                </h1>
              )}

              {/* Specs label + rating */}
              <div className="flex flex-wrap items-center gap-3 mt-3 mb-4">
                <p className="text-xs font-black uppercase tracking-widest text-gray-700">
                  PRODUCT SPECIFICATIONS
                </p>
                <SpecsRating rating={product.rating} reviewCount={product.reviewCount} />
              </div>

              {/* Specs Table */}
              <SpecsTable specs={specs} product={product} />
            </div>

            {/* ── RIGHT: Pricing Card ────────────────────────────── */}
            <div className="w-full">
              <PricingCard
                product={product}
                onPriceInfoClick={() => setIsPriceInfoOpen(true)}
                onAddToCartSuccess={() => setIsAddedToCartOpen(true)}
                onShareClick={() => setIsShareOpen(true)}
              />
            </div>

          </div>
        </div>
      </div>

      {/* ── Added to Cart Popup Modal ──────────────────────────────── */}
      {isAddedToCartOpen && (
        <div className="popup-overlay product-single-modal">
          <div className="absolute inset-0" onClick={() => setIsAddedToCartOpen(false)} />
          <div className="popup-content text-center max-w-[520px]">
            <span className="popup-close" onClick={() => setIsAddedToCartOpen(false)} />
            <h3 className="text-xl font-extrabold uppercase tracking-tight text-gray-900 mb-3 mt-4">
              ADDED TO CART
            </h3>
            <p className="text-[14px] font-black text-gray-900 uppercase tracking-tight max-w-[420px] mx-auto mb-6">
              {product.name}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/${locale}/cart`}
                className="w-full sm:w-auto bg-[#ed1c24] hover:bg-[#c6181d] text-white text-[13px] font-black uppercase tracking-wider py-3.5 px-8 rounded-lg transition-colors text-center"
              >
                PROCEED TO CART
              </Link>
              <button
                type="button"
                onClick={() => setIsAddedToCartOpen(false)}
                className="w-full sm:w-auto bg-black hover:bg-gray-900 text-white text-[13px] font-black uppercase tracking-wider py-3.5 px-8 rounded-lg transition-colors text-center"
              >
                CONTINUE SHOPPING
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Inclusions Popup Modal ─────────────────────────────────── */}
      {isPriceInfoOpen && (
        <div className="popup-overlay product-single-modal">
          <div className="absolute inset-0" onClick={() => setIsPriceInfoOpen(false)} />
          <div className="popup-content">
            <span className="popup-close" onClick={() => setIsPriceInfoOpen(false)} />
            <h4>Fully fitted price per tire includes:</h4>
            <ul className="list-none">
              {[
                "VAT",
                "Professional tyre fitting (Beadlock wheels excluded)",
                "Wheel balancing",
                "New standard rubber valve",
                "Delivery to the installer",
                "Eco-friendly disposal of old tyres",
                "Bonus: When you buy 4 tyres, enjoy 1 FREE tyre rotation every 20,000 km (up to once per year)"
              ].map((item, idx) => (
                <li key={idx}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Ratings & Reviews ──────────────────────────────────────── */}
      <RatingsSection product={product} onWriteReviewClick={() => setIsWriteReviewOpen(true)} />

      {/* ── Related products ───────────────────────────────────────── */}
      <RelatedProductsSection size={specs.size} currentSku={product.sku} />

      {/* ── Share Modal ────────────────────────────────────────────── */}
      <ShareModal
        product={product}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      {/* ── Write Review Modal ──────────────────────────────────────── */}
      <ReviewModal
        product={product}
        isOpen={isWriteReviewOpen}
        onClose={() => setIsWriteReviewOpen(false)}
      />
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
      } catch {}
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

function ReviewModal({
  product,
  isOpen,
  onClose,
}: {
  product: ProductDetail;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [nickname, setNickname] = useState("");
  const [summary, setSummary] = useState("");
  const [text, setText] = useState("");
  const [scales, setScales] = useState<RatingScale[]>([]);
  const [ratings, setRatings] = useState<Record<string, string>>({}); // { scaleId: valueId }
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Fetch rating scale options on mount
  useEffect(() => {
    if (isOpen) {
      setStatusMsg(null);
      setLoadingMetadata(true);
      fetch("/api/reviews")
        .then((r) => r.json())
        .then((data) => {
          if (data.ratings?.length) {
            setScales(data.ratings);
            // Default first rating option for each scale
            const defaults: Record<string, string> = {};
            data.ratings.forEach((s: RatingScale) => {
              if (s.values?.length) {
                // Find index matching 5 stars or middle
                defaults[s.id] = s.values[s.values.length - 1]?.value_id;
              }
            });
            setRatings(defaults);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingMetadata(false));

      // Prefill nickname if logged in
      try {
        const stored = localStorage.getItem("customer_info");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.firstname) {
            setNickname(parsed.firstname);
          }
        }
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatusMsg(null);

    // Format selected rating options for Magento input
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
        setStatusMsg({ ok: true, text: "Review submitted successfully! It is pending approval." });
        setSummary("");
        setText("");
        setTimeout(onClose, 2500);
      } else {
        setStatusMsg({ ok: false, text: data.error || "Failed to submit review. Reviews may be disabled." });
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
      <div className="relative bg-white rounded-xl shadow-2xl border border-gray-150 max-w-lg w-full p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-black uppercase tracking-wider text-gray-900 mb-2">
          Write a Product Review
        </h3>
        <p className="text-xs text-gray-500 mb-6 uppercase tracking-wider font-bold">
          {product.name}
        </p>

        {loadingMetadata ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Loader2 className="animate-spin text-gray-400" size={24} />
            <p className="text-xs text-gray-400 uppercase tracking-widest font-black">Loading Ratings Scales...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dynamic Rating Scales from Magento */}
            {scales.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3.5 border border-gray-100">
                <p className="text-[11px] font-black uppercase tracking-wider text-gray-700 border-b border-gray-250 pb-1">
                  Rate Aspects
                </p>
                {scales.map((s) => (
                  <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[12px] font-bold text-gray-800">{s.name}</span>
                    <div className="flex items-center gap-1.5">
                      {s.values.map((v) => (
                        <button
                          key={v.value_id}
                          type="button"
                          onClick={() => setRatings((prev) => ({ ...prev, [s.id]: v.value_id }))}
                          className={`w-8 h-8 rounded-full border text-[11px] font-bold flex items-center justify-center transition-colors ${
                            ratings[s.id] === v.value_id
                              ? "border-black bg-black text-white"
                              : "border-gray-200 hover:border-gray-400 text-gray-600 bg-white"
                          }`}
                        >
                          {v.value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fallback Single Rating if no scales returned */}
            {scales.length === 0 && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex items-center justify-between">
                <span className="text-[12px] font-black uppercase tracking-wider text-gray-700">Rating</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => setRatings({ overall: String(stars) })}
                      className="text-gray-300 hover:text-amber-400 transition-colors"
                    >
                      <Star
                        size={22}
                        fill={Number(ratings.overall || "5") >= stars ? "#fbbf24" : "none"}
                        stroke={Number(ratings.overall || "5") >= stars ? "#fbbf24" : "#d1d5db"}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                Nickname *
              </label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black font-medium"
                placeholder="e.g. JohnD"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                Review Summary (Heading) *
              </label>
              <input
                type="text"
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black font-medium"
                placeholder="e.g. Outstanding grip and durability"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                Detailed Review *
              </label>
              <textarea
                rows={4}
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-black font-medium resize-none"
                placeholder="Write your comments about this tyre here..."
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
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
