"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  ArrowRight,
  Package,
  Trash2,
  ChevronDown,
  Check,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Money } from "@/components/Price";

/* ── Custom Quantity Dropdown Component ───────────────────────── */
function CartQtyDropdown({
  uid,
  quantity,
  onUpdate,
  disabled,
}: {
  uid: string;
  quantity: number;
  onUpdate: (uid: string, qty: number) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const qtyOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16, 20];
  const options = Array.from(new Set([...qtyOptions, quantity])).sort((a, b) => a - b);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Quantity: ${quantity}`}
        className="flex items-center justify-between gap-2 min-w-[58px] sm:min-w-[64px] h-9 px-3 bg-[#f8f9fa] hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg text-gray-950 font-bold text-xs sm:text-sm cursor-pointer transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>{quantity}</span>
        <ChevronDown
          size={14}
          strokeWidth={2.5}
          className={`text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 bottom-full mb-1.5 z-50 w-20 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl p-1 animate-in fade-in zoom-in-95 duration-150"
        >
          {options.map((n) => (
            <li key={n} role="option" aria-selected={n === quantity}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (n !== quantity) onUpdate(uid, n);
                }}
                className={`flex items-center justify-between w-full h-8 px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  n === quantity
                    ? "bg-[#ed1c24] text-white"
                    : "text-gray-800 hover:bg-gray-100"
                }`}
              >
                <span>{n}</span>
                {n === quantity && <Check size={13} strokeWidth={3} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Main Cart Page ───────────────────────────────────────────── */
export default function CartPage() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] === "ar" ? "ar" : "en";
  const isAr = locale === "ar";

  const {
    items,
    subtotal,
    grandTotal,
    currency,
    cart,
    ready,
    loading,
    updateQty,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const activeCoupon = cart?.applied_coupons?.[0]?.code ?? null;
  const discounts = cart?.prices?.discounts ?? [];
  const discountAmount = discounts.reduce((acc, d) => acc + Math.abs(d.amount.value), 0);
  const appliedTaxes = cart?.prices?.applied_taxes ?? [];
  const taxFromApi = appliedTaxes.reduce((acc, t) => acc + t.amount.value, 0);
  const shippingAmount =
    cart?.shipping_addresses?.[0]?.selected_shipping_method?.amount?.value ?? 0;

  // Real store data calculations
  const grandTotalValue = grandTotal > 0 ? grandTotal : subtotal;
  const subtotalExclTax =
    cart?.prices?.subtotal_excluding_tax?.value ??
    (grandTotalValue > 0 ? grandTotalValue / 1.05 : subtotal);
  const vatAmount =
    taxFromApi > 0
      ? taxFromApi
      : grandTotalValue > subtotalExclTax
      ? grandTotalValue - subtotalExclTax
      : subtotal * 0.05;
  const additionalCharge = shippingAmount;

  const fmt = (v: number) => <Money value={v} currency={currency} digits={2} />;

  async function handleApplyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCouponLoading(true);
    setCouponMsg(null);
    const errMsg = await applyCoupon(code);
    if (errMsg) {
      setCouponMsg({ text: errMsg, ok: false });
    } else {
      setCouponMsg({ text: isAr ? "تم تطبيق الكوبون بنجاح" : "Coupon applied successfully!", ok: true });
      setCouponInput("");
    }
    setCouponLoading(false);
  }

  async function handleRemoveCoupon() {
    setCouponLoading(true);
    setCouponMsg(null);
    await removeCoupon();
    setCouponLoading(false);
  }

  /* ── Loading Skeleton ────────────────────────────────────────── */
  if (!ready) {
    return (
      <div className="bg-[#f8f9fa] pb-10" dir={isAr ? "rtl" : "ltr"}>
        {/* ── Page Hero Title Banner ── */}
        <div
          className="page-title-wrapper py-9 sm:py-11 text-center bg-black"
          style={{
            backgroundImage: "url('/img/shopping-cart-banner.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="container mx-auto px-4">
            <div className="title">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-white tracking-wider font-sans">
                <span className="base">{isAr ? "سلة التسوق" : "SHOPPING CART"}</span>
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-8 items-start">
            <div className="space-y-4">
              <div className="h-40 bg-white rounded-2xl border border-gray-100 p-6 animate-pulse" />
              <div className="h-40 bg-white rounded-2xl border border-gray-100 p-6 animate-pulse" />
            </div>
            <div className="h-96 bg-white rounded-2xl border border-gray-100 p-6 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Empty Cart View ─────────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <div className="bg-[#f8f9fa] min-h-[70vh] pb-12" dir={isAr ? "rtl" : "ltr"}>
        {/* ── Page Hero Title Banner ── */}
        <div
          className="page-title-wrapper py-9 sm:py-11 text-center bg-black"
          style={{
            backgroundImage: "url('/img/shopping-cart-banner.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="container mx-auto px-4">
            <div className="title">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-white tracking-wider font-sans">
                <span className="base">{isAr ? "سلة التسوق" : "SHOPPING CART"}</span>
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-6">
          {/* Breadcrumb */}
          <div className="mb-6">
            <p className="text-xs text-gray-500 font-medium">
              <Link href={`/${locale}`} className="hover:text-gray-900 transition-colors">
                {isAr ? "الرئيسية" : "Home"}
              </Link>
              {" / "}
              <span className="text-gray-900 font-bold">{isAr ? "سلة التسوق" : "Shopping Cart"}</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-10 sm:p-16 text-center max-w-xl mx-auto shadow-2xs">
            <div className="w-20 h-20 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6 text-[#ed1c24]">
              <ShoppingBag size={34} strokeWidth={2.2} />
            </div>
            <h2 className="text-2xl font-black text-gray-950 uppercase tracking-tight mb-2 font-sans">
              {isAr ? "سلة التسوق فارغة" : "Your cart is empty"}
            </h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
              {isAr
                ? "لم تضف أي إطارات إلى سلتك بعد. استكشف مجموعتنا الواسعة من الإطارات الممتازة."
                : "You haven't added any tyres to your cart yet. Explore our wide range of premium tyres today."}
            </p>
            <Link
              href={`/${locale}/tyres`}
              className="inline-flex items-center justify-center gap-2 bg-[#ed1c24] hover:bg-[#c6181d] active:bg-[#aa1217] text-white font-black text-xs sm:text-sm uppercase tracking-wider py-4 px-8 rounded-xl shadow-md shadow-red-500/25 transition-all cursor-pointer"
            >
              {isAr ? "استكشف الإطارات الآن" : "Browse Tyres"}
              {!isAr && <ArrowRight size={16} strokeWidth={2.5} />}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Cart with Items ─────────────────────────────────────────── */
  return (
    <div className="bg-[#f8f9fa] pb-12" dir={isAr ? "rtl" : "ltr"}>
      {/* ── Page Hero Title Banner ── */}
      <div
        className="page-title-wrapper py-9 sm:py-11 text-center bg-black"
        style={{
          backgroundImage: "url('/img/shopping-cart-banner.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="container mx-auto px-4">
          <div className="title">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-white tracking-wider font-sans">
              <span className="base">{isAr ? "سلة التسوق" : "SHOPPING CART"}</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-5">
        {/* Breadcrumb */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 font-medium">
            <Link href={`/${locale}`} className="hover:text-gray-900 transition-colors">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            {" / "}
            <span className="text-gray-900 font-bold">{isAr ? "سلة التسوق" : "Shopping Cart"}</span>
          </p>
        </div>

        {/* Layout Grid: Left Items + Right Order Summary */}
        <div
          className={`grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-5 items-start ${
            loading ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          {/* ════ LEFT COLUMN: CART ITEMS ════ */}
          <div className="space-y-3">
            {/* ── Table Header ── */}
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-x-6 px-4 py-3 bg-gray-100 border border-gray-200/70 rounded-xl text-[11px] font-bold uppercase tracking-wider text-gray-500 select-none">
              <span>{isAr ? "المنتج" : "Item"}</span>
              <span className="text-center w-20">{isAr ? "السعر" : "Price"}</span>
              <span className="text-center w-12">{isAr ? "الكمية" : "Qty"}</span>
              <span className="text-right w-24">{isAr ? "الإجمالي" : "Subtotal"}</span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2">
              {items.map((item) => {
                const productUrl = `/${locale}/product/${item.product.url_key ?? item.product.sku}`;
                const unitPrice = item.prices.price.value;
                const rowTotal = item.prices.row_total.value;

                return (
                  /* ── Desktop: same 4-col grid as header ── */
                  <div
                    key={item.uid}
                    className="bg-white border border-gray-200/90 rounded-xl px-4 py-3.5 shadow-2xs hover:shadow-xs transition-shadow"
                  >
                    {/* DESKTOP ROW */}
                    <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-x-6 items-center">

                      {/* Col 1 — Item (thumbnail + name + subtitle) */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Link
                          href={productUrl}
                          className="w-16 h-16 bg-[#fafafa] border border-gray-100 rounded-xl flex items-center justify-center p-2 shrink-0 hover:border-gray-300 transition-colors"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.product.thumbnail?.url ?? ""}
                            alt={item.product.name}
                            className="w-full h-full object-contain drop-shadow-sm"
                            loading="lazy"
                          />
                        </Link>
                        <div className="min-w-0">
                          <Link
                            href={productUrl}
                            className="text-sm font-black text-gray-950 hover:text-[#ed1c24] transition-colors leading-snug line-clamp-2 block"
                          >
                            {item.product.name}
                          </Link>
                          <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium mt-0.5">
                            <Package size={11} className="shrink-0" />
                            <span>{isAr ? "مركز تركيب تايرز وورلد المعتمد" : "TyresWorld Certified Fitment Center"}</span>
                          </div>
                          {/* Remove button inline under name */}
                          <button
                            type="button"
                            onClick={() => removeItem(item.uid)}
                            className="mt-1 flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#ed1c24] transition-colors cursor-pointer"
                            aria-label={isAr ? "حذف المنتج" : "Remove item"}
                          >
                            <Trash2 size={11} strokeWidth={2.2} />
                            <span>{isAr ? "حذف" : "Remove"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Col 2 — Price */}
                      <div className="w-20 text-center">
                        <span className="text-sm font-bold text-gray-700 tabular-nums">{fmt(unitPrice)}</span>
                      </div>

                      {/* Col 3 — Qty dropdown */}
                      <div className="w-12 flex justify-center">
                        <CartQtyDropdown
                          uid={item.uid}
                          quantity={item.quantity}
                          onUpdate={updateQty}
                        />
                      </div>

                      {/* Col 4 — Subtotal */}
                      <div className="w-24 text-right">
                        <span className="text-sm font-black text-gray-950 tabular-nums">{fmt(rowTotal)}</span>
                      </div>
                    </div>

                    {/* MOBILE ROW (compact card) */}
                    <div className="flex sm:hidden gap-3 items-center">
                      <Link
                        href={productUrl}
                        className="w-16 h-16 bg-[#fafafa] border border-gray-100 rounded-xl flex items-center justify-center p-2 shrink-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.product.thumbnail?.url ?? ""}
                          alt={item.product.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={productUrl} className="text-xs font-black text-gray-950 hover:text-[#ed1c24] line-clamp-2 leading-snug block">
                          {item.product.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs text-gray-500 tabular-nums">{fmt(unitPrice)}</span>
                          <span className="text-xs text-gray-300">×</span>
                          <CartQtyDropdown uid={item.uid} quantity={item.quantity} onUpdate={updateQty} />
                          <span className="text-xs text-gray-300">=</span>
                          <span className="text-xs font-black text-gray-950 tabular-nums">{fmt(rowTotal)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.uid)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#ed1c24] hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors cursor-pointer shrink-0"
                        aria-label={isAr ? "حذف المنتج" : "Remove item"}
                      >
                        <Trash2 size={15} strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Red Continue Shopping Button (matching original detail) */}
            <div className="pt-1">
              <Link
                href={`/${locale}/tyres`}
                className="btn-cta text-xs sm:text-sm py-3.5 px-8 rounded-lg shadow-md"
              >
                <span>{isAr ? "مواصلة التسوق" : "CONTINUE SHOPPING"}</span>
              </Link>
            </div>
          </div>

          {/* ════ RIGHT COLUMN: ORDER SUMMARY ════ */}
          <div className="lg:sticky lg:top-24 bg-white border border-gray-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
            {/* Header */}
            <h2 className="text-lg sm:text-xl font-black text-gray-950 tracking-tight leading-tight mb-4 font-sans">
              {isAr ? "ملخص الطلب" : "Order Summary"}
            </h2>

            {/* Price Rows (Exact store fields: Subtotal, Additional Charge, VAT (5%), Order Total) */}
            <div className="space-y-3.5">
              {/* Subtotal */}
              <div className="flex justify-between items-center text-sm text-gray-600 font-medium">
                <span>{isAr ? "المجموع الجزئي" : "Subtotal"}</span>
                <span className="font-bold text-gray-950 tabular-nums text-base">
                  {fmt(subtotalExclTax)}
                </span>
              </div>

              {/* Additional Charge */}
              <div className="flex justify-between items-center text-sm text-gray-600 font-medium">
                <span>{isAr ? "رسوم إضافية" : "Additional Charge"}</span>
                <span className="font-bold text-gray-950 tabular-nums text-base">
                  {fmt(additionalCharge)}
                </span>
              </div>

              {/* VAT (5%) */}
              <div className="flex justify-between items-center text-sm text-gray-600 font-medium">
                <span>{isAr ? "ضريبة القيمة المضافة (5%)" : "VAT (5%)"}</span>
                <span className="font-bold text-gray-950 tabular-nums text-base">
                  {fmt(vatAmount)}
                </span>
              </div>

              {/* Discount (if active) */}
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-sm text-[#ed1c24] font-medium">
                  <span className="font-bold">{isAr ? "الخصم" : "Discount"}</span>
                  <span className="font-black tabular-nums text-base">
                    − {fmt(discountAmount)}
                  </span>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-gray-100 pt-3.5 my-1" />

              {/* Order Total */}
              <div className="flex justify-between items-baseline mb-5">
                <span className="text-lg sm:text-xl font-black text-gray-950">
                  {isAr ? "إجمالي الطلب" : "Order Total"}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-gray-950 tabular-nums">
                  {fmt(grandTotalValue)}
                </span>
              </div>

              {/* Checkout CTA Button */}
              <Link
                href={`/${locale}/storelocator?ref=cart`}
                className="btn-cta w-full text-sm py-4 rounded-xl shadow-md"
              >
                <span>{isAr ? "متابعة الدفع" : "PROCEED TO CHECKOUT"}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
