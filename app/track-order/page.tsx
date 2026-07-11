"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Package, Truck, CheckCircle, Clock, ArrowRight, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { Money } from "@/components/Price";

type OrderItem = {
  id: string;
  product_sku: string;
  product_name: string;
  quantity_ordered: number;
  quantity_shipped: number;
  quantity_canceled: number;
  product_sale_price: { value: number; currency: string };
};

type OrderTracking = {
  id: string;
  number: string;
  status: string;
  order_date: string;
  total: {
    grand_total: { value: number; currency: string };
    subtotal:    { value: number; currency: string };
  };
  items: OrderItem[];
  shipments: { id: string; number: string; tracking: { title: string; carrier: string; number: string }[] }[];
  shipping_address: {
    firstname: string; lastname: string; street: string[];
    city: string; region?: string; postcode: string; country_code: string; telephone: string;
  };
  payment_methods: { name: string; type: string }[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Package }> = {
  pending:    { label: "Pending",    color: "text-amber-600 bg-amber-50 border-amber-200",  icon: Clock },
  processing: { label: "Processing", color: "text-blue-600 bg-blue-50 border-blue-200",     icon: Package },
  shipped:    { label: "Shipped",    color: "text-purple-600 bg-purple-50 border-purple-200", icon: Truck },
  complete:   { label: "Delivered",  color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle },
  canceled:   { label: "Cancelled",  color: "text-red-600 bg-red-50 border-red-200",        icon: AlertCircle },
};

function money(value: number, currency: string) {
  return <Money value={value} currency={currency} digits={2} />;
}

function TrackOrderInner() {
  const params = useSearchParams();
  // Guest-cancellation confirmation link from the Magento email.
  // Param names vary between Magento versions, so accept both spellings.
  const cancelNumber = params.get("order") ?? params.get("number") ?? "";
  const cancelUid    = params.get("uid") ?? params.get("key") ?? "";

  const [form, setForm]       = useState({ number: cancelNumber, email: "", lastname: "" });
  const [loading, setLoading] = useState(false);
  const [order, setOrder]     = useState<OrderTracking | null>(null);
  const [error, setError]     = useState("");

  const [cancelState,       setCancelState]       = useState<"idle" | "confirming" | "confirmed" | "failed">(cancelNumber && cancelUid ? "confirming" : "idle");
  const [cancelOrderStatus, setCancelOrderStatus] = useState("");

  useEffect(() => {
    if (!cancelNumber || !cancelUid) return;
    (async () => {
      try {
        const res  = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ op: "confirmGuestCancel", number: cancelNumber, uid: cancelUid }),
        });
        const data = await res.json() as { status?: string | null; error?: string | null };
        if (data.error) {
          console.error("[track-order] cancel confirmation:", data.error);
          setCancelState("failed");
        } else {
          setCancelOrderStatus(data.status ?? "");
          setCancelState("confirmed");
        }
      } catch {
        setCancelState("failed");
      }
    })();
  }, [cancelNumber, cancelUid]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setOrder(null);
    try {
      const params = new URLSearchParams({
        number:   form.number.trim(),
        email:    form.email.trim(),
        lastname: form.lastname.trim(),
      });
      const res  = await fetch(`/api/orders?${params}`);
      const data = await res.json() as { order: OrderTracking | null; error?: string };
      if (data.error || !data.order) {
        setError(data.error ?? "Order not found. Please check your details and try again.");
      } else {
        setOrder(data.order);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const StatusIcon = order ? (STATUS_CONFIG[order.status.toLowerCase()]?.icon ?? Package) : Package;
  const statusCfg  = order ? (STATUS_CONFIG[order.status.toLowerCase()] ?? { label: order.status, color: "text-gray-600 bg-gray-50 border-gray-200", icon: Package }) : null;

  return (
    <>
      {/* Header */}
      <div className="bg-black py-12 text-center">
        <div className="container">
          <p className="text-xs text-white/40 mb-2 uppercase tracking-widest font-medium">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            {" / "}Track Order
          </p>
          <h1 className="text-3xl font-black uppercase tracking-wider text-white">Track Your Order</h1>
        </div>
      </div>

      <div className="container py-12 lg:py-16 max-w-2xl mx-auto">

        {/* Guest cancellation confirmation (from email link) */}
        {cancelState === "confirming" && (
          <div className="border border-gray-200 bg-gray-50 text-gray-700 rounded-sm px-5 py-4 flex items-center gap-3 mb-8">
            <Loader2 size={20} className="animate-spin text-[#ed1c24] shrink-0" />
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider opacity-60">Order Cancellation</p>
              <p className="text-sm font-bold">Confirming cancellation of order {cancelNumber}…</p>
            </div>
          </div>
        )}
        {cancelState === "confirmed" && (
          <div className="border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-sm px-5 py-4 flex items-center gap-3 mb-8">
            <CheckCircle size={20} className="shrink-0" />
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider opacity-60">Order Cancellation</p>
              <p className="text-sm font-bold">
                Cancellation of order <span className="font-mono">{cancelNumber}</span> confirmed.
                {cancelOrderStatus && <> Current status: {cancelOrderStatus}.</>}
                {" "}You can look up the order below to see its latest details.
              </p>
            </div>
          </div>
        )}
        {cancelState === "failed" && (
          <div className="border border-red-200 bg-red-50 text-red-700 rounded-sm px-5 py-4 flex items-center gap-3 mb-8">
            <AlertCircle size={20} className="shrink-0" />
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider opacity-60">Order Cancellation</p>
              <p className="text-sm font-bold">
                We could not confirm the cancellation of order <span className="font-mono">{cancelNumber}</span>.
                The link may have expired or was already used. Look up the order below to check its status,
                or <Link href="/contact" className="underline">contact support</Link> if you still need to cancel.
              </p>
            </div>
          </div>
        )}

        {/* Search Form */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-sm overflow-hidden mb-8">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
            <Search size={16} className="text-gray-500" />
            <h2 className="font-black text-sm uppercase tracking-wider text-gray-900">Order Lookup</h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                Order Number <span className="text-[#ed1c24]">*</span>
              </label>
              <input
                required
                value={form.number}
                onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                placeholder="e.g. PT-0707264257"
                className="border border-gray-200 bg-white rounded-sm px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-gray-800 transition-colors"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                  Email Address <span className="text-[#ed1c24]">*</span>
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="border border-gray-200 bg-white rounded-sm px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-gray-800 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                  Last Name <span className="text-[#ed1c24]">*</span>
                </label>
                <input
                  required
                  value={form.lastname}
                  onChange={e => setForm(f => ({ ...f, lastname: e.target.value }))}
                  placeholder="Smith"
                  className="border border-gray-200 bg-white rounded-sm px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-gray-800 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm px-4 py-3 flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-black hover:bg-[#ed1c24] text-white font-black text-[12px] uppercase tracking-wider py-3.5 px-8 rounded-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Searching…" : <><Search size={13} /> Find My Order <ArrowRight size={13} /></>}
            </button>
          </form>
        </div>

        {/* Order Result */}
        {order && statusCfg && (
          <div className="flex flex-col gap-5">

            {/* Status Banner */}
            <div className={`border rounded-sm px-5 py-4 flex items-center gap-4 ${statusCfg.color}`}>
              <StatusIcon size={28} />
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider opacity-60">Order Status</p>
                <p className="text-xl font-black">{statusCfg.label}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[11px] font-black uppercase tracking-wider opacity-60">Order #</p>
                <p className="font-black font-mono">{order.number}</p>
              </div>
            </div>

            {/* Tracking numbers */}
            {order.shipments?.flatMap(s => s.tracking).filter(t => t.number).length > 0 && (
              <div className="bg-white border border-gray-100 shadow-sm rounded-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <Truck size={14} className="text-gray-500" />
                  <h3 className="font-black text-sm uppercase tracking-wider text-gray-900">Tracking</h3>
                </div>
                <div className="p-5 flex flex-col gap-2">
                  {order.shipments.flatMap(s => s.tracking).filter(t => t.number).map((t, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-500">{t.carrier || t.title}</span>
                      <span className="font-black font-mono text-gray-900">{t.number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
                <Package size={14} className="text-gray-500" />
                <h3 className="font-black text-sm uppercase tracking-wider text-gray-900">
                  Items ({order.items.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-4 gap-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{item.product_name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">SKU: {item.product_sku} · Qty: {item.quantity_ordered}</p>
                    </div>
                    <span className="text-sm font-black text-gray-900 whitespace-nowrap">
                      {money(item.product_sale_price.value * item.quantity_ordered, item.product_sale_price.currency)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center px-5 py-4 bg-gray-50 border-t border-gray-200">
                <span className="text-sm font-black uppercase tracking-wider text-gray-700">Order Total</span>
                <span className="text-base font-black text-gray-900">
                  {money(order.total.grand_total.value, order.total.grand_total.currency)}
                </span>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
                <MapPin size={14} className="text-gray-500" />
                <h3 className="font-black text-sm uppercase tracking-wider text-gray-900">Shipping Address</h3>
              </div>
              <div className="p-5 text-sm text-gray-700 leading-relaxed">
                <p className="font-bold">{order.shipping_address.firstname} {order.shipping_address.lastname}</p>
                <p>{order.shipping_address.street?.join(", ")}</p>
                <p>{order.shipping_address.city}{order.shipping_address.region ? `, ${order.shipping_address.region}` : ""} {order.shipping_address.postcode}</p>
                <p>{order.shipping_address.country_code}</p>
                <p className="text-gray-400 mt-1">{order.shipping_address.telephone}</p>
              </div>
            </div>

            {/* Payment */}
            {order.payment_methods?.length > 0 && (
              <p className="text-sm text-gray-500 text-center">
                Paid via <strong className="text-gray-900">{order.payment_methods[0].name}</strong>
              </p>
            )}
          </div>
        )}

        {/* Registered customer link */}
        <p className="text-center text-sm text-gray-400 mt-8">
          Have an account?{" "}
          <Link href="/account" className="text-[#ed1c24] font-bold hover:underline">
            Sign in to view all orders →
          </Link>
        </p>
      </div>
    </>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="container py-28 text-center max-w-sm mx-auto"><Loader2 size={40} className="animate-spin text-[#ed1c24] mx-auto" /></div>}>
      <TrackOrderInner />
    </Suspense>
  );
}
