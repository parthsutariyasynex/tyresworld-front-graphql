"use client";

import { useState } from "react";
import ProductImage from "@/components/ProductImage";
import Link from "next/link";
import {
  Minus,
  Plus,
  Trash2,
  Tag,
  ArrowRight,
  ShoppingBag,
  Truck,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";

export default function CartPage() {
  const {
    items, subtotal, grandTotal, currency, cart, ready, loading,
    updateQty, removeItem, applyCoupon, removeCoupon,
  } = useCart();

  const [coupon, setCoupon] = useState("");
  const [couponError, setCouponError] = useState("");

  const money = (v: number) => `${currency} ${v.toLocaleString()}`;
  const discounts = cart?.prices?.discounts ?? [];
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  async function handleApply() {
    const code = coupon.trim();
    if (!code) return;
    const err = await applyCoupon(code);
    setCouponError(err ?? "");
    if (!err) setCoupon("");
  }

  /* Loading (first hydration) */
  if (!ready) {
    return (
      <div className="container py-24 text-center text-ink/40">Loading your cart…</div>
    );
  }

  /* Empty */
  if (items.length === 0) {
    return (
      <div className="container py-24 text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-cream flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={32} className="text-ink/30" />
        </div>
        <h1 className="font-display text-3xl text-ink mb-3">Your cart is empty</h1>
        <p className="text-ink/50 mb-8">
          You haven&apos;t added anything yet. Explore our collection to find something you love.
        </p>
        <Link href="/shop" className="btn-primary text-sm px-8 py-3.5">
          Start shopping <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-cream border-b border-ink/5 py-10">
        <div className="container">
          <p className="text-xs text-ink/40 mb-3">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            {" / "}
            <span className="text-ink">Cart</span>
          </p>
          <h1 className="section-title">
            Your Cart
            <span className="text-base font-sans font-normal text-ink/40 ml-3">
              {totalQty} item{totalQty !== 1 ? "s" : ""}
            </span>
          </h1>
        </div>
      </div>

      <div className="container py-10 lg:py-14">
        <div className="grid lg:grid-cols-[1fr_380px] gap-10 lg:gap-14 items-start">
          {/* Cart items */}
          <div className={loading ? "opacity-60 pointer-events-none transition-opacity" : "transition-opacity"}>
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 text-xs font-semibold uppercase tracking-wider text-ink/40 pb-4 border-b border-ink/6">
              <span>Product</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Price</span>
              <span />
            </div>

            <div className="flex flex-col divide-y divide-ink/5">
              {items.map((item) => (
                <div
                  key={item.uid}
                  className="py-5 grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center"
                >
                  {/* Image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-cream flex-shrink-0 relative">
                    <ProductImage
                      src={item.product.thumbnail?.url ?? ""}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <p className="text-xs text-ink/40 uppercase tracking-wider mb-0.5">
                      {item.product.sku}
                    </p>
                    <p className="font-medium text-ink text-sm leading-snug">
                      {item.product.name}
                    </p>
                    <p className="sm:hidden font-semibold text-ink mt-1.5">
                      {money(item.prices.row_total.value)}
                    </p>
                  </div>

                  {/* Qty */}
                  <div className="flex items-center gap-1 border border-ink/10 rounded-xl p-1 col-start-1 sm:col-auto row-start-2 sm:row-auto">
                    <button
                      onClick={() => updateQty(item.uid, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg hover:bg-cream flex items-center justify-center transition-colors text-ink/60 hover:text-ink"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="text-sm font-medium text-ink w-7 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.uid, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg hover:bg-cream flex items-center justify-center transition-colors text-ink/60 hover:text-ink"
                      aria-label="Increase quantity"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {/* Price desktop */}
                  <p className="hidden sm:block font-semibold text-ink text-sm text-right w-24">
                    {money(item.prices.row_total.value)}
                  </p>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.uid)}
                    className="p-2 rounded-full hover:bg-cream text-ink/30 hover:text-red-400 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="mt-6 pt-6 border-t border-ink/6">
              <p className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                <Tag size={15} className="text-accent" />
                Coupon code
              </p>

              {discounts.length > 0 ? (
                <div className="flex items-center justify-between bg-accent/8 border border-accent/20 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-accent">
                    <CheckCircle size={16} />
                    <span>{discounts.map((d) => d.label).join(", ")} applied!</span>
                  </div>
                  <button onClick={removeCoupon} className="text-xs text-ink/40 hover:text-ink transition-colors">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => { setCoupon(e.target.value); setCouponError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleApply()}
                    placeholder="Enter coupon code"
                    className="input-field flex-1"
                  />
                  <button onClick={handleApply} className="btn-secondary text-sm px-5 py-3 flex-shrink-0">
                    Apply
                  </button>
                </div>
              )}
              {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-cream rounded-2xl p-6">
              <h2 className="font-semibold text-ink text-base mb-6">Order Summary</h2>

              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between text-ink/60">
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>

                {discounts.map((d) => (
                  <div key={d.label} className="flex justify-between text-accent font-medium">
                    <span>{d.label}</span>
                    <span>−{money(d.amount.value)}</span>
                  </div>
                ))}

                <div className="flex justify-between text-ink/60">
                  <span>Shipping</span>
                  <span className="text-ink/40">Calculated at checkout</span>
                </div>

                <div className="border-t border-ink/10 pt-3 flex justify-between font-semibold text-ink">
                  <span>Total</span>
                  <span className="text-lg">{money(grandTotal)}</span>
                </div>
              </div>

              <Link href="/checkout" className="btn-accent w-full text-sm py-4 mt-6 rounded-xl">
                Proceed to Checkout <ArrowRight size={15} />
              </Link>

              <div className="mt-5 flex flex-col gap-2.5">
                {[
                  { icon: ShieldCheck, text: "Secure 256-bit SSL checkout" },
                  { icon: Truck, text: "Free shipping available" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-ink/45">
                    <Icon size={14} className="text-ink/30 flex-shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/shop"
              className="flex items-center justify-center gap-2 text-sm text-ink/50 hover:text-ink transition-colors mt-4"
            >
              ← Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
