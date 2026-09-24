"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Check } from "lucide-react";
import FullyFittedPriceModal from "@/components/FullyFittedPriceModal";
import ProductImage from "./ProductImage";
import VehicleFitmentModal from "@/components/VehicleFitmentModal";
import type { Product } from "@/lib/data";
import { type Locale } from "@/lib/i18n";
import { useCart } from "@/lib/cart-context";
import { useOverviewDrawer } from "@/lib/overview-drawer-context";
import { Money } from "@/components/Price";
import { APP_CONFIG } from "@/src/config/app-config";
import { buildBrandSlug } from "@/lib/filterBuilder";

/** Tyre size with speed/load index from product fields or name */
function getTyreSizeWithIndex(p: Product): string {
  if (p.tyreSize) return p.tyreSize;
  if (p.size) return p.size;
  const m = p.name.match(/\d{3}\/\d{2,3}\s*R\d{2}(\s+\d{2,3}[A-Z]{1,2})?/i);
  if (m) return m[0].trim();
  if (p.width && p.height && p.rim) return `${p.width}/${p.height} R${p.rim}`;
  return "";
}

/** Pattern / model name with brand, size and year stripped off */
function getPatternName(p: Product): string {
  if (p.pattern) return p.pattern;
  const clean = p.name
    .replace(new RegExp(p.brandName ?? String(p.brand ?? ""), "gi"), "")
    .replace(/\d{3}\/\d{2,3}\s*R\d{2}(\s+\d{2,3}[A-Z]{1,2})?/gi, "")
    .replace(/\b(202[4-9]|203[0-9])\b/g, "")
    .trim();
  return clean || p.name;
}

function formatWarrantyBadge(w?: string | null): string | null {
  if (!w || !w.trim()) return null;
  const clean = w.trim();
  const num = clean.match(/\d+/)?.[0];
  if (num) return `${num} YR WARRANTY`;
  if (clean.toLowerCase().includes("warranty")) return clean.toUpperCase();
  return `${clean.toUpperCase()} WARRANTY`;
}

/** Car icon sprite */
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

