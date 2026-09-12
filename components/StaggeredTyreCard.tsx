"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Check } from "lucide-react";
import FullyFittedPriceModal from "@/components/FullyFittedPriceModal";
import ProductImage from "./ProductImage";
import VehicleFitmentModal from "@/components/VehicleFitmentModal";
import type { Product } from "@/lib/data";
import { type Locale } from "@/lib/i18n";
import { getBrandLogo } from "@/lib/brandLogos";
import { useCart } from "@/lib/cart-context";
import { Money } from "@/components/Price";
import { APP_CONFIG } from "@/src/config/app-config";

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

/** Car icon sprite */
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

/** Brand Logo Box */
function BrandLogoDisplay({ brandLabel, brandLogo }: { brandLabel: string; brandLogo?: string | null }) {
  if (brandLogo) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={brandLogo}
        alt={brandLabel}
        className="max-h-7 max-w-[130px] w-auto object-contain"
        loading="lazy"
      />
    );
  }

  return <span className="text-[13px] font-black uppercase tracking-wider text-gray-900">{brandLabel}</span>;
}

/** Single Tyre Half Column inside the Staggered Card */
function TyreHalfColumn({
  product,
  locale,
  onOpenFitment,
}: {
  product: Product;
  locale: Locale;
  onOpenFitment: () => void;
}) {
  const href = product.urlKey ? `/${locale}/product/${product.urlKey}` : "#";
  const tyreSize = getTyreSizeWithIndex(product);
  const pattern = getPatternName(product);
  const year = product.year ?? product.name.match(/\b(202[4-9]|203[0-9])\b/)?.[0] ?? "";
  
  const brandLabel = product.brandName ?? String(product.brand ?? "");
  const warranty = product.warrantyPeriod ?? "";
  const origin = product.country ?? product.origin ?? "";

  const brandLogo = product.brandLogoUrl ?? getBrandLogo(product.brand) ?? getBrandLogo(product.brandName);
  const brandSlug = product.brandName?.toLowerCase().replace(/[^a-z0-9]+/g, "").replace(/(^-|-$)/g, "");
  const brandHref = brandSlug ? `/${locale}/tyres/brand/${brandSlug}` : null;

  const unitPrice = product.price > 0 ? product.price : 0;
  const set2Price = unitPrice * 2;

  const [priceInfoOpen, setPriceInfoOpen] = useState(false);

  return (
    <div className="flex flex-col flex-1 p-3.5 sm:p-4 bg-white">
      {/* ── Brand Logo Box ────────────────────────────────────────── */}
      <div className="flex items-center justify-center h-9 my-1 px-2">
        {brandHref ? (
          <Link href={brandHref} aria-label={`${brandLabel} tyres`} className="inline-block">
            <BrandLogoDisplay brandLabel={brandLabel} brandLogo={brandLogo} />
          </Link>
        ) : (
          <BrandLogoDisplay brandLabel={brandLabel} brandLogo={brandLogo} />
        )}
      </div>

      {/* ── Tyre Image with Warranty & Year Overlays ──────────────── */}
      <div className="relative w-full my-2">
        <Link href={href} className="block relative w-full h-[145px] sm:h-[160px]" aria-label={product.name}>
          <ProductImage
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-1 hover:scale-105 transition-transform duration-300 ease-out"
            sizes="(max-width: 640px) 50vw, 320px"
          />
        </Link>

        {/* Bottom-left warranty */}
        {warranty && (
          <span className="absolute left-0 bottom-0 z-10 text-[10px] sm:text-[10.5px] font-black uppercase text-gray-900 leading-none bg-white/70 px-1 py-0.5 rounded-xs backdrop-blur-xs">
            {warranty}
          </span>
        )}

        {/* Bottom-right year */}
        {year && (
          <span className="absolute right-0 bottom-0 z-10 text-[11px] font-black text-gray-900 leading-none">
            {year}
          </span>
        )}
      </div>

      {/* ── Pattern & Tyre Size ───────────────────────────────────── */}
      <div className="text-center mt-2 px-1">
        <Link href={href} className="block text-[14px] sm:text-[15.5px] font-black text-gray-900 hover:text-[#ed1c24] transition-colors leading-tight line-clamp-1">
          {pattern}
        </Link>
        {tyreSize && (
          <span className="block text-[13px] sm:text-[14px] font-bold text-gray-800 mt-0.5">
            {tyreSize}
          </span>
        )}
      </div>

      {/* ── Car Icon + Country Origin ─────────────────────────────── */}
      <div className="border-t border-b border-gray-100 py-1.5 px-2 flex items-center justify-between my-2.5">
        <button
          type="button"
          onClick={onOpenFitment}
          aria-label={`Vehicles that fit ${tyreSize}`}
          title="See which cars fit this size"
          className="inline-flex items-center text-gray-900 hover:text-[#ed1c24] transition-colors cursor-pointer"
        >
          <CarSprite />
        </button>
        {origin && <span className="text-[11px] font-bold text-gray-800">{origin}</span>}
      </div>

      {/* ── Price Section ─────────────────────────────────────────── */}
      <div className="text-center px-1 mt-auto">
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
          Set of 2: <Money value={set2Price} digits={2} />
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
  locale = "en",
}: {
  frontProduct: Product;
  rearProduct: Product;
  locale?: Locale;
}) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [activeFitmentProduct, setActiveFitmentProduct] = useState<Product | null>(null);

  const frontPrice = frontProduct.price > 0 ? frontProduct.price : 0;
  const rearPrice = rearProduct.price > 0 ? rearProduct.price : 0;
  const setOf4Price = (frontPrice * 2) + (rearPrice * 2);

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
      // Add 2 front tyres and 2 rear tyres
      const resFront = await addItem(frontProduct, 2);
      const resRear = await addItem(rearProduct, 2);
      if (resFront?.error || resRear?.error) {
        setAddError(resFront?.error || resRear?.error || "Could not add to cart.");
        setTimeout(() => setAddError(null), 4000);
      } else {
        setCartAdded(true);
        setTimeout(() => setCartAdded(false), 2500);
      }
    } finally {
      setAdding(false);
    }
  }

  const enquiryText = `Hi tyresworld.ae\n\nI would like to enquire about this Set of 4 tyres:\nFront (2x): ${frontProduct.name}\nRear (2x): ${rearProduct.name}`;

  return (
    <li className="list-none h-full col-span-1">
      <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
        
        {/* ── Dual Columns (Left: Front, Right: Rear) ─────────────── */}
        <div className="grid grid-cols-2 divide-x divide-gray-200 flex-1">
          <TyreHalfColumn
            product={frontProduct}
            locale={locale}
            onOpenFitment={() => setActiveFitmentProduct(frontProduct)}
          />
          <TyreHalfColumn
            product={rearProduct}
            locale={locale}
            onOpenFitment={() => setActiveFitmentProduct(rearProduct)}
          />
        </div>

        {/* ── Bottom Combined Action Bar ──────────────────────────── */}
        <div className="grid grid-cols-2 border-t border-gray-200 shrink-0">
          {/* Left Button: SET OF 4 */}
          <button
            type="button"
            onClick={handleAddSetOf4}
            disabled={adding || isOutOfStock}
            className={`btn-slide-black py-3.5 px-3 text-[12px] sm:text-[13px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99] ${
              cartAdded ? "!bg-emerald-600" : ""
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
            className="btn-slide-red py-3.5 px-3 text-[12px] sm:text-[13px] font-black uppercase tracking-wider flex items-center justify-center text-center cursor-pointer active:scale-[0.99]"
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
