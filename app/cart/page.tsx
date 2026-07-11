"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight, X, Tag, Loader2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { usePathname } from "next/navigation";
import { Money } from "@/components/Price";

/* ── Qty stepper ──────────────────────────────────────────────── */
function QtyInput({
  uid,
  quantity,
  onUpdate,
}: {
  uid: string;
  quantity: number;
  onUpdate: (uid: string, qty: number) => void;
}) {
  const [val, setVal] = useState(quantity);
  useEffect(() => { setVal(quantity); }, [quantity]);

  const dec = () => { if (val > 1) { setVal(v => v - 1); onUpdate(uid, val - 1); } };
  const inc = () => { setVal(v => v + 1); onUpdate(uid, val + 1); };

  return (
    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden w-fit">
      <button
        onClick={dec}
        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors text-base leading-none"
      >
        −
      </button>
      <span className="w-9 text-center text-sm font-bold text-gray-900 select-none">{val}</span>
      <button
        onClick={inc}
        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors text-base leading-none"
      >
        +
      </button>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────── */
export default function CartPage() {
  const pathname = usePathname();
  const locale   = pathname.split("/")[1] === "ar" ? "ar" : "en";
  const isAr     = locale === "ar";

  const {
    items, subtotal, grandTotal, currency, cart, ready, loading,
    updateQty, removeItem, applyCoupon, removeCoupon,
  } = useCart();

  const [couponInput,   setCouponInput]   = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg,     setCouponMsg]     = useState<{ text: string; ok: boolean } | null>(null);

  const activeCoupon   = cart?.applied_coupons?.[0]?.code ?? null;
  const discounts      = cart?.prices?.discounts ?? [];
  const discountAmount = discounts.reduce((acc, d) => acc + Math.abs(d.amount.value), 0);
  const appliedTaxes   = cart?.prices?.applied_taxes ?? [];
  const totalTax       = appliedTaxes.reduce((acc, t) => acc + t.amount.value, 0);
  const shippingAmount = cart?.shipping_addresses?.[0]?.selected_shipping_method?.amount?.value ?? 0;

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
      setCouponMsg({ text: isAr ? "تم تطبيق الكوبون" : "Coupon applied!", ok: true });
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

  /* ── Loading skeleton ──────────────────────────────────────── */
  if (!ready) {
    return (
      <>
        {/* Header skeleton */}
        <div className="bg-white border-b border-gray-100 py-6">
          <div className="max-w-7xl mx-auto px-4">
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="h-7 w-36 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
            <div className="space-y-4">
              <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            </div>
            <div className="h-72 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </>
    );
  }

  /* ── Empty cart ──────────────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <>
        <div className="bg-white border-b border-gray-100 py-6">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-xs text-gray-400 mb-1">
              <Link href={`/${locale}`} className="hover:text-gray-700 transition-colors">Home</Link>
              {" / "}
              <span className="text-gray-700">Cart</span>
            </p>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
              {isAr ? "سلة التسوق" : "Shopping Cart"}
            </h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-28 text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={30} className="text-gray-300" />
          </div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">
            {isAr ? "سلتك فارغة" : "Your cart is empty"}
          </h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            {isAr ? "لم تضف أي إطارات بعد." : "You haven't added any tyres yet."}
          </p>
          <Link
            href={`/${locale}/tyres`}
            className="inline-flex items-center gap-2 bg-[#ed1c24] hover:bg-[#c6181d] text-white font-black text-xs uppercase tracking-widest py-4 px-8 rounded-lg transition-colors"
          >
            {isAr ? "تسوق الآن" : "Browse Tyres"}
            <ArrowRight size={14} />
          </Link>
        </div>
      </>
    );
  }

  /* ── Cart ─────────────────────────────────────────────────────── */
  return (
    <div dir={isAr ? "rtl" : "ltr"}>

      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-6 mb-8">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-xs text-gray-400 mb-1">
            <Link href={`/${locale}`} className="hover:text-gray-700 transition-colors">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            {" / "}
            <span className="text-gray-700">{isAr ? "سلة التسوق" : "Cart"}</span>
          </p>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
            {isAr ? "سلة التسوق" : "Shopping Cart"}
          </h1>
          <p className="text-gray-400 text-xs mt-1 font-medium">
            {isAr
              ? `${items.length} ${items.length === 1 ? "منتج" : "منتجات"}`
              : `${items.length} ${items.length === 1 ? "item" : "items"}`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className={`grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start ${loading ? "opacity-60 pointer-events-none" : ""}`}>

          {/* ── Left: Cart Items ──────────────────────────────── */}
          <div className="space-y-4">

            {/* Items Card */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[1fr_120px_140px_120px] bg-gray-50 border-b border-gray-100 px-5 py-3">
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">{isAr ? "المنتج" : "Item"}</span>
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 text-center">{isAr ? "السعر" : "Price"}</span>
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 text-center">{isAr ? "الكمية" : "Qty"}</span>
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 text-right">{isAr ? "الإجمالي" : "Subtotal"}</span>
              </div>

              {/* Desktop rows */}
              <div className="hidden md:block divide-y divide-gray-50">
                {items.map((item) => {
                  const productUrl = `/${locale}/product/${item.product.url_key ?? item.product.sku}`;
                  return (
                    <div key={item.uid} className="grid grid-cols-[1fr_120px_140px_120px] items-center px-5 py-4">
                      {/* Product */}
                      <div className="flex items-center gap-4">
                        <Link href={productUrl} className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-lg overflow-hidden flex items-center justify-center p-2 shrink-0 hover:border-gray-300 transition-colors">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.product.thumbnail?.url ?? ""}
                            alt={item.product.name}
                            className="w-full h-full object-contain"
                          />
                        </Link>
                        <div className="min-w-0">
                          <Link href={productUrl} className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 hover:text-[#ed1c24] transition-colors">{item.product.name}</Link>
                          <button
                            onClick={() => removeItem(item.uid)}
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#ed1c24] transition-colors font-medium"
                          >
                            <X size={10} />
                            {isAr ? "حذف" : "Remove"}
                          </button>
                        </div>
                      </div>
                      {/* Price */}
                      <p className="text-sm text-gray-600 text-center tabular-nums">{fmt(item.prices.price.value)}</p>
                      {/* Qty */}
                      <div className="flex justify-center">
                        <QtyInput uid={item.uid} quantity={item.quantity} onUpdate={updateQty} />
                      </div>
                      {/* Row total */}
                      <p className="text-sm font-bold text-gray-900 text-right tabular-nums">{fmt(item.prices.row_total.value)}</p>
                    </div>
                  );
                })}
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-50">
                {items.map((item) => {
                  const productUrl = `/${locale}/product/${item.product.url_key ?? item.product.sku}`;
                  return (
                  <div key={item.uid} className="p-4">
                    <div className="flex gap-3">
                      <Link href={productUrl} className="w-[72px] h-[72px] bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center p-2 shrink-0 hover:border-gray-300 transition-colors">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.product.thumbnail?.url ?? ""} alt={item.product.name} className="w-full h-full object-contain" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={productUrl} className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 hover:text-[#ed1c24] transition-colors">{item.product.name}</Link>
                        <p className="text-sm text-gray-500 mt-1 tabular-nums">{fmt(item.prices.price.value)}</p>
                      </div>
                      <button onClick={() => removeItem(item.uid)} className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-[#ed1c24] rounded-lg hover:bg-red-50 transition-colors shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <QtyInput uid={item.uid} quantity={item.quantity} onUpdate={updateQty} />
                      <div className="text-right">
                        <p className="text-[11px] text-gray-400 uppercase tracking-wide">{isAr ? "الإجمالي" : "Total"}</p>
                        <p className="text-sm font-bold text-gray-900 tabular-nums">{fmt(item.prices.row_total.value)}</p>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Continue Shopping */}
            <div>
              <Link
                href={`/${locale}/tyres`}
                className="inline-flex items-center gap-2 bg-[#ed1c24] hover:bg-[#c6181d] text-white font-black text-xs uppercase tracking-widest py-3 px-7 rounded-lg transition-colors"
              >
                {isAr ? "مواصلة التسوق" : "CONTINUE SHOPPING"}
              </Link>
            </div>
          </div>

          {/* ── Right: Order Summary ───────────────────────────── */}
          <div className="lg:sticky lg:top-24 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">

            {/* Summary header */}
            <div className="bg-[#f3f4f6] px-5 py-4 border-b border-gray-100">
              <h2 className="font-extrabold text-sm uppercase tracking-wider text-gray-800">
                {isAr ? "ملخص الطلب" : "Order Summary"}
              </h2>
            </div>

            {/* Price rows */}
            <div className="px-5 py-4 space-y-3">
              <div className="flex justify-between text-sm text-gray-600 font-medium">
                <span>{isAr ? "المجموع الجزئي" : "Subtotal"}</span>
                <span className="font-bold text-gray-900 tabular-nums">{fmt(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-gray-600 font-medium">
                  <span className="text-[#ed1c24]">{isAr ? "الخصم" : "Discount"}</span>
                  <span className="font-bold text-[#ed1c24] tabular-nums">− {fmt(discountAmount)}</span>
                </div>
              )}

              {shippingAmount > 0 && (
                <div className="flex justify-between text-sm text-gray-600 font-medium">
                  <span>{isAr ? "رسوم التوصيل" : "Delivery Charges"}</span>
                  <span className="font-bold text-gray-900 tabular-nums">{fmt(shippingAmount)}</span>
                </div>
              )}

              {appliedTaxes.length > 0 ? appliedTaxes.map((tax) => (
                <div key={tax.label} className="flex justify-between text-sm text-gray-600 font-medium">
                  <span>{tax.label}</span>
                  <span className="font-bold text-gray-900 tabular-nums">{fmt(tax.amount.value)}</span>
                </div>
              )) : (
                <div className="flex justify-between text-sm text-gray-600 font-medium">
                  <span>{isAr ? "ضريبة القيمة المضافة (15%)" : "VAT (15%)"}</span>
                  <span className="font-bold text-gray-900 tabular-nums">{fmt(totalTax)}</span>
                </div>
              )}

              <div className="flex justify-between text-[15px] font-black text-gray-900 border-t border-gray-200 pt-3">
                <span>{isAr ? "إجمالي الطلب" : "Order Total"}</span>
                <span className="text-[#ed1c24] tabular-nums">{fmt(grandTotal)}</span>
              </div>
            </div>

            {/* CTA */}
            <div className="px-5 pb-5">
              <Link
                href={`/${locale}/storelocator?ref=cart`}
                className="flex items-center justify-center gap-2 w-full bg-black hover:bg-[#ed1c24] text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl transition-colors"
              >
                {isAr ? "متابعة الدفع" : "PROCEED TO CHECKOUT"}
                {!isAr && <ArrowRight size={13} />}
              </Link>

              {/* Payment badges — exact match to product page */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col gap-2 mt-3">
                <p className="text-[11px] text-gray-500 font-medium">
                  {isAr ? "قسّم على 4 دفعات مع" : "Split in 4 Payment with"}
                </p>
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
          </div>

        </div>
      </div>
    </div>
  );
}
