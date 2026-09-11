"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight, CheckCircle, ShoppingBag, Loader2,
  Truck, CreditCard, FileText,
  User, Car, ChevronDown, ChevronUp, ShieldCheck, Sparkles
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import type { ShippingMethodOption } from "@/lib/types";
import { Money } from "@/components/Price";

type Agreement = { agreement_id: number; checkbox_text: string; content: string; is_html: boolean; name: string };

/* ─── API helpers ────────────────────────────────────────────────── */
async function api(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { return { error: `Server error (HTTP ${res.status}). Please retry.` }; }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Network error." };
  }
}

async function ordersApi(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { return { error: `Server error (HTTP ${res.status}). Please retry.` }; }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Network error." };
  }
}

const EMPTY_FORM = {
  email: "",
  firstname: "",
  lastname: "",
  company: "",
  street: "",
  city: "Dubai",
  region: "",
  postcode: "00000",
  telephone: "",
  country_code: "AE",
};

const UAE_CITIES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Ras Al Khaimah",
  "Fujairah",
  "Umm Al Quwain",
  "Al Ain",
];

/* ─── Main page ──────────────────────────────────────────────────── */
export default function CheckoutPage() {
  const { cartId, cartToken, items, count, subtotal, grandTotal, currency, cart, ready, applyCoupon, removeCoupon, clearLocal } = useCart();

  const [form,            setForm]            = useState({ ...EMPTY_FORM });
  const [sameAsShipping,  setSameAsShipping]  = useState(true);
  const [, setShippingMethods] = useState<ShippingMethodOption[]>([]);
  const [paymentMethods,  setPaymentMethods]  = useState<{ code: string; title: string }[]>([]);
  const [selShipping,     setSelShipping]     = useState("");
  const [selPayment,      setSelPayment]      = useState<"card" | "applepay" | "tabby" | "tamara" | "link">("card");
  const [busy,            setBusy]            = useState(false);
  const [,  setLoadingMethods]  = useState(false);
  const [error,           setError]           = useState("");
  const [orderNumber,     setOrderNumber]     = useState<string | null>(null);
  const [agreements,      setAgreements]      = useState<Agreement[]>([]);
  const [agreedIds,       setAgreedIds]       = useState<Set<number>>(new Set());
  const [showAgreement,   setShowAgreement]   = useState<Agreement | null>(null);
  const [step,            setStep]            = useState<"checkout" | "done">("checkout");
  const [orderV2,         setOrderV2]         = useState<Record<string, unknown> | null>(null);

  // Accordion and sub-form states
  const [isItemsListOpen, setIsItemsListOpen] = useState(true);
  const [isCouponOpen,    setIsCouponOpen]    = useState(false);
  const [isCommentsOpen,  setIsCommentsOpen]  = useState(false);
  const [couponInput,     setCouponInput]     = useState("");
  const [couponError,     setCouponError]     = useState("");
  const [couponSuccess,   setCouponSuccess]   = useState(false);
  const [orderComments,   setOrderComments]   = useState("");

  // Vehicle states
  const [vehiclePlate,   setVehiclePlate]    = useState("");
  const [selectedMake,   setSelectedMake]    = useState("");
  const [selectedModel,  setSelectedModel]   = useState("");
  const [selectedYear,   setSelectedYear]    = useState("");
  const [makes,          setMakes]           = useState<{ label: string; value: string }[]>([]);
  const [models,         setModels]          = useState<{ label: string; value: string }[]>([]);
  const [years,          setYears]           = useState<{ label: string; value: string }[]>([]);

  const [installation,   setInstallation]    = useState<{
    type?: string;
    branch?: { name?: string; address?: string; city?: string };
    mobileAddress?: string;
    date?: string;
    time?: string;
  } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("selected_installation");
      if (saved) setInstallation(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }

    fetch("/api/checkout")
      .then(r => r.json())
      .then(d => { if (d.agreements?.length) setAgreements(d.agreements as Agreement[]); })
      .catch(() => {});
    fetch("/api/vehicles")
      .then(res => res.json())
      .then(data => setMakes(data.makes ?? []))
      .catch(() => {});
  }, []);

  const handleMakeChange = async (make: string) => {
    setSelectedMake(make);
    setSelectedModel("");
    setSelectedYear("");
    setModels([]);
    setYears([]);
    if (!make) return;
    try {
      const res = await fetch(`/api/vehicles?make=${encodeURIComponent(make)}`);
      const data = await res.json();
      setModels(data.models ?? []);
    } catch {}
  };

  const handleModelChange = async (model: string) => {
    setSelectedModel(model);
    setSelectedYear("");
    setYears([]);
    if (!model) return;
    try {
      const res = await fetch(`/api/vehicles?make=${encodeURIComponent(selectedMake)}&model=${encodeURIComponent(model)}`);
      const data = await res.json();
      setYears(data.years ?? []);
    } catch {}
  };

  const allAgreed = agreements.length === 0 || agreements.every(a => agreedIds.has(a.agreement_id));

  const discounts      = cart?.prices?.discounts ?? [];
  const discountAmount = discounts.reduce((s, d) => s + Math.abs(d.amount.value), 0);
  const appliedTaxes   = cart?.prices?.applied_taxes ?? [];
  const calculatedVat  = appliedTaxes.length > 0 
    ? appliedTaxes.reduce((s, t) => s + t.amount.value, 0)
    : Math.round(subtotal * 0.05 * 100) / 100;
  const tok            = cartToken || undefined;

  const appliedCoupon = cart?.applied_coupons?.[0]?.code;

  const money = (v: number) => <Money value={v} currency={currency || "AED"} digits={2} />;

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function buildAddress() {
    return {
      firstname:    form.firstname || "Guest",
      lastname:     form.lastname || "User",
      company:      form.company || undefined,
      street:       [form.street || "Street address"],
      city:         form.city || "Dubai",
      postcode:     form.postcode || "00000",
      country_code: form.country_code || "AE",
      telephone:    form.telephone || "0500000000",
      region:       form.region || undefined,
    };
  }

  // Background fetch of shipping and payment methods when the address form has sufficient info
  useEffect(() => {
    if (!cartId) return;
    const isValidEmail = form.email && form.email.includes("@") && form.email.includes(".");
    const isAddressValid = form.firstname && form.lastname && form.street && form.city && form.telephone && isValidEmail;

    if (!isAddressValid) return;

    let active = true;
    const debouncer = setTimeout(async () => {
      setLoadingMethods(true);
      try {
        await api({ op: "setEmail", cartId, email: form.email, token: tok });
        if (!active) return;

        const shipRes = await api({ op: "setShippingAddress", cartId, address: buildAddress(), token: tok });
        if (!active) return;
        if (shipRes.error || !shipRes.cart) {
          console.error(shipRes.error);
          return;
        }

        const addr     = (shipRes.cart as Record<string, unknown>).shipping_addresses as { available_shipping_methods?: ShippingMethodOption[] }[] | undefined;
        const methods  = (addr?.[0]?.available_shipping_methods ?? []).filter((m) => m.available);
        const payments = ((shipRes.cart as Record<string, unknown>).available_payment_methods as { code: string; title: string }[]) ?? [];

        setShippingMethods(methods);
        setPaymentMethods(payments);

        // Auto select first shipping method if not selected
        if (methods.length > 0 && !selShipping) {
          setSelShipping(`${methods[0].carrier_code}|${methods[0].method_code}`);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoadingMethods(false);
      }
    }, 1000);

    return () => {
      active = false;
      clearTimeout(debouncer);
    };
  }, [form.email, form.firstname, form.lastname, form.street, form.city, form.telephone, form.country_code, form.region, form.company, cartId, tok]);

  // Handle manual Apply Coupon
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    setCouponError("");
    setCouponSuccess(false);
    try {
      const err = await applyCoupon(couponInput);
      if (err) {
        setCouponError(err);
      } else {
        setCouponSuccess(true);
        setCouponInput("");
      }
    } catch {
      setCouponError("Could not apply the coupon code.");
    }
  };

  // Handle manual Remove Coupon
  const handleRemoveCoupon = async () => {
    setCouponError("");
    setCouponSuccess(false);
    try {
      await removeCoupon();
    } catch {
      setCouponError("Could not remove the coupon code.");
    }
  };

  // Maps the selected UI payment choice to the actual Magento payment code
  const getSelectedPaymentCode = () => {
    if (selPayment === "card" || selPayment === "applepay") {
      const match = paymentMethods.find(p => p.code.toLowerCase().includes("tap") || p.code.toLowerCase().includes("checkout") || p.code.toLowerCase().includes("card") || p.code.toLowerCase().includes("pay"));
      return match?.code ?? "tap";
    }
    if (selPayment === "tabby") {
      const match = paymentMethods.find(p => p.code.toLowerCase().includes("tabby"));
      return match?.code ?? "tabby_installments";
    }
    if (selPayment === "tamara") {
      const match = paymentMethods.find(p => p.code.toLowerCase().includes("tamara"));
      return match?.code ?? "tamara_payin3";
    }
    return paymentMethods[0]?.code ?? "tap";
  };

  // Complete Checkout Placement
  async function handlePlaceOrder() {
    if (!cartId) return;

    if (!form.email || !form.email.includes("@")) {
      setError("Please enter a valid email address.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!form.firstname || !form.lastname) {
      setError("Please enter your first and last name.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!form.street || !form.city) {
      setError("Please enter your street address and city.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!form.telephone) {
      setError("Please enter your phone number.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!allAgreed) {
      setError("Please accept the terms and conditions.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setBusy(true);
    setError("");

    try {
      // 1. Set guest email
      const emailRes = await api({ op: "setEmail", cartId, email: form.email, token: tok });
      if (emailRes.error) throw new Error(String(emailRes.error));

      // 2. Set shipping address
      const shipRes = await api({ op: "setShippingAddress", cartId, address: buildAddress(), token: tok });
      if (shipRes.error) throw new Error(String(shipRes.error));

      // 3. Set shipping method
      let finalShipping = selShipping;
      if (!finalShipping) {
        const addr = (shipRes.cart as Record<string, unknown>)?.shipping_addresses as { available_shipping_methods?: ShippingMethodOption[] }[] | undefined;
        const methods = (addr?.[0]?.available_shipping_methods ?? []).filter((m) => m.available);
        if (methods.length > 0) {
          finalShipping = `${methods[0].carrier_code}|${methods[0].method_code}`;
        }
      }

      if (finalShipping) {
        const [carrier, method] = finalShipping.split("|");
        const smRes = await api({ op: "setShippingMethod", cartId, carrier, method, token: tok });
        if (smRes.error) throw new Error(String(smRes.error));
      }

      // 4. Set billing address
      const blRes = await api({ op: "setBilling", cartId, address: buildAddress(), token: tok });
      if (blRes.error) throw new Error(String(blRes.error));

      // 5. Set payment method
      const finalPaymentCode = getSelectedPaymentCode();
      const pmRes = await api({ op: "setPayment", cartId, code: finalPaymentCode, token: tok });
      if (pmRes.error) throw new Error(String(pmRes.error));

      // 6. Place order
      const ordRes = await api({ op: "placeOrder", cartId, token: tok });
      if (ordRes.error || !ordRes.orderNumber) throw new Error(String(ordRes.error) || "Order could not be placed.");

      const placedOrderNumber = String(ordRes.orderNumber);

      try {
        const completeRes = await ordersApi({
          op:     "completeOrder",
          cartId,
          id:     placedOrderNumber,
          token:  tok,
        });
        if (completeRes.order && !completeRes.error) {
          setOrderV2(completeRes.order as Record<string, unknown>);
        }
      } catch {
        // best-effort
      }

      setOrderNumber(placedOrderNumber);
      setStep("done");
      clearLocal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place the order. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  }

  /* ── Loading ─────────────────────────────────────────────────── */
  if (!ready) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          <div className="space-y-6">
            <div className="h-44 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-52 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  /* ── Empty cart ──────────────────────────────────────────────── */
  if (!cartId || items.length === 0) {
    return (
      <div className="container py-28 text-center max-w-sm mx-auto">
        <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-6 border border-gray-100">
          <ShoppingBag size={32} className="text-gray-300" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-3">
          Your cart is empty
        </h1>
        <p className="text-gray-400 text-sm mb-8">Add products to your cart before checking out.</p>
        <Link href="/" className="inline-block bg-black hover:bg-[#ed1c24] text-white font-black text-xs uppercase tracking-wider py-4 px-8 rounded-sm transition-colors">
          Start Shopping
        </Link>
      </div>
    );
  }

  /* ── Order placed ────────────────────────────────────────────── */
  if (step === "done" && orderNumber) {
    const v2Status   = orderV2?.status as string | undefined;
    const v2Email    = orderV2?.email  as string | undefined;
    const v2Total    = (orderV2?.total as { grand_total?: { value: number; currency: string } } | undefined)?.grand_total;
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
          <p className="text-gray-500 text-sm mb-4">Your order has been received and is being processed.</p>
          <div className="inline-block bg-gray-50 border border-gray-200 rounded-sm px-6 py-4 mb-4">
            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1">Order Number</p>
            <p className="text-xl font-black text-gray-900 font-mono">{orderNumber}</p>
          </div>
          {(v2Status || v2Email || v2Total) && (
            <div className="flex flex-col gap-1.5 mb-6 text-sm text-gray-500">
              {v2Status && (
                <p>Status: <span className="font-bold text-gray-800 capitalize">{v2Status.toLowerCase().replace(/_/g, " ")}</span></p>
              )}
              {v2Total && (
                <p>Total: <span className="font-bold text-gray-800"><Money value={v2Total.value} currency={v2Total.currency} digits={2} /></span></p>
              )}
              {v2Email && (
                <p>Confirmation sent to: <span className="font-bold text-gray-800">{v2Email}</span></p>
              )}
            </div>
          )}
          <Link href="/" className="inline-flex items-center gap-2 bg-black hover:bg-[#ed1c24] text-white font-black text-xs uppercase tracking-wider py-4 px-8 rounded-sm transition-colors">
            Continue Shopping <ArrowRight size={14} />
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="bg-[#f9fafb] min-h-screen pb-20 text-gray-900 font-sans">
      {/* Top Banner with tyre tread background */}
      <div
        className="relative bg-black py-10 sm:py-12 text-center"
        style={{
          backgroundImage: "url('/img/shopping-cart-banner.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-white uppercase font-sans">
            CHECKOUT
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-4 py-3 font-medium shadow-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-8 items-start">
          
          {/* ════════════════ LEFT COLUMN: FORMS ════════════════ */}
          <div className="space-y-6">
            
            {/* 1. ACCOUNT INFORMATION */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="bg-[#f0f2f5] px-5 py-3 border-b border-gray-200/80 flex items-center gap-2.5">
                <User className="w-4 h-4 text-gray-600" />
                <h2 className="font-extrabold text-xs uppercase tracking-wider text-gray-800">ACCOUNT INFORMATION</h2>
              </div>

              <div className="p-5 space-y-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Enter email address"
                    value={form.email}
                    onChange={set("email")}
                    className="w-full border border-gray-300/90 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all bg-white"
                  />
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    You can create an account after checkout.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. BILLING ADDRESS */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="bg-[#f0f2f5] px-5 py-3 border-b border-gray-200/80 flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-gray-600" />
                <h2 className="font-extrabold text-xs uppercase tracking-wider text-gray-800">BILLING ADDRESS</h2>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.firstname}
                      onChange={set("firstname")}
                      className="w-full border border-gray-300/90 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.lastname}
                      onChange={set("lastname")}
                      className="w-full border border-gray-300/90 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Company
                    </label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={set("company")}
                      className="w-full border border-gray-300/90 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.street}
                      onChange={set("street")}
                      className="w-full border border-gray-300/90 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="05XXXXXXXX"
                      value={form.telephone}
                      onChange={set("telephone")}
                      className="w-full border border-gray-300/90 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      City <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={form.city}
                        onChange={set("city")}
                        className="w-full border border-gray-300/90 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all appearance-none pr-9 cursor-pointer bg-white"
                      >
                        <option value="">Select City</option>
                        {UAE_CITIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sameAsShipping}
                      onChange={e => setSameAsShipping(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-black focus:ring-0 accent-black cursor-pointer"
                    />
                    <span className="text-xs text-gray-700 font-medium">
                      This address is also my shipping address
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* 3. VEHICLE INFORMATION */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="bg-[#f0f2f5] px-5 py-3 border-b border-gray-200/80 flex items-center gap-2.5">
                <Car className="w-4 h-4 text-gray-600" />
                <h2 className="font-extrabold text-xs uppercase tracking-wider text-gray-800">VEHICLE INFORMATION</h2>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Vehicle Plate
                  </label>
                  <input
                    type="text"
                    placeholder="Enter vehicle plate"
                    value={vehiclePlate}
                    onChange={e => setVehiclePlate(e.target.value)}
                    className="w-full sm:max-w-xs border border-gray-300/90 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Make</label>
                    <div className="relative">
                      <select
                        value={selectedMake}
                        onChange={e => handleMakeChange(e.target.value)}
                        className="w-full border border-gray-300/90 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all appearance-none pr-9 cursor-pointer bg-white"
                      >
                        <option value="">Select Make</option>
                        {makes.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Model</label>
                    <div className="relative">
                      <select
                        value={selectedModel}
                        onChange={e => handleModelChange(e.target.value)}
                        disabled={!selectedMake}
                        className="w-full border border-gray-300/90 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all appearance-none pr-9 disabled:bg-gray-50 disabled:cursor-not-allowed cursor-pointer bg-white"
                      >
                        <option value="">Select Model</option>
                        {models.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Year</label>
                    <div className="relative">
                      <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(e.target.value)}
                        disabled={!selectedModel}
                        className="w-full border border-gray-300/90 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all appearance-none pr-9 disabled:bg-gray-50 disabled:cursor-not-allowed cursor-pointer bg-white"
                      >
                        <option value="">Select Year</option>
                        {years.map(y => (
                          <option key={y.value} value={y.value}>{y.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. SHIPPING METHODS */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="bg-[#f0f2f5] px-5 py-3 border-b border-gray-200/80 flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-gray-600" />
                <h2 className="font-extrabold text-xs uppercase tracking-wider text-gray-800">SHIPPING METHODS</h2>
              </div>

              <div className="p-5">
                <div className="border-2 border-emerald-500 bg-emerald-50/60 rounded-xl p-4.5 text-center">
                  <div className="font-extrabold text-xs tracking-wider text-emerald-950 uppercase">
                    SELECTED INSTALLER
                  </div>
                  <div className="text-xs text-emerald-800 mt-1.5 font-medium">
                    {installation?.type === "branch" ? (
                      <>Installer: <span className="font-bold text-gray-900">{installation.branch?.name}</span> ({installation.date} {installation.time})</>
                    ) : installation?.type === "location" ? (
                      <>Mobile Van: <span className="font-bold text-gray-900">{installation.mobileAddress || "Doorstep Service"}</span> ({installation.date} {installation.time})</>
                    ) : (
                      <>Mode: Delivery – Without Fitment</>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. PAYMENT METHOD */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="bg-[#f0f2f5] px-5 py-3 border-b border-gray-200/80 flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-gray-600" />
                <h2 className="font-extrabold text-xs uppercase tracking-wider text-gray-800">PAYMENT METHOD</h2>
              </div>

              <div className="p-5 space-y-4">
                
                {/* Option 1: Credit/Debit Card – Pay Online */}
                <div className="space-y-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={selPayment === "card"}
                      onChange={() => setSelPayment("card")}
                      className="w-4 h-4 text-red-600 focus:ring-0 accent-red-600 cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm font-bold text-gray-900">
                      Credit/Debit Card – Pay Online
                    </span>
                  </label>
                  <p className="text-[11px] text-gray-500 pl-6.5">
                    You will be redirected to our partner&apos;s website, where you can safely pay.
                  </p>
                </div>

                {/* Option 2: Apple Pay */}
                <div>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={selPayment === "applepay"}
                      onChange={() => setSelPayment("applepay")}
                      className="w-4 h-4 text-red-600 focus:ring-0 accent-red-600 cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm font-bold text-gray-900">
                      Apple Pay
                    </span>
                  </label>
                </div>

                {/* Option 3: Tabby */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={selPayment === "tabby"}
                      onChange={() => setSelPayment("tabby")}
                      className="w-4 h-4 text-red-600 focus:ring-0 accent-red-600 cursor-pointer"
                    />
                    <span className="inline-flex items-center justify-center bg-[#29e798] text-black font-black text-[10px] px-2 py-0.5 rounded-full mr-1">
                      tabby
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-gray-900">
                      Tabby – Pay in installments
                    </span>
                  </label>

                  {/* Tabby promotional card */}
                  <div className="ml-6.5 border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center justify-center bg-[#29e798] text-black font-black text-[10px] px-2 py-0.5 rounded-full mb-1">
                        tabby
                      </div>
                      <div className="text-xs font-bold text-gray-900">
                        Split your purchase
                      </div>
                      <div className="text-[11px] text-gray-500">
                        into monthly payments
                      </div>
                      <button
                        type="button"
                        className="mt-2 text-[10px] font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 px-3 py-1 rounded-lg transition-colors shadow-2xs"
                      >
                        View options
                      </button>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-gray-600 font-medium">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>No processing fees</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Use any card</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Buyer protection</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Option 4: Tamara */}
                <div>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={selPayment === "tamara"}
                      onChange={() => setSelPayment("tamara")}
                      className="w-4 h-4 text-red-600 focus:ring-0 accent-red-600 cursor-pointer"
                    />
                    <span
                      className="inline-flex items-center justify-center text-white font-black text-[10px] px-2 py-0.5 rounded mr-1 shadow-2xs"
                      style={{ background: "linear-gradient(135deg, #b975f5 0%, #fa7c5c 100%)" }}
                    >
                      tamara
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-gray-900">
                      Tamara – Pay in installments
                    </span>
                  </label>
                </div>

                {/* Option 5: Pay via Payment Link */}
                <div>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_method"
                      checked={selPayment === "link"}
                      onChange={() => setSelPayment("link")}
                      className="w-4 h-4 text-red-600 focus:ring-0 accent-red-600 cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm font-bold text-gray-900">
                      Pay via Payment Link
                    </span>
                  </label>
                </div>

              </div>
            </div>

            {/* Terms & Conditions */}
            {agreements.length > 0 && (
              <div className="flex flex-col gap-2 p-4 bg-white border border-gray-200 rounded-xl shadow-2xs">
                {agreements.map(a => (
                  <label key={a.agreement_id} className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedIds.has(a.agreement_id)}
                      onChange={e => {
                        setAgreedIds(prev => {
                          const next = new Set(prev);
                          e.target.checked ? next.add(a.agreement_id) : next.delete(a.agreement_id);
                          return next;
                        });
                      }}
                      className="mt-0.5 accent-black w-4 h-4 rounded"
                    />
                    <span className="text-xs text-gray-600 font-medium leading-relaxed">
                      {a.checkbox_text}{" "}
                      <button
                        type="button"
                        onClick={() => setShowAgreement(a)}
                        className="text-red-600 underline font-bold"
                      >
                        Read terms
                      </button>
                    </span>
                  </label>
                ))}
              </div>
            )}

          </div>

          {/* ════════════════ RIGHT COLUMN: ORDER SUMMARY ════════════════ */}
          <div className="lg:sticky lg:top-8 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.05)] overflow-hidden">
              
              {/* Order summary header */}
              <div className="px-5 py-3.5 bg-[#f0f2f5] border-b border-gray-200/80 flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-gray-700" />
                <h2 className="font-extrabold text-xs uppercase tracking-wider text-gray-900">ORDER SUMMARY</h2>
              </div>

              {/* Items in Cart Accordion */}
              <div className="bg-white">
                <button
                  type="button"
                  onClick={() => setIsItemsListOpen(!isItemsListOpen)}
                  className="w-full flex items-center justify-between px-5 py-3 text-xs font-bold text-gray-800 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <span>{count} Items in Cart</span>
                  {isItemsListOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>

                {isItemsListOpen && (
                  <div className="divide-y divide-gray-100 max-h-[280px] overflow-y-auto px-5 py-2">
                    {items.map((it) => (
                      <div key={it.uid} className="flex items-center gap-3 py-3">
                        <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center p-1 shadow-2xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={it.product.thumbnail?.url ?? ""}
                            alt={it.product.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">
                            {it.product.name}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-black text-red-600">
                            {money(it.prices.row_total.value)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="bg-white px-5 py-4 border-t border-gray-100 space-y-2.5 text-xs">
                <div className="flex justify-between text-gray-700 font-medium">
                  <span>Cart Subtotal</span>
                  <span className="font-bold text-gray-900">{money(subtotal)}</span>
                </div>

                <div className="flex justify-between text-gray-700 font-medium">
                  <span>Additional Charge</span>
                  <span className="font-bold text-gray-900">{money(0)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>Discount</span>
                    <span>− {money(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-700 font-medium">
                  <span>VAT (5%)</span>
                  <span className="font-bold text-gray-900">{money(calculatedVat)}</span>
                </div>

                <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-100 pt-3">
                  <span>Order Total</span>
                  <span className="font-black text-gray-900">{money(grandTotal || (subtotal + calculatedVat))}</span>
                </div>
              </div>

            </div>

            {/* Accordion 1: Use Coupon Code */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => setIsCouponOpen(!isCouponOpen)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-gray-800 hover:bg-gray-50 transition-colors"
              >
                <span>Use Coupon Code</span>
                {isCouponOpen ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
              </button>

              {isCouponOpen && (
                <div className="p-4 bg-gray-50/60 border-t border-gray-100">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-[11px] text-gray-500 font-medium">Applied Code</p>
                        <p className="text-xs font-bold text-emerald-800">{appliedCoupon}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[11px] font-bold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={e => setCouponInput(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:border-black bg-white"
                      />
                      <button
                        type="submit"
                        className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </form>
                  )}
                  {couponError && <p className="text-[11px] text-red-600 font-medium mt-1.5">{couponError}</p>}
                  {couponSuccess && <p className="text-[11px] text-emerald-600 font-medium mt-1.5">Coupon applied!</p>}
                </div>
              )}
            </div>

            {/* Accordion 2: Comments */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-gray-800 hover:bg-gray-50 transition-colors"
              >
                <span>Do you have any comments regarding the order?</span>
                {isCommentsOpen ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
              </button>

              {isCommentsOpen && (
                <div className="p-4 bg-gray-50/60 border-t border-gray-100">
                  <textarea
                    rows={3}
                    placeholder="Enter notes or special requests..."
                    value={orderComments}
                    onChange={e => setOrderComments(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-xs text-gray-900 outline-none focus:border-black resize-none bg-white"
                  />
                </div>
              )}
            </div>

            {/* PLACE ORDER Button */}
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={busy || items.length === 0}
              className="w-full bg-black hover:bg-red-600 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider py-4 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Placing Order…
                </>
              ) : (
                "PLACE ORDER"
              )}
            </button>

          </div>

        </div>
      </div>

      {/* Agreement Modal */}
      {showAgreement && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-800">{showAgreement.name}</h3>
              <button onClick={() => setShowAgreement(null)} className="text-gray-400 hover:text-gray-900 text-2xl leading-none">&times;</button>
            </div>
            <div className="px-5 py-4 overflow-y-auto flex-1 text-sm text-gray-700 leading-relaxed">
              {showAgreement.is_html
                ? <div dangerouslySetInnerHTML={{ __html: showAgreement.content }} />
                : <p className="whitespace-pre-wrap">{showAgreement.content}</p>
              }
            </div>
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  setAgreedIds(prev => new Set(prev).add(showAgreement.agreement_id));
                  setShowAgreement(null);
                }}
                className="w-full bg-black text-white font-black text-xs uppercase tracking-wider py-3 rounded-lg hover:bg-red-600 transition-colors"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

