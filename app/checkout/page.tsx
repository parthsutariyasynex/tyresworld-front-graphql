"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, ShoppingBag, Loader2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import type { ShippingMethodOption } from "@/lib/cart-queries";

async function api(payload: Record<string, unknown>): Promise<Record<string, any>> {
  try {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      // Route returned HTML (error page / 404 / 500) — surface a clean message.
      return { error: `Cart service error (HTTP ${res.status}). Please retry.` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Network error reaching cart service." };
  }
}

type Step = "address" | "delivery" | "done";

const EMPTY_FORM = {
  email: "", firstname: "", lastname: "", street: "",
  city: "", postcode: "", telephone: "", region: "",
};

export default function CheckoutPage() {
  const { cartId, items, subtotal, grandTotal, currency, ready, refresh, clearLocal } = useCart();

  const [step, setStep] = useState<Step>("address");
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodOption[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<{ code: string; title: string }[]>([]);
  const [selMethod, setSelMethod] = useState<string>("");      // "carrier|method"
  const [selPayment, setSelPayment] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const money = (v: number) => `${currency} ${v.toLocaleString()}`;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function buildAddress() {
    const a: Record<string, unknown> = {
      firstname: form.firstname,
      lastname:  form.lastname,
      street:    [form.street],
      city:      form.city,
      postcode:  form.postcode || "00000",
      country_code: "AE",
      telephone: form.telephone,
    };
    if (form.region.trim()) a.region = form.region.trim();
    return a;
  }

  /* Step 1 → set email + shipping address, load delivery + payment options. */
  async function submitAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!cartId) return;
    setBusy(true); setError("");
    try {
      const emailRes = await api({ op: "setEmail", cartId, email: form.email });
      if (emailRes.error) throw new Error(emailRes.error);

      const shipRes = await api({ op: "setShippingAddress", cartId, address: buildAddress() });
      if (shipRes.error || !shipRes.cart) throw new Error(shipRes.error || "Could not set address");

      const addr = shipRes.cart.shipping_addresses?.[0];
      const methods: ShippingMethodOption[] = (addr?.available_shipping_methods ?? []).filter((m: ShippingMethodOption) => m.available);
      const payments = shipRes.cart.available_payment_methods ?? [];

      setShippingMethods(methods);
      setPaymentMethods(payments);
      if (methods[0]) setSelMethod(`${methods[0].carrier_code}|${methods[0].method_code}`);
      const checkmo = payments.find((p: { code: string }) => p.code === "checkmo");
      setSelPayment(checkmo?.code ?? payments[0]?.code ?? "");
      setStep("delivery");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  /* Step 2 → set method + billing + payment, then place the order. */
  async function placeOrder() {
    if (!cartId || !selMethod || !selPayment) return;
    setBusy(true); setError("");
    try {
      const [carrier, method] = selMethod.split("|");
      const m = await api({ op: "setShippingMethod", cartId, carrier, method });
      if (m.error) throw new Error(m.error);

      const b = await api({ op: "setBilling", cartId, address: buildAddress() });
      if (b.error) throw new Error(b.error);

      const p = await api({ op: "setPayment", cartId, code: selPayment });
      if (p.error) throw new Error(p.error);

      const o = await api({ op: "placeOrder", cartId });
      if (o.error || !o.orderNumber) throw new Error(o.error || "Order could not be placed.");

      setOrderNumber(o.orderNumber);
      setStep("done");
      clearLocal();   // server consumed the cart
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place the order.");
    } finally {
      setBusy(false);
    }
  }

  /* ── States ─────────────────────────────────────────────────── */
  if (step === "done" && orderNumber) {
    return (
      <div className="container py-24 text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={34} className="text-emerald-600" />
        </div>
        <h1 className="font-display text-3xl text-ink mb-3">Order placed!</h1>
        <p className="text-ink/55 mb-2">Thank you — your order has been received.</p>
        <p className="text-ink/80 font-medium mb-8">
          Order number: <span className="font-mono">{orderNumber}</span>
        </p>
        <Link href="/shop" className="btn-primary text-sm px-8 py-3.5">
          Continue shopping <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  if (ready && (!cartId || items.length === 0)) {
    return (
      <div className="container py-24 text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-cream flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={32} className="text-ink/30" />
        </div>
        <h1 className="font-display text-3xl text-ink mb-3">Your cart is empty</h1>
        <p className="text-ink/50 mb-8">Add some products before checking out.</p>
        <Link href="/shop" className="btn-primary text-sm px-8 py-3.5">Browse products <ArrowRight size={15} /></Link>
      </div>
    );
  }

  if (!ready) {
    return <div className="container py-24 text-center text-ink/40">Loading checkout…</div>;
  }

  return (
    <>
      <div className="bg-cream border-b border-ink/5 py-10">
        <div className="container">
          <p className="text-xs text-ink/40 mb-3">
            <Link href="/cart" className="hover:text-ink transition-colors">Cart</Link>
            {" / "}<span className="text-ink">Checkout</span>
          </p>
          <h1 className="section-title">Checkout</h1>
        </div>
      </div>

      <div className="container py-10 lg:py-14">
        <div className="grid lg:grid-cols-[1fr_380px] gap-10 lg:gap-14 items-start">
          {/* Form column */}
          <div>
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Step 1: address */}
            <form onSubmit={submitAddress} className={step === "delivery" ? "opacity-60 pointer-events-none" : ""}>
              <h2 className="font-semibold text-ink text-base mb-4">Contact & shipping</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <input required type="email" placeholder="Email" value={form.email} onChange={set("email")} className="input-field sm:col-span-2" />
                <input required placeholder="First name" value={form.firstname} onChange={set("firstname")} className="input-field" />
                <input required placeholder="Last name" value={form.lastname} onChange={set("lastname")} className="input-field" />
                <input required placeholder="Street address" value={form.street} onChange={set("street")} className="input-field sm:col-span-2" />
                <input required placeholder="City" value={form.city} onChange={set("city")} className="input-field" />
                <input placeholder="Emirate / Region (optional)" value={form.region} onChange={set("region")} className="input-field" />
                <input placeholder="Postcode (optional)" value={form.postcode} onChange={set("postcode")} className="input-field" />
                <input required placeholder="Phone" value={form.telephone} onChange={set("telephone")} className="input-field" />
              </div>
              <p className="text-xs text-ink/40 mt-2">Shipping country: United Arab Emirates (AE)</p>

              {step === "address" && (
                <button type="submit" disabled={busy} className="btn-primary text-sm px-7 py-3.5 mt-5 disabled:opacity-60">
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <>Continue to delivery <ArrowRight size={15} /></>}
                </button>
              )}
            </form>

            {/* Step 2: delivery + payment */}
            {step === "delivery" && (
              <div className="mt-10">
                <h2 className="font-semibold text-ink text-base mb-4">Delivery method</h2>
                <div className="flex flex-col gap-2 mb-8">
                  {shippingMethods.map((m) => {
                    const val = `${m.carrier_code}|${m.method_code}`;
                    return (
                      <label key={val} className={`flex items-center justify-between border rounded-xl px-4 py-3 cursor-pointer transition-colors ${selMethod === val ? "border-ink bg-cream" : "border-ink/10 hover:border-ink/25"}`}>
                        <span className="flex items-center gap-3 text-sm">
                          <input type="radio" name="ship" checked={selMethod === val} onChange={() => setSelMethod(val)} className="accent-ink" />
                          {m.carrier_title}{m.method_title ? ` — ${m.method_title}` : ""}
                        </span>
                        <span className="text-sm font-medium text-ink">{m.amount.value === 0 ? "Free" : money(m.amount.value)}</span>
                      </label>
                    );
                  })}
                  {shippingMethods.length === 0 && <p className="text-sm text-ink/50">No shipping methods available for this address.</p>}
                </div>

                <h2 className="font-semibold text-ink text-base mb-4">Payment method</h2>
                <div className="flex flex-col gap-2 mb-8">
                  {paymentMethods.map((p) => (
                    <label key={p.code} className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer text-sm transition-colors ${selPayment === p.code ? "border-ink bg-cream" : "border-ink/10 hover:border-ink/25"}`}>
                      <input type="radio" name="pay" checked={selPayment === p.code} onChange={() => setSelPayment(p.code)} className="accent-ink" />
                      {p.title}
                    </label>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setStep("address")} className="btn-secondary text-sm px-6 py-3.5">
                    ← Edit address
                  </button>
                  <button onClick={placeOrder} disabled={busy || !selMethod || !selPayment} className="btn-accent text-sm px-7 py-3.5 disabled:opacity-60">
                    {busy ? <Loader2 size={15} className="animate-spin" /> : <>Place order <ArrowRight size={15} /></>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="lg:sticky lg:top-24 bg-cream rounded-2xl p-6">
            <h2 className="font-semibold text-ink text-base mb-5">Order Summary</h2>
            <div className="flex flex-col divide-y divide-ink/8 mb-5">
              {items.map((it) => (
                <div key={it.uid} className="flex justify-between gap-3 py-3 text-sm">
                  <span className="text-ink/70 min-w-0 truncate">{it.quantity} × {it.product.name}</span>
                  <span className="text-ink font-medium whitespace-nowrap">{money(it.prices.row_total.value)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-ink/60 mb-1">
              <span>Subtotal</span><span>{money(subtotal)}</span>
            </div>
            <div className="flex justify-between font-semibold text-ink border-t border-ink/10 pt-3 mt-2">
              <span>Total</span><span className="text-lg">{money(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