/** Single Tyre Half Column inside the Staggered Card */
function TyreHalfColumn({
  product,
  set2Price,
  locale,
  onOpenFitment,
  labelPrefix,
}: {
  product: Product;
  set2Price?: number;
  locale: Locale;
  onOpenFitment: () => void;
  labelPrefix: "FRONT" | "REAR";
}) {
  const href = product.urlKey ? `/${locale}/product/${product.urlKey}` : "#";
  const tyreSize = getTyreSizeWithIndex(product);
  const pattern = getPatternName(product);
  const year = product.year ?? product.name.match(/\b(202[4-9]|203[0-9])\b/)?.[0] ?? "";
  
  const brandLabel = product.brandName ?? String(product.brand ?? "");
  const warranty = product.warrantyPeriod ?? "";
  const origin = product.country ?? product.origin ?? "";

  const brandLogo = product.brandLogoUrl;
  const brandSlug = buildBrandSlug(product.brandName || brandLabel);
  const brandHref = brandSlug ? `/tyres/brand/${brandSlug}` : null;

  const unitPrice = product.price > 0 ? product.price : 0;
  const resolvedSet2Price = set2Price ?? (unitPrice * 2);

  const [priceInfoOpen, setPriceInfoOpen] = useState(false);

  return (
    <div className="flex flex-col flex-1 p-2.5 sm:p-3 bg-white group">
      {/* ── 0. Axle Tag (FRONT / REAR) ── */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-900 text-white leading-none">
          {labelPrefix}
        </span>
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
          (2x Tyres)
        </span>
      </div>

      {/* ── 1. Top Header: Warranty Badge (Left) & Brand Logo (Right) ──
          Same sizing as TyreListingCard.tsx (plain listing page) — kept
          identical on purpose so the badge/logo look the same across the
          plain and staggered (bundle) card types. */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full min-h-[28px] sm:min-h-[38px] mb-1.5 sm:mb-2">
        {/* Warranty Badge (Top Left - only shown when present on product) */}
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

      {/* ── 2. Tyre Image Section ── */}
      <div className="relative w-full h-[95px] sm:h-[110px] my-0.5">
        <Link href={href} className="block relative w-full h-full" aria-label={product.name}>
          <ProductImage
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-0.5 drop-shadow-xs group-hover:scale-105 transition-transform duration-300 ease-out"
            sizes="(max-width: 640px) 50vw, 260px"
          />
        </Link>
      </div>

      {/* ── 3. 2-Column Split Information Section (Matching Image 2 / TyreListingCard layout) ── */}
      <div className="grid grid-cols-2 gap-1.5 my-1 flex-1 items-end">
        {/* Left Column: Pattern Name, Year/Origin, Size Box */}
        <div className="flex flex-col justify-between min-w-0">
          <div>
            <Link href={href} className="text-[12px] sm:text-[13px] font-black text-gray-900 hover:text-[#ed1c24] transition-colors leading-tight block truncate" title={pattern}>
              {pattern}
            </Link>
            {(year || origin) && (
              <div className="text-[8.5px] sm:text-[9.5px] font-medium text-gray-500 mt-0.5 truncate">
                {[year, origin].filter(Boolean).join(" | ")}
              </div>
            )}
          </div>

          {/* Tyre Size & Compatible Vehicle Box */}
          <div className="border border-gray-200/90 rounded-md h-[26px] sm:h-[28px] px-1.5 flex items-center justify-between mt-1 bg-white shadow-2xs w-full">
            <span className="text-[9.5px] sm:text-[11px] font-extrabold text-gray-900 truncate">
              {tyreSize}
            </span>
            <button
              type="button"
              onClick={onOpenFitment}
              aria-label={`Vehicles that fit ${tyreSize}`}
              title="See which cars fit this size"
              className="inline-flex items-center text-gray-900 hover:text-[#ed1c24] transition-colors cursor-pointer shrink-0 ml-1"
            >
              <CarSprite className="w-[28px] h-[10px] [background-size:318px_auto] [background-position:-10.7px_-10.3px]" />
            </button>
          </div>
        </div>

        {/* Right Column: Price, Set of 2 Price, Fully Fitted Price */}
        <div className="flex flex-col justify-between text-right shrink-0">
          <div>
            <div className="font-black text-gray-950 text-[15px] sm:text-[17px] leading-tight">
              <Money value={unitPrice} digits={2} />
            </div>
            <div className="text-[9.5px] sm:text-[10.5px] font-bold text-gray-700 whitespace-nowrap mt-0.5">
              Set of 2: <Money value={resolvedSet2Price} digits={2} />
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPriceInfoOpen(true); }}
              className="text-[8.5px] sm:text-[9.5px] font-medium text-gray-500 hover:text-gray-800 hover:underline cursor-pointer block ml-auto mt-0.5 whitespace-nowrap"
              aria-label="What's included in the fully fitted price"
            >
              Fully Fitted Price
            </button>
          </div>
        </div>
      </div>

      <FullyFittedPriceModal isOpen={priceInfoOpen} onClose={() => setPriceInfoOpen(false)} />
    </div>
  );
}

/** 
 * Staggered / Paired Tyre Card (2-column layout matching reference screenshot)
 */
