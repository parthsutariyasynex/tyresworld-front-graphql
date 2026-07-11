"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight, CheckCircle, ShoppingBag, Loader2,
  MapPin, Truck, CreditCard, ChevronRight, FileText, Wrench,
  User, Car, Lock, ChevronDown, ChevronUp, Percent, MessageSquare, Check
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import type { ShippingMethodOption } from "@/lib/types";
import { Money } from "@/components/Price";

type Country = { id: string; full_name_english: string; available_regions?: { id: number; code: string; name: string }[] };
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
  email: "", firstname: "", lastname: "",
  street: "", city: "", region: "", postcode: "", telephone: "",
  country_code: "SA",
};

/* ─── Main page ──────────────────────────────────────────────────── */
export default function CheckoutPage() {
  const { cartId, cartToken, items, count, subtotal, grandTotal, currency, cart, ready, applyCoupon, removeCoupon, clearLocal } = useCart();

  const [form,            setForm]            = useState({ ...EMPTY_FORM });
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodOption[]>([]);
  const [paymentMethods,  setPaymentMethods]  = useState<{ code: string; title: string }[]>([]);
  const [selShipping,     setSelShipping]     = useState("");   // "carrier|method"
  const [selPayment,      setSelPayment]      = useState("tap"); // default is tap card payment
  const [busy,            setBusy]            = useState(false);
  const [loadingMethods,  setLoadingMethods]  = useState(false);
  const [error,           setError]           = useState("");
  const [orderNumber,     setOrderNumber]     = useState<string | null>(null);
  const [countries,       setCountries]       = useState<Country[]>([]);
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
  const [tamaraSubOption, setTamaraSubOption] = useState<"split" | "full">("split");
  const [showTamaraModal, setShowTamaraModal] = useState(false);

  // Vehicle states
  const [vehiclePlate,   setVehiclePlate]    = useState("");
  const [selectedMake,   setSelectedMake]    = useState("");
  const [selectedModel,  setSelectedModel]   = useState("");
  const [selectedYear,   setSelectedYear]    = useState("");
  const [makes,          setMakes]           = useState<{ label: string; value: string }[]>([]);
  const [models,         setModels]          = useState<{ label: string; value: string }[]>([]);
  const [years,          setYears]           = useState<{ label: string; value: string }[]>([]);

  const [installation,   setInstallation]    = useState<any>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("selected_installation");
      if (saved) setInstallation(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }

    fetch("/api/countries")
      .then(r => r.json())
      .then(d => { if (d.countries?.length) setCountries(d.countries as Country[]); })
      .catch(() => {});
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
  const selectedCountry = countries.find(c => c.id === form.country_code);

  const discounts      = cart?.prices?.discounts ?? [];
  const discountAmount = discounts.reduce((s, d) => s + Math.abs(d.amount.value), 0);
  const appliedTaxes   = cart?.prices?.applied_taxes ?? [];
  const totalTax       = appliedTaxes.reduce((s, t) => s + t.amount.value, 0);
  const tok            = cartToken || undefined;

  const appliedCoupon = cart?.applied_coupons?.[0]?.code;

  const money = (v: number) => <Money value={v} currency={currency} digits={2} />;

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function buildAddress() {
    return {
      firstname:    form.firstname || "Guest",
      lastname:     form.lastname || "User",
      street:       [form.street || "Street address"],
      city:         form.city || "City",
      postcode:     form.postcode || "00000",
      country_code: form.country_code || "SA",
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
  }, [form.email, form.firstname, form.lastname, form.street, form.city, form.telephone, form.country_code, form.region, cartId, tok]);

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
    if (selPayment === "tap") {
      const match = paymentMethods.find(p => p.code.toLowerCase().includes("tap") || p.code.toLowerCase().includes("checkout") || p.code.toLowerCase().includes("pay"));
      return match?.code ?? "tap";
    }
    if (selPayment === "cashondelivery") {
      const match = paymentMethods.find(p => p.code.toLowerCase().includes("cash") || p.code.toLowerCase().includes("cod"));
      return match?.code ?? "cashondelivery";
    }
    if (selPayment === "tamara") {
      const match = paymentMethods.find(p => p.code.toLowerCase().includes("tamara"));
      return match?.code ?? "tamara_payin3";
    }
    if (selPayment === "emkan") {
      const match = paymentMethods.find(p => p.code.toLowerCase().includes("emkan"));
      return match?.code ?? "emkan_payment";
    }
    return selPayment;
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

      // 3. Set shipping method (use selected installer or first available method)
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

      // 7. completeOrder — fetches enriched order details (status, token, totals)
      //    after placeOrder succeeds. Failure is non-fatal: the order is already placed.
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
        // best-effort — order already placed, ignore completeOrder failure
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
      <>
        {/* Breadcrumb / Title Skeleton */}
        <div className="bg-white border-b border-gray-100 py-6 mb-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
            {/* Left Column Skeletons */}
            <div className="space-y-8">
              {/* Card 1: Account Information Skeleton */}
              <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-4">
                  <div className="h-12 w-full bg-gray-100 rounded-lg animate-pulse" />
                  <div className="h-3 w-12 bg-gray-200 rounded animate-pulse mx-auto" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Card 2: Vehicle Lookup Skeleton */}
              <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
                      <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
                      <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
                      <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Card 3: Shipping Address Skeleton */}
              <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                    <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Card 4: Shipping Methods Skeleton */}
              <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-20 w-full bg-gray-50 rounded-lg animate-pulse" />
              </div>

              {/* Card 5: Payment Method Skeleton */}
              <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="h-14 w-full bg-gray-50 rounded-lg animate-pulse border border-gray-100" />
                  <div className="h-14 w-full bg-gray-50 rounded-lg animate-pulse border border-gray-100" />
                  <div className="h-14 w-full bg-gray-50 rounded-lg animate-pulse border border-gray-100" />
                  <div className="h-14 w-full bg-gray-50 rounded-lg animate-pulse border border-gray-100" />
                </div>
              </div>
            </div>

            {/* Right Column (Sidebar) Skeleton */}
            <div className="space-y-6">
              <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-6">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between">
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-3">
                    <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </>
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
    <>
      {/* Black header banner */}
      <div className="bg-black py-12 text-center">
        <div className="container">
          <p className="text-xs text-white/40 mb-2 uppercase tracking-widest font-medium">
            <Link href="/cart" className="hover:text-white transition-colors">Cart</Link>
            {" / "}Checkout
          </p>
          <h1 className="text-3xl font-black uppercase tracking-wider text-white">CHECKOUT</h1>
        </div>
      </div>

      <div className="container py-10 lg:py-14">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12 items-start">
          {/* ── Left: form ─────────────────────────────────────── */}
          <div className="space-y-8">
            
            {/* 1. ACCOUNT INFORMATION */}
            <div className="bg-white">
              <div className="bg-[#f3f4f6] px-4 py-3 rounded-lg flex items-center gap-3 mb-5">
                <User className="w-5 h-5 text-gray-500" />
                <h2 className="font-extrabold text-sm uppercase tracking-wider text-gray-800">ACCOUNT INFORMATION</h2>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-700">Email Address <span className="text-[#ed1c24]">*</span></label>
                  <input
                    type="email"
                    required
                    placeholder="Enter email address"
                    value={form.email}
                    onChange={set("email")}
                    className="border border-gray-200 bg-white rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-gray-800 transition-colors w-full"
                  />
                  <p className="text-xs text-gray-400 mt-1">You can create an account after checkout.</p>
                </div>
                <div>
                  <button
                    type="button"
                    className="flex items-center gap-3 border border-red-500 bg-[#ed1c24] text-white font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.136 4.2a5.955 5.955 0 0 1-5.99-5.95 5.956 5.956 0 0 1 5.99-5.95c1.478 0 2.82.52 3.882 1.39l3.146-3.14C18.99 3.01 15.82 1.8 12.24 1.8 6.578 1.8 2 6.37 2 12s4.578 10.2 10.24 10.2c5.922 0 9.85-4.14 9.85-10.02 0-.6-.06-1.3-.18-1.895H12.24Z"
                        />
                      </svg>
                    </div>
                    Sign in with Google
                  </button>
                </div>
              </div>
            </div>

            {/* 2. SHIPPING ADDRESS */}
            <div className="bg-white">
              <div className="bg-[#f3f4f6] px-4 py-3 rounded-lg flex items-center gap-3 mb-5">
                <MapPin className="w-5 h-5 text-gray-500" />
                <h2 className="font-extrabold text-sm uppercase tracking-wider text-gray-800">SHIPPING ADDRESS</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-700">First Name <span className="text-[#ed1c24]">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.firstname}
                    onChange={set("firstname")}
                    className="border border-gray-200 bg-white rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-gray-800 transition-colors w-full"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-700">Last Name <span className="text-[#ed1c24]">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.lastname}
                    onChange={set("lastname")}
                    className="border border-gray-200 bg-white rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-gray-800 transition-colors w-full"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-700">Street Address <span className="text-[#ed1c24]">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.street}
                    onChange={set("street")}
                    className="border border-gray-200 bg-white rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-gray-800 transition-colors w-full"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-700">Country <span className="text-[#ed1c24]">*</span></label>
                  <div className="relative">
                    <select
                      value={form.country_code}
                      onChange={e => setForm(f => ({ ...f, country_code: e.target.value, region: "" }))}
                      className="border border-gray-200 bg-white rounded-lg px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-800 transition-colors w-full appearance-none pr-10"
                    >
                      {countries.length === 0 && <option value="SA">Saudi Arabia</option>}
                      {countries.map(c => (
                        <option key={c.id} value={c.id}>{c.full_name_english}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-700">City <span className="text-[#ed1c24]">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={set("city")}
                    className="border border-gray-200 bg-white rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-gray-800 transition-colors w-full"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-700">Mobile Number <span className="text-[#ed1c24]">*</span></label>
                  <input
                    type="tel"
                    required
                    placeholder="05XXXXXXXX"
                    value={form.telephone}
                    onChange={set("telephone")}
                    className="border border-gray-200 bg-white rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-gray-800 transition-colors w-full"
                  />
                </div>
              </div>
            </div>

            {/* 3. VEHICLE INFORMATION */}
            <div className="bg-white">
              <div className="bg-[#f3f4f6] px-4 py-3 rounded-lg flex items-center gap-3 mb-5">
                <Car className="w-5 h-5 text-gray-500" />
                <h2 className="font-extrabold text-sm uppercase tracking-wider text-gray-800">VEHICLE INFORMATION</h2>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-700">Vehicle Plate</label>
                  <input
                    type="text"
                    placeholder="Enter vehicle plate"
                    value={vehiclePlate}
                    onChange={e => setVehiclePlate(e.target.value)}
                    className="border border-gray-200 bg-white rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 outline-none focus:border-gray-800 transition-colors w-full"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-gray-700">Make</label>
                    <div className="relative">
                      <select
                        value={selectedMake}
                        onChange={e => handleMakeChange(e.target.value)}
                        className="border border-gray-200 bg-white rounded-lg px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-800 transition-colors w-full appearance-none pr-10"
                      >
                        <option value="">Select Make</option>
                        {makes.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-gray-700">Model</label>
                    <div className="relative">
                      <select
                        value={selectedModel}
                        onChange={e => handleModelChange(e.target.value)}
                        disabled={!selectedMake}
                        className="border border-gray-200 bg-white rounded-lg px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-800 transition-colors w-full appearance-none pr-10 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Model</option>
                        {models.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-gray-700">Year</label>
                    <div className="relative">
                      <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(e.target.value)}
                        disabled={!selectedModel}
                        className="border border-gray-200 bg-white rounded-lg px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-800 transition-colors w-full appearance-none pr-10 disabled:bg-gray-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Year</option>
                        {years.map(y => (
                          <option key={y.value} value={y.value}>{y.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. SHIPPING METHODS */}
            <div className="bg-white">
              <div className="bg-[#f3f4f6] px-4 py-3 rounded-lg flex items-center gap-3 mb-5">
                <Truck className="w-5 h-5 text-gray-500" />
                <h2 className="font-extrabold text-sm uppercase tracking-wider text-gray-800">SHIPPING METHODS</h2>
              </div>
              {loadingMethods ? (
                <div className="h-20 w-full bg-gray-50 rounded-lg animate-pulse border border-gray-100" />
              ) : installation ? (
                <div className="bg-[#f4faf6] border border-[#d3eedd] rounded-lg p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#e3f4ec] flex items-center justify-center text-[#1e5c37] shrink-0">
                    <MapPin size={20} className="stroke-[2.5]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-[#1e5c37] text-xs tracking-wider uppercase mb-1">
                      SELECTED INSTALLER
                    </h4>
                    <p className="text-[#2b6f48] text-sm font-semibold leading-relaxed">
                      {installation.type === "branch" && (
                        <>
                          Installer: <span className="font-bold text-gray-900">{installation.branch?.name}</span>
                          <br />
                          Date: <span className="text-gray-900">{installation.date}</span> Time: <span className="text-gray-900">{installation.time}</span>
                        </>
                      )}
                      {installation.type === "location" && (
                        <>
                          Installer: <span className="font-bold text-gray-900">Mobile Fitment Service</span>
                          <br />
                          Address: <span className="text-gray-900">{installation.mobileAddress || "Your address"}</span>
                          <br />
                          Date: <span className="text-gray-900">{installation.date}</span> Time: <span className="text-gray-900">{installation.time}</span>
                        </>
                      )}
                      {installation.type === "delivery" && (
                        <>
                          Home Delivery (Free Shipping)
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm italic p-4 bg-gray-50 rounded-lg border border-gray-100">
                  No installation service selected. You can select one on the Store Locator page.
                </div>
              )}
            </div>

            {/* 5. PAYMENT METHOD */}
            <div className="bg-white">
              <div className="bg-[#f3f4f6] px-4 py-3 rounded-lg flex items-center gap-3 mb-5">
                <CreditCard className="w-5 h-5 text-gray-500" />
                <h2 className="font-extrabold text-sm uppercase tracking-wider text-gray-800">PAYMENT METHOD</h2>
              </div>
              {loadingMethods ? (
                <div className="space-y-3">
                  <div className="h-14 w-full bg-gray-50 rounded-lg animate-pulse border border-gray-100" />
                  <div className="h-14 w-full bg-gray-50 rounded-lg animate-pulse border border-gray-100" />
                  <div className="h-14 w-full bg-gray-50 rounded-lg animate-pulse border border-gray-100" />
                  <div className="h-14 w-full bg-gray-50 rounded-lg animate-pulse border border-gray-100" />
                </div>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                  {/* 1. Tap — Apple Pay / Credit / Debit / Tabby */}
                  <label className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${selPayment === "tap" ? "bg-red-50/30" : "bg-white hover:bg-gray-50"}`}>
                    <input
                      type="radio"
                      name="payment_choice"
                      checked={selPayment === "tap"}
                      onChange={() => setSelPayment("tap")}
                      className="accent-[#ed1c24] w-4 h-4 shrink-0"
                    />
                    <span className="shrink-0 border border-gray-300 rounded px-1.5 py-0.5 text-[11px] font-bold text-gray-600 bg-white">tap</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <svg width="32" height="20" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="32" height="20" rx="3" fill="#1A1F71"/>
                        <path d="M13.5 6l-1.5 8h-2l1.5-8h2zm6.5 0c-.4-.9-1.1-1.2-2-1.2-1.6 0-2.6.9-2.6 1.9 0 1.4 1.8 1.5 1.8 2.2s-.9 1-1.6 1c-.9 0-1.5-.4-1.8-.8l-.4 2.1c.5.2 1.2.5 2 .5 2.3 0 3.4-1.1 3.4-2.4-.1-1.9-3-2-3-2.9 0-.3.4-.7.9-.7.6 0 1 .2 1.3.6l.3-1.8zM8.4 6L6 12.2l-.2-1c-.4-1.2-1-2.4-1.9-2.9L5.7 14H7.8l3-8H8.4zm17 0h-1.6c-.5 0-.9.3-1.1.8L21 14h2l.4-1.2h2.5l.2 1.2H28L26.4 6H23zm.6 5l.8-2.1.8 2.1h-1.6z" fill="white"/>
                      </svg>
                      <svg width="32" height="20" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="32" height="20" rx="3" fill="#252525"/>
                        <circle cx="13" cy="10" r="6" fill="#EB001B"/>
                        <circle cx="19" cy="10" r="6" fill="#F79E1B"/>
                        <path d="M16 5.5a6 6 0 010 9 6 6 0 010-9z" fill="#FF5F00"/>
                      </svg>
                      <svg width="32" height="20" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="32" height="20" rx="3" fill="#016FD0"/>
                        <path d="M5 7h3l1 2.5L10 7h3l-2.5 6H8L5 7zm10 0h5v1.5h-3.5v1h3.4V11h-3.4v1H20V13h-5V7zm7 0h2l2 4 2-4h2l-3 6h-2L22 7z" fill="white"/>
                      </svg>
                      <div className="border border-gray-300 rounded px-1.5 py-0.5 leading-tight text-center">
                        <div className="text-[8px] font-bold text-gray-500 leading-none">and</div>
                        <div className="text-[8px] font-bold text-gray-500 leading-none">more</div>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-800 text-sm">Apple Pay / Credit Card / Debit Card / Tabby</span>
                  </label>
                  <label className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${selPayment === "cashondelivery" ? "bg-red-50/30" : "bg-white hover:bg-gray-50"}`}>
                    <input
                      type="radio"
                      name="payment_choice"
                      checked={selPayment === "cashondelivery"}
                      onChange={() => setSelPayment("cashondelivery")}
                      className="accent-[#ed1c24] w-4 h-4 shrink-0"
                    />
                    <span className="font-semibold text-gray-800 text-sm">Cash payment after fitting/delivery</span>
                  </label>
                  <div>
                    <label className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${selPayment === "tamara" ? "bg-red-50/30" : "bg-white hover:bg-gray-50"}`}>
                      <input
                        type="radio"
                        name="payment_choice"
                        checked={selPayment === "tamara"}
                        onChange={() => setSelPayment("tamara")}
                        className="accent-[#ed1c24] w-4 h-4 shrink-0"
                      />
                      <div className="shrink-0 px-2.5 py-1 rounded-lg font-black text-sm text-white select-none" style={{background: "linear-gradient(135deg, #b975f5 0%, #7c5cfa 50%, #5b85fa 100%)"}}>
                        tamara
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-gray-800 text-sm block">Tamara - Pay in installments</span>
                        <span className="text-xs text-gray-400">Split in 4 payments - No late fees, Sharia compliant</span>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-white text-[9px] font-extrabold" style={{background: "linear-gradient(135deg, #b975f5, #7c5cfa)"}}>
                        tamara
                      </span>
                    </label>
                    {selPayment === "tamara" && (
                      <div className="border-t border-gray-100 bg-white">
                        <button
                          type="button"
                          onClick={() => { setTamaraSubOption("split"); setShowTamaraModal(true); }}
                          className="w-full flex items-center justify-between px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Check className={`w-4 h-4 ${tamaraSubOption === "split" ? "text-[#7c5cfa]" : "text-gray-300"}`} />
                            <span className="text-sm font-semibold text-gray-800">Split in 4 payments</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setTamaraSubOption("full"); setShowTamaraModal(true); }}
                          className="w-full flex items-center justify-between px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Check className={`w-4 h-4 ${tamaraSubOption === "full" ? "text-[#7c5cfa]" : "text-gray-300"}`} />
                            <span className="text-sm font-semibold text-gray-800">Pay in full</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                        <div className="flex flex-wrap items-center gap-5 px-4 py-3 text-[11px] text-gray-400">
                          <div className="flex items-center gap-1.5 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Sharia-compliant, No late fees!
                          </div>
                          <div className="flex items-center gap-1.5 font-medium">
                            <Lock className="w-3.5 h-3.5" />
                            Card information 100% secure
                          </div>
                          <div className="flex items-center gap-1.5 font-medium">
                            <User className="w-3.5 h-3.5" />
                            Eligible for ages 18+
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${selPayment === "emkan" ? "bg-red-50/30" : "bg-white hover:bg-gray-50"}`}>
                      <input
                        type="radio"
                        name="payment_choice"
                        checked={selPayment === "emkan"}
                        onChange={() => setSelPayment("emkan")}
                        className="accent-[#ed1c24] w-4 h-4 shrink-0"
                      />
                      <span className="shrink-0 font-black text-sm tracking-widest text-gray-900 select-none">EMKΛN</span>
                      <span className="font-semibold text-gray-800 text-sm">Emkan - Payment Gateway</span>
                    </label>
                    {selPayment === "emkan" && (
                      <div className="border-t border-gray-100 bg-gray-50 mx-4 mb-4 rounded-lg p-4 border-l-4 border-l-blue-600">
                        <p className="font-bold text-gray-900 text-sm mb-1.5">Split your payment into easy installments</p>
                        <p className="text-xs text-gray-500 font-medium">Up to 5 monthly installments</p>
                        <p className="text-xs text-gray-500 font-medium">Processing fee: 2.5%</p>
                        <p className="text-xs font-bold text-gray-800 mt-1">~{money(grandTotal / 5)} /month</p>
                        <p className="text-xs text-gray-400 mt-2">You will be redirected to Emkan Finance to complete your payment.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Terms & Conditions checkboxes */}
            {agreements.length > 0 && (
              <div className="flex flex-col gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-[11px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-2 mb-1">
                  <FileText size={12} /> Terms &amp; Conditions
                </p>
                {agreements.map(a => (
                  <label key={a.agreement_id} className="flex items-start gap-3 cursor-pointer">
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
                      className="mt-0.5 accent-[#ed1c24] flex-shrink-0 w-4 h-4"
                    />
                    <span className="text-xs text-gray-600 font-medium">
                      {a.checkbox_text}{" "}
                      <button
                        type="button"
                        onClick={() => setShowAgreement(a)}
                        className="text-[#ed1c24] underline font-bold"
                      >
                        Read more
                      </button>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: order summary ────────────────────────────── */}
          <div className="lg:sticky lg:top-[90px] space-y-4">
            <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {/* Summary header */}
              <div className="bg-gray-100 border-b border-gray-200 px-5 py-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-gray-500" />
                <h2 className="text-sm font-black uppercase tracking-wider text-gray-800">Order Summary</h2>
              </div>

              {/* Items List Accordion Header */}
              <button
                type="button"
                onClick={() => setIsItemsListOpen(!isItemsListOpen)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <span className="text-xs font-bold text-gray-700">{count} Items in Cart</span>
                {isItemsListOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              {/* Items list */}
              {isItemsListOpen && (
                <div className="divide-y divide-gray-100 max-h-[280px] overflow-y-auto bg-white">
                  {items.map((it) => (
                    <div key={it.uid} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-12 h-12 bg-white border border-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={it.product.thumbnail?.url ?? ""}
                          alt={it.product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-gray-900 leading-snug line-clamp-2">{it.product.name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Qty: {it.quantity}</p>
                      </div>
                      <span className="text-[13px] font-black text-[#ed1c24] whitespace-nowrap">
                        {money(it.prices.row_total.value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Price breakdown */}
              <div className="px-5 py-5 border-t border-gray-200 bg-[#fdfdfd] flex flex-col gap-3">
                <div className="flex justify-between text-sm text-gray-600 font-medium">
                  <span>Cart Subtotal</span>
                  <span className="font-bold text-gray-900">{money(subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm text-gray-600 font-medium">
                  <span>Delivery Charges</span>
                  <span className="font-bold text-gray-900">{money(0)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-[#ed1c24] font-bold">
                    <span>Discount</span>
                    <span>− {money(discountAmount)}</span>
                  </div>
                )}

                {appliedTaxes.length > 0 ? appliedTaxes.map((tax) => (
                  <div key={tax.label} className="flex justify-between text-sm text-gray-600 font-medium">
                    <span>{tax.label}</span>
                    <span className="font-bold text-gray-900">{money(tax.amount.value)}</span>
                  </div>
                )) : (
                  <div className="flex justify-between text-sm text-gray-600 font-medium">
                    <span>VAT (15%)</span>
                    <span className="font-bold text-gray-900">{money(totalTax)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[16px] font-black text-gray-900 border-t border-gray-200 pt-3">
                  <span>Order Total</span>
                  <span className="text-[#ed1c24]">{money(grandTotal)}</span>
                </div>
              </div>

              {/* Accordion: Coupon Code */}
              <div className="border-t border-gray-100 bg-white">
                <button
                  type="button"
                  onClick={() => setIsCouponOpen(!isCouponOpen)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
                    <Percent size={13} className="text-gray-400" />
                    Use Coupon Code
                  </span>
                  {isCouponOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {isCouponOpen && (
                  <div className="p-4 bg-gray-50/50">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Active Code</p>
                          <p className="text-xs font-bold text-emerald-800">{appliedCoupon}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-[10px] font-bold text-red-600 hover:underline uppercase tracking-wider"
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
                          className="border border-gray-200 bg-white rounded-lg px-3 py-2 text-xs text-gray-900 placeholder:text-gray-300 outline-none focus:border-gray-800 flex-1"
                        />
                        <button
                          type="submit"
                          className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#ed1c24] transition-colors"
                        >
                          Apply
                        </button>
                      </form>
                    )}
                    {couponError && <p className="text-[11px] text-red-600 font-medium mt-1.5">{couponError}</p>}
                    {couponSuccess && <p className="text-[11px] text-emerald-600 font-medium mt-1.5">Coupon applied successfully!</p>}
                  </div>
                )}
              </div>

              {/* Accordion: Order Comments */}
              <div className="border-t border-gray-100 bg-white">
                <button
                  type="button"
                  onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
                    <MessageSquare size={13} className="text-gray-400" />
                    Do you have any comments regarding the order?
                  </span>
                  {isCommentsOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {isCommentsOpen && (
                  <div className="p-4 bg-gray-50/50">
                    <textarea
                      rows={3}
                      placeholder="Add comments here..."
                      value={orderComments}
                      onChange={e => setOrderComments(e.target.value)}
                      className="w-full border border-gray-200 bg-white rounded-lg p-3 text-xs text-gray-900 placeholder:text-gray-300 outline-none focus:border-gray-800 resize-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* PLACE ORDER button */}
            <button
              onClick={handlePlaceOrder}
              disabled={busy || items.length === 0}
              className="w-full bg-black text-white font-black text-sm uppercase tracking-wider py-4 rounded-xl hover:bg-[#ed1c24] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Tamara Modal */}
      {showTamaraModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowTamaraModal(false)}>
          <div
            className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden min-h-0"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
              <div />
              <div className="px-3 py-1.5 rounded-xl font-black text-base text-white" style={{background: "linear-gradient(135deg, #b975f5 0%, #7c5cfa 50%, #5b85fa 100%)"}}>
                tamara
              </div>
              <button
                onClick={() => setShowTamaraModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-scroll flex-1 min-h-0 px-5 pb-6">
              {/* Hero */}
              <h2 className="text-2xl font-black text-gray-900 text-center leading-tight mt-2 mb-6">
                Your payment,<br />your pace
              </h2>

              {/* Example plans */}
              <p className="text-sm text-gray-500 text-center mb-3 font-medium">Example plans</p>
              <div className="space-y-2 mb-6">
                {[
                  { months: 2,  badge: "2 Payments",  available: true },
                  { months: 3,  badge: "3 Payments",  available: true },
                  { months: 4,  badge: "4 Payments",  available: true },
                  { months: 6,  badge: "6 Payments",  available: false },
                  { months: 9,  badge: "9 Payments",  available: false },
                  { months: 12, badge: "12 Payments", available: false },
                ].map(plan => (
                  <div key={plan.months} className="border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3.5">
                      <div>
                        <p className="font-bold text-gray-900 text-base">
                          <span className="text-sm mr-0.5 font-black">₩</span>
                          {money(grandTotal / plan.months)}/mo
                        </p>
                        <p className="text-xs font-semibold text-[#0ea76a] mt-0.5">No fees</p>
                      </div>
                      <span className="text-xs font-bold text-[#9b59f5] bg-[#f3ebff] px-2.5 py-1 rounded-full">{plan.badge}</span>
                    </div>
                    {!plan.available && (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-400 flex items-center justify-center shrink-0">
                          <div className="w-1.5 h-0.5 bg-gray-400 rounded" />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">This payment plan is currently unavailable at this store</span>
                      </div>
                    )}
                  </div>
                ))}
                {/* Pay in Full */}
                <div className="border border-gray-200 rounded-2xl px-4 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 text-base">
                      <span className="text-sm mr-0.5 font-black">₩</span>
                      {money(grandTotal)}
                    </p>
                    <p className="text-xs font-semibold text-[#0ea76a] mt-0.5">No fees</p>
                  </div>
                  <span className="text-xs font-bold text-[#9b59f5] bg-[#f3ebff] px-2.5 py-1 rounded-full">Pay in Full</span>
                </div>
              </div>

              {/* How it works */}
              <div className="mb-6">
                <h3 className="text-lg font-black text-gray-900 mb-4">How it works?</h3>
                <div className="space-y-4">
                  {[
                    { n: 1, title: "Pick a plan that works for you", desc: "Choose Tamara at checkout and select the payment plan that fits your needs." },
                    { n: 2, title: "Pay your first payment securely", desc: "Enter your card details to make your first payment safely and instantly." },
                    { n: 3, title: "Stay in control", desc: "Track and manage all your upcoming payments easily in the Tamara app." },
                    { n: 4, title: "We've got your back", desc: "Get helpful reminders before each payment, no surprises." },
                  ].map(step => (
                    <div key={step.n} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center shrink-0 text-sm font-bold text-gray-600">
                        {step.n}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{step.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Why Tamara */}
              <div className="bg-[#f0f4ff] rounded-2xl p-5 mb-5">
                <h3 className="text-base font-black text-gray-900 text-center mb-4">Why Tamara?</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-[#0ea76a] flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="white"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="white" strokeWidth="2" strokeLinecap="round"/><path d="M9 20l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <p className="text-xs font-bold text-gray-700 leading-tight">100% buyer protection</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-[#0ea76a] flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3L4 7v5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V7l-8-4z" fill="white" fillOpacity="0.9"/><path d="M9 12l2 2 4-4" stroke="#0ea76a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <p className="text-xs font-bold text-gray-700 leading-tight">Sharia compliant</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-[#d946ef] flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" stroke="white" strokeWidth="2"/><path d="M3 10h18" stroke="white" strokeWidth="2"/><path d="M7 15h2M11 15h2" stroke="white" strokeWidth="2" strokeLinecap="round"/><path d="M17 13l-2 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </div>
                    <p className="text-xs font-bold text-gray-700 leading-tight">No late fees</p>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-gray-400 leading-relaxed mb-4">
                Payment plans shown are estimates. Actual offers may vary based on your eligibility and order details. Not all merchants or products qualify for every plan, including Tamara's long-term financing options. Approval is subject to eligibility checks and may require a down payment. Final terms, including monthly payment amounts, may change after checkout review and may exclude taxes, shipping, or other charges. For more information, see our{" "}
                <span className="text-[#7c5cfa] underline cursor-pointer">Terms & Conditions</span>.
              </p>

              {/* Card icons */}
              <div className="flex items-center justify-center gap-2">
                {/* Visa */}
                <svg width="38" height="24" viewBox="0 0 38 24" rx="3" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="38" height="24" rx="3" fill="#F8F8F8" stroke="#E0E0E0"/><path d="M16 7l-2 10h-2.5l2-10H16zm8.5 0c-.5-1.1-1.4-1.5-2.5-1.5-2 0-3.3 1.1-3.3 2.4 0 1.7 2.3 1.8 2.3 2.8s-1 1.2-1.9 1.2c-1.1 0-1.9-.5-2.2-1l-.5 2.6c.6.3 1.5.6 2.5.6 2.9 0 4.3-1.3 4.3-3-.1-2.4-3.8-2.5-3.8-3.6 0-.4.4-.9 1.1-.9.7 0 1.2.3 1.5.8l.5-2.4zM10.6 7L7.5 15l-.3-1.2c-.4-1.5-1.3-3-2.4-3.7L7.4 17H10l3.9-10h-3.3zm21 0h-2c-.6 0-1.1.4-1.3 1L26 17h2.5l.5-1.5h3.1l.3 1.5H35L32.6 7h-1zm.7 6.4h-2l1-2.7 1 2.7z" fill="#1A1F71"/></svg>
                {/* Mastercard */}
                <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="38" height="24" rx="3" fill="#F8F8F8" stroke="#E0E0E0"/><circle cx="15" cy="12" r="6" fill="#EB001B"/><circle cx="23" cy="12" r="6" fill="#F79E1B"/><path d="M19 7.5a6 6 0 010 9 6 6 0 010-9z" fill="#FF5F00"/></svg>
                {/* Amex */}
                <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="38" height="24" rx="3" fill="#016FD0"/><path d="M7 8.5h4l1.5 3 1.5-3h4l-3 7H12l-1.5-3.5L9 15.5H6L7 8.5zm12 0h7v2H21v1.5h4.5V14H21v1.5h5v2H19V8.5zm9 0h3l2.5 5 2.5-5H38l-4 7h-2l-4-7z" fill="white"/></svg>
                {/* Mada/local */}
                <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="38" height="24" rx="3" fill="#F8F8F8" stroke="#E0E0E0"/><text x="6" y="16" fontFamily="sans-serif" fontWeight="bold" fontSize="9" fill="#00722A">mada</text></svg>
                {/* Apple Pay */}
                <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="38" height="24" rx="3" fill="#000"/><path d="M14.2 9.8c-.4.5-.7 1.1-.7 1.7 0 .1 0 .2.1.2.6 0 1.2-.4 1.5-.6.4-.5.7-1.1.7-1.7 0-.1 0-.2-.1-.2-.5 0-1.1.3-1.5.6zm-1 2.7c-.7-.1-1.5.4-1.9.4-.5 0-1.1-.4-1.8-.4-1.2.1-2.3 1.1-2.3 2.9 0 1.9.9 3.5 1.7 4.4.5.6 1 1.2 1.7 1.2.7 0 1-.4 1.7-.4.8 0 1 .4 1.7.4.7 0 1.2-.6 1.7-1.2.5-.7.8-1.4.8-1.4s-1.1-.5-1.1-1.7c0-1.1 1-1.6 1-1.6s-.5-.9-1.5-1z" fill="white"/><text x="19" y="16" fontFamily="-apple-system, BlinkMacSystemFont" fontWeight="600" fontSize="7" fill="white">Pay</text></svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agreement modal */}

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
                className="w-full bg-black text-white font-black text-xs uppercase tracking-wider py-3 rounded-lg hover:bg-[#ed1c24] transition-colors"
              >
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
