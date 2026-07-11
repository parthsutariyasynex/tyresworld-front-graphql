"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Money } from "@/components/Price";

type OrderV2 = {
  number:        string;
  status:        string;
  email:         string | null;
  order_date:    string;
  shipping_method: string | null;
  is_virtual:    boolean;
  token:         string;
  total?: { grand_total?: { value: number; currency: string } };
};

type State =
  | { phase: "loading" }
  | { phase: "success"; order: OrderV2 }
  | { phase: "error";   message: string };

function CheckoutCompleteInner() {
  const params = useSearchParams();
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    const cartId = params.get("cartId");
    const id     = params.get("id");

    if (!cartId || !id) {
      setState({ phase: "error", message: "Missing payment parameters. Please contact support." });
      return;
    }

    let active = true;
    (async () => {
      try {
        // 1. Sync payment order — notify Magento payment was received
        await fetch("/api/orders", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ op: "syncPaymentOrder", cartId, id }),
        }).catch(() => {/* best-effort */});

        // 2. Complete order — finalize and get full order details
        const res  = await fetch("/api/orders", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ op: "completeOrder", cartId, id }),
        });
        const data = await res.json() as {
          order:  OrderV2 | null;
          errors: { code: string; message: string }[];
          error:  string | null;
        };

        if (!active) return;

        if (data.error || !data.order) {
          setState({ phase: "error", message: data.error ?? "Order could not be completed. Please contact support." });
          return;
        }

        setState({ phase: "success", order: data.order });
      } catch (e) {
        if (!active) return;
        setState({ phase: "error", message: e instanceof Error ? e.message : "Network error. Please try again." });
      }
    })();

    return () => { active = false; };
  }, [params]);

  /* ── Loading ─────────────────────────────────────────────────── */
  if (state.phase === "loading") {
    return (
      <>
        <div className="bg-black py-12 text-center">
          <div className="container">
            <h1 className="text-3xl font-black uppercase tracking-wider text-white">PROCESSING PAYMENT</h1>
          </div>
        </div>
        <div className="container py-24 text-center max-w-sm mx-auto">
          <Loader2 size={40} className="animate-spin text-gray-300 mx-auto mb-6" />
          <p className="text-gray-500 text-sm font-medium">Confirming your payment, please wait…</p>
        </div>
      </>
    );
  }

  /* ── Error ───────────────────────────────────────────────────── */
  if (state.phase === "error") {
    return (
      <>
        <div className="bg-black py-12 text-center">
          <div className="container">
            <h1 className="text-3xl font-black uppercase tracking-wider text-white">PAYMENT ISSUE</h1>
          </div>
        </div>
        <div className="container py-20 text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={36} className="text-[#ed1c24]" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Payment Failed</h2>
          <p className="text-gray-500 text-sm mb-6">{state.message}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/checkout"
              className="inline-flex items-center gap-2 bg-black hover:bg-[#ed1c24] text-white font-black text-xs uppercase tracking-wider py-4 px-8 rounded-sm transition-colors"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 font-bold text-xs uppercase tracking-wider py-4 px-8 rounded-sm hover:border-gray-500 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </>
    );
  }

  /* ── Success ─────────────────────────────────────────────────── */
  const { order } = state;
  const grandTotal = order.total?.grand_total;
  const money = (v: number, c: string) => <Money value={v} currency={c} digits={2} />;

  return (
    <>
      <div className="bg-black py-12 text-center">
        <div className="container">
          <h1 className="text-3xl font-black uppercase tracking-wider text-white">ORDER CONFIRMED</h1>
        </div>
      </div>
      <div className="container py-20 text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={36} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">
          Thank You!
        </h2>
        <p className="text-gray-500 text-sm mb-6">Your payment was successful and your order is confirmed.</p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-5 mb-6 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Order Number</span>
            <span className="font-black text-gray-900 font-mono">{order.number}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Status</span>
            <span className="font-bold text-gray-900 capitalize">{order.status.toLowerCase().replace(/_/g, " ")}</span>
          </div>
          {grandTotal && (
            <div className="flex justify-between text-sm border-t border-gray-100 pt-3">
              <span className="text-gray-500 font-medium">Total</span>
              <span className="font-black text-[#ed1c24]">{money(grandTotal.value, grandTotal.currency)}</span>
            </div>
          )}
          {order.email && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Confirmation sent to</span>
              <span className="font-bold text-gray-900">{order.email}</span>
            </div>
          )}
          {order.shipping_method && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Shipping</span>
              <span className="font-bold text-gray-900">{order.shipping_method}</span>
            </div>
          )}
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-black hover:bg-[#ed1c24] text-white font-black text-xs uppercase tracking-wider py-4 px-8 rounded-sm transition-colors"
        >
          Continue Shopping <ArrowRight size={14} />
        </Link>
      </div>
    </>
  );
}

/* useSearchParams() must be wrapped in a Suspense boundary for the
   static prerender / CSR bailout to succeed (Next.js App Router). */
export default function CheckoutCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="container py-24 text-center max-w-sm mx-auto">
          <Loader2 size={40} className="animate-spin text-gray-300 mx-auto mb-6" />
          <p className="text-gray-500 text-sm font-medium">Loading…</p>
        </div>
      }
    >
      <CheckoutCompleteInner />
    </Suspense>
  );
}