export default function StaggeredTyreCard({
  frontProduct,
  rearProduct,
  bundlePrice,
  frontSet2Price,
  rearSet2Price,
  locale = "en",
}: {
  frontProduct: Product;
  rearProduct: Product;
  bundlePrice?: number;
  frontSet2Price?: number;
  rearSet2Price?: number;
  locale?: Locale;
}) {
  const { addItem } = useCart();
  const { openDrawer } = useOverviewDrawer();
  const [adding, setAdding] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [activeFitmentProduct, setActiveFitmentProduct] = useState<Product | null>(null);

  if (!frontProduct || !rearProduct) return null;

  const frontPrice = frontProduct.price > 0 ? frontProduct.price : 0;
  const rearPrice = rearProduct.price > 0 ? rearProduct.price : 0;
  const setOf4Price = bundlePrice ?? ((frontPrice * 2) + (rearPrice * 2));

  const isOutOfStock =
    frontProduct.inStock === false ||
    rearProduct.inStock === false ||
    frontPrice <= 0 ||
    rearPrice <= 0;

  async function handleAddSetOf4() {
    if (adding || cartAdded || isOutOfStock) return;
    setAdding(true);
    setAddError(null);
    try {
      const resFront = await addItem(frontProduct, 2);
      const resRear = await addItem(rearProduct, 2);
      if (resFront?.error || resRear?.error) {
        setAddError(resFront?.error || resRear?.error || "Could not add to cart.");
        setTimeout(() => setAddError(null), 4000);
      } else {
        setCartAdded(true);
        setTimeout(() => setCartAdded(false), 2500);
        openDrawer("cart");
      }
    } finally {
      setAdding(false);
    }
  }

  const enquiryText = `Hi tyresworld.ae\n\nI would like to enquire about this Set of 4 tyres:\nFront (2x): ${frontProduct.name}\nRear (2x): ${rearProduct.name}`;

  return (
    <li className="list-none h-full col-span-1">
      <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
        
        {/* ── Dual Columns (Left: Front, Right: Rear) ─────────────── */}
        <div className="grid grid-cols-2 divide-x divide-gray-200/90 flex-1">
          <TyreHalfColumn
            product={frontProduct}
            set2Price={frontSet2Price}
            locale={locale}
            onOpenFitment={() => setActiveFitmentProduct(frontProduct)}
            labelPrefix="FRONT"
          />
          <TyreHalfColumn
            product={rearProduct}
            set2Price={rearSet2Price}
            locale={locale}
            onOpenFitment={() => setActiveFitmentProduct(rearProduct)}
            labelPrefix="REAR"
          />
        </div>

        {/* ── Bottom Combined Action Bar ──────────────────────────── */}
        <div className="grid grid-cols-2 border-t border-gray-200/90 shrink-0">
          {/* Left Button: SET OF 4 */}
          <button
            type="button"
            onClick={handleAddSetOf4}
            disabled={adding || isOutOfStock}
            className={`btn-tocart py-3 px-2 text-[11px] sm:text-[12.5px] tracking-wider flex-none w-full h-auto rounded-none ${
              cartAdded ? "is-added" : ""
            }`}
          >
            {adding ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Adding Set of 4…</span>
              </>
            ) : cartAdded ? (
              <>
                <Check size={14} />
                <span>Added Set of 4</span>
              </>
            ) : (
              <span>
                SET OF 4 <Money value={setOf4Price} digits={2} />
              </span>
            )}
          </button>

          {/* Right Button: MAKE ENQUIRY */}
          <a
            href={`https://api.whatsapp.com/send/?phone=${APP_CONFIG.contact.whatsapp}&text=${encodeURIComponent(enquiryText)}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Make Enquiry"
            className="btn-enquiry py-3 px-2 text-[11px] sm:text-[12.5px] tracking-wider h-auto rounded-none"
          >
            <span>MAKE ENQUIRY</span>
          </a>
        </div>
        {addError && (
          <p className="text-[11px] text-[#ed1c24] font-semibold py-1.5 text-center line-clamp-2 border-t border-gray-100">{addError}</p>
        )}
      </div>

      {/* Fitment modal if triggered */}
      {activeFitmentProduct && (
        <VehicleFitmentModal
          open={Boolean(activeFitmentProduct)}
          onClose={() => setActiveFitmentProduct(null)}
          productName={activeFitmentProduct.name}
          width={activeFitmentProduct.width ?? ""}
          height={activeFitmentProduct.height ?? ""}
          rim={activeFitmentProduct.rim ?? ""}
          locale={locale}
        />
      )}
    </li>
  );
}
