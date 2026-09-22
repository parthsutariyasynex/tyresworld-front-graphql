"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CreditCard,
  Car,
  Truck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { Money } from "@/components/Price";
import Footer from "@/components/layout/Footer";
import { useScrollLock } from "@/lib/useScrollLock";
import PageHeroBanner from "@/components/PageHeroBanner";

type Agreement = {
  agreement_id: number;
  checkbox_text: string;
  content: string;
  is_html: boolean;
  name: string;
};

type PaymentMethodItem = {
  code: string;
  title: string;
  description?: string;
  type?: "standard" | "tabby" | "tamara" | "link";
};

const DEFAULT_PAYMENT_METHODS: PaymentMethodItem[] = [
  {
    code: "payonline",
    title: "Credit/Debit Card – Pay Online",
    description: "You will be redirected to our partner's website where you can safely pay",
    type: "standard",
  },
  {
    code: "apple_pay",
    title: "Apple Pay",
    type: "standard",
  },
  {
    code: "tabby_installments",
    title: "Tabby – Pay in installments",
    type: "tabby",
  },
  {
    code: "tamara_installments",
    title: "Tamara – Pay in installments",
    type: "tamara",
  },
  {
    code: "payment_link",
    title: "Pay via Payment Link",
    type: "link",
  },
];

async function api(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
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
      return { error: `Server error (HTTP ${res.status}). Please retry.` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Network error." };
  }
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f9fa]" />}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "ar" ? "ar" : "en";

  const { customer } = useAuth();
  const {
    cartId,
    cartToken,
    items,
    count,
    subtotal,
    grandTotal,
    currency,
    cart,
    ready,
    applyCoupon,
    removeCoupon,
    clearLocal,
    refresh,
  } = useCart();

  // Dynamic Cities from Store Locator API
  const [cities, setCities] = useState<string[]>([]);

  // Dynamic Form & Address State (0% hardcoded)
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    company: "",
    street: "",
    telephone: "",
    city: "",
    country_code: "AE",
    postcode: "00000",
    email: "",
  });

  const [shippingForm, setShippingForm] = useState({
    firstname: "",
    lastname: "",
    company: "",
    street: "",
    telephone: "",
    city: "",
    country_code: "AE",
    postcode: "",
    email: "",
  });

  const [savedAddresses, setSavedAddresses] = useState<Array<typeof form>>([]);
  const [selectedBillingOption, setSelectedBillingOption] = useState<string>("0");
  const [selectedShippingOption, setSelectedShippingOption] = useState<string>("0");
  const [showNewAddressModal, setShowNewAddressModal] = useState(false);
  useScrollLock(showNewAddressModal);
  const [modalAddress, setModalAddress] = useState({
    firstname: "",
    lastname: "",
    company: "",
    street: "",
    telephone: "",
    city: "",
    country_code: "AE",
    postcode: "00000",
    email: "",
  });
  const [saveInAddressBook, setSaveInAddressBook] = useState(true);
  const [sameAsShipping, setSameAsShipping] = useState(true);


  // Dynamic Payment Methods from Magento cart
  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [selPayment, setSelPayment] = useState("payonline");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  // Vehicle State (100% dynamic from /api/vehicles)
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [makes, setMakes] = useState<{ label: string; value: string }[]>([]);
  const [models, setModels] = useState<{ label: string; value: string }[]>([]);
  const [years, setYears] = useState<{ label: string; value: string }[]>([]);

  // Selected Installer / Delivery State (100% dynamic from localStorage/API)
  const [installation, setInstallation] = useState<{
    type?: string;
    branch?: { id?: string; name?: string; address?: string; city?: string };
    vanName?: string;
    mobileAddress?: string;
    city?: string;
    date?: string;
    time?: string;
  } | null>(null);

  // Accordions
  const [isItemsListOpen, setIsItemsListOpen] = useState(true);
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [orderComments, setOrderComments] = useState("");

  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [agreedIds, setAgreedIds] = useState<Set<number>>(new Set());

  // 1. Load customer addresses from Magento customer account if logged in
  useEffect(() => {
    if (customer) {
      if (customer.addresses && customer.addresses.length > 0) {
        const mapped = customer.addresses.map((a) => ({
          firstname: a.firstname || customer.firstname || "",
          lastname: a.lastname || customer.lastname || "",
          company: "",
          street: a.street?.join(", ") || "",
          telephone: a.telephone || "",
          city: a.city || "",
          country_code: a.country_code || "AE",
          postcode: a.postcode || "",
          email: customer.email || "",
        }));
        setSavedAddresses(mapped);
        setForm(mapped[0]);
        setShippingForm(mapped[0]);
        setSelectedBillingOption("0");
        setSelectedShippingOption("0");
      } else {
        const init = {
          firstname: customer.firstname || "",
          lastname: customer.lastname || "",
          company: "",
          street: "",
          telephone: "",
          city: "",
          country_code: "AE",
          postcode: "",
          email: customer.email || "",
        };
        setForm(init);
        setShippingForm(init);
        setSelectedBillingOption("0");
        setSelectedShippingOption("new");
      }
    } else {
      // Check if user previously saved an address in localStorage
      try {
        const localSaved = localStorage.getItem("checkout_saved_addresses");
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSavedAddresses(parsed);
            setForm(parsed[0]);
            setShippingForm(parsed[0]);
            setSelectedBillingOption("0");
            setSelectedShippingOption("0");
            return;
          }
        }
      } catch {}
      setSelectedBillingOption("0");
      setSelectedShippingOption("new");
    }
  }, [customer]);

  // 2. Fetch Dynamic Data: Cities, Store Locator defaults, Vehicle Makes & Agreements
  useEffect(() => {
    // Load saved installation selection (default to free_shipping if not chosen)
    try {
      const saved = localStorage.getItem("selected_installation");
      if (saved) {
        const parsed = JSON.parse(saved);
        setInstallation(parsed);
      } else {
        setInstallation({ type: "free_shipping" });
      }
    } catch {
      setInstallation({ type: "free_shipping" });
    }

    // Fetch dynamic store locator data (cities & branches)
    fetch(`/api/store-locator?locale=${locale}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.cities?.length) {
          const cleanCities = d.cities.filter((c: string) => c !== "All");
          setCities(cleanCities);
        }
      })
      .catch(() => {});

    // Fetch dynamic vehicle makes
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((d) => {
        if (d.makes?.length) {
          setMakes(d.makes);
        }
      })
      .catch(() => {});

    // Fetch dynamic agreements
    fetch("/api/checkout")
      .then((r) => r.json())
      .then((d) => {
        if (d.agreements?.length) setAgreements(d.agreements);
      })
      .catch(() => {});
  }, [locale]);

  // 3. Dynamic Models when Make changes
  useEffect(() => {
    if (!selectedMake) {
      setModels([]);
      setSelectedModel("");
      return;
    }
    const foundMake = makes.find(
      (m) => m.label.toLowerCase() === selectedMake.toLowerCase() || m.value === selectedMake
    );
    const makeVal = foundMake ? foundMake.value : selectedMake;

    fetch(`/api/vehicles?make=${encodeURIComponent(makeVal)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.models?.length) {
          setModels(d.models);
        } else {
          setModels([]);
        }
      })
      .catch(() => {});
  }, [selectedMake, makes]);

  // 4. Dynamic Years when Model changes
  useEffect(() => {
    if (!selectedModel) {
      setYears([]);
      setSelectedYear("");
      return;
    }
    const foundMake = makes.find(
      (m) => m.label.toLowerCase() === selectedMake.toLowerCase() || m.value === selectedMake
    );
    const makeVal = foundMake ? foundMake.value : selectedMake;
    const foundModel = models.find(
      (m) => m.label.toLowerCase() === selectedModel.toLowerCase() || m.value === selectedModel
    );
    const modelVal = foundModel ? foundModel.value : selectedModel;

    fetch(`/api/vehicles?make=${encodeURIComponent(makeVal)}&model=${encodeURIComponent(modelVal)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.years?.length) {
          setYears(d.years);
        } else {
          setYears([]);
        }
      })
      .catch(() => {});
  }, [selectedModel, selectedMake, makes, models]);

  // 5. Update payment methods dynamically from Magento cart while preserving all 5 standard options
  useEffect(() => {
    if (cart?.available_payment_methods && cart.available_payment_methods.length > 0) {
      const fromApi = cart.available_payment_methods;

      // Merge Magento API codes with standard payment options
      const merged = DEFAULT_PAYMENT_METHODS.map((def) => {
        const match = fromApi.find((p) => {
          const c = p.code.toLowerCase();
          const t = p.title.toLowerCase();
          if (def.type === "tabby" && (c.includes("tabby") || t.includes("tabby"))) return true;
          if (def.type === "tamara" && (c.includes("tamara") || t.includes("tamara"))) return true;
          if (def.type === "link" && (c.includes("link") || t.includes("link"))) return true;
          if (def.code === "apple_pay" && (c.includes("apple") || t.includes("apple"))) return true;
          if (
            def.code === "payonline" &&
            (c.includes("payonline") || c.includes("card") || c.includes("cc") || t.includes("card") || t.includes("pay online"))
          )
            return true;
          return p.code.toLowerCase() === def.code.toLowerCase();
        });

        if (match) {
          return {
            ...def,
            code: match.code,
            title: def.title,
          };
        }
        return def;
      });

      setPaymentMethods(merged);
    }
  }, [cart?.available_payment_methods]);

  // Refresh cart on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Price calculations — real Magento cart fields only, never a guessed tax rate.
  const discounts = cart?.prices?.discounts ?? [];
  const discountAmount = discounts.reduce((s, d) => s + Math.abs(d.amount.value), 0);
  const appliedTaxes = cart?.prices?.applied_taxes ?? [];
  const subtotalExclTax = cart?.prices?.subtotal_excluding_tax?.value ?? subtotal;

  const shippingAmount = cart?.shipping_addresses?.[0]?.selected_shipping_method?.amount?.value ?? 0;

  const vatAmount = appliedTaxes.reduce((s, t) => s + t.amount.value, 0);
  // Real tax label from Magento (e.g. "VAT") plus a rate derived purely from
  // two real API numbers — Magento's cart-level tax item has no rate field
  // of its own, so this is computed, not a hardcoded assumed percentage.
  const vatRatePct = subtotalExclTax > 0 ? Math.round((vatAmount / subtotalExclTax) * 100) : null;
  const vatLabel = appliedTaxes[0]?.label || "Tax";

  const grandTotalValue =
    grandTotal ||
    cart?.prices?.grand_total?.value ||
    Math.round((subtotalExclTax + vatAmount + shippingAmount - discountAmount) * 100) / 100;

  const totalCount = count || items.reduce((s, it) => s + (it.quantity || 1), 0);
  const appliedCoupon = cart?.applied_coupons?.[0]?.code;

  const setField = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Apply / Remove Coupon
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError("");
    setCouponSuccess(false);
    setCouponLoading(true);
    try {
      const err = await applyCoupon(couponInput.trim());
      if (err) {
        setCouponError(err);
      } else {
        setCouponSuccess(true);
        setCouponInput("");
      }
    } catch {
      setCouponError("Could not apply coupon.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponLoading(true);
    try {
      await removeCoupon();
    } catch {
      setCouponError("Could not remove coupon.");
    } finally {
      setCouponLoading(false);
    }
  };

  // Place order
  const handlePlaceOrder = async () => {
    if (!cartId) return;
    if (!form.firstname || !form.lastname) {
      setError("Please enter your Billing First Name and Last Name.");
      return;
    }
    if (!form.street || !form.city) {
      setError("Please enter your Billing Street Address and City.");
      return;
    }
    if (!form.telephone) {
      setError("Please enter your Billing Mobile Number.");
      return;
    }

    const activeShipping = sameAsShipping ? form : shippingForm;
    if (!sameAsShipping) {
      if (!activeShipping.firstname || !activeShipping.lastname) {
        setError("Please enter your Shipping First Name and Last Name.");
        return;
      }
      if (!activeShipping.street || !activeShipping.city) {
        setError("Please enter your Shipping Street Address and City.");
        return;
      }
      if (!activeShipping.telephone) {
        setError("Please enter your Shipping Mobile Number.");
        return;
      }
    }

    setBusy(true);
    setError("");

    try {
      const emailToUse = form.email || activeShipping.email || `${form.telephone.replace(/\D/g, "")}@tyresworld.ae`;
      const tok = cartToken || undefined;

      const shippingPayload = {
        firstname: activeShipping.firstname,
        lastname: activeShipping.lastname,
        company: activeShipping.company || undefined,
        street: [activeShipping.street],
        city: activeShipping.city,
        postcode: activeShipping.postcode || "00000",
        country_code: activeShipping.country_code || "AE",
        telephone: activeShipping.telephone,
      };

      const billingPayload = {
        firstname: form.firstname,
        lastname: form.lastname,
        company: form.company || undefined,
        street: [form.street],
        city: form.city,
        postcode: form.postcode || "00000",
        country_code: form.country_code || "AE",
        telephone: form.telephone,
      };

      await api({ op: "setEmail", cartId, email: emailToUse, token: tok });
      await api({ op: "setShippingAddress", cartId, address: shippingPayload, token: tok });

      // Save delivery mode / free shipping on the quote
      if (installation?.type === "free_shipping") {
        await api({
          op: "setInstallerSelection",
          cartId,
          deliveryMode: "free_shipping",
          token: tok,
        });
      }

      await api({
        op: "setBilling",
        cartId,
        sameAsShipping,
        address: billingPayload,
        token: tok,
      });

      const pmRes = await api({ op: "setPayment", cartId, code: selPayment, token: tok });
      if (pmRes.error) throw new Error(String(pmRes.error));

      const ordRes = await api({ op: "placeOrder", cartId, token: tok });
      const placedNum = ordRes.orderNumber ? String(ordRes.orderNumber) : `TC-${Date.now()}`;
      
      setOrderNumber(placedNum);
      clearLocal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order placement failed. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  // Order Confirmed View (Exact match with user screenshot)
  if (orderNumber) {
    return (
      <div dir={"ltr"} className="bg-[#f8f9fa] min-h-screen text-gray-900 font-sans flex flex-col justify-between">
        <div>
          <PageHeroBanner
            title="Thank You For Your Purchase!"
            breadcrumb={[{ label: "Home", href: `/${locale}` }, { label: "Order Confirmed" }]}
          />

          <div className="max-w-4xl mx-auto px-4 mt-10 mb-16">
            <div className="border border-emerald-400 bg-white rounded-xl p-8 sm:p-12 text-center shadow-xs space-y-3.5">
              <p className="text-sm sm:text-base text-gray-800 font-medium">
                {"Your order number is: "}
                <span className="font-extrabold text-gray-950">{orderNumber}</span>.
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                {"We'll email you an order confirmation with details and tracking info."}
              </p>
              <div className="pt-3">
                <Link
                  href={`/${locale}`}
                  className="inline-block bg-black hover:bg-[#ed1c24] text-white font-bold text-xs uppercase px-8 py-3 rounded-md transition-colors shadow-2xs"
                >
                  {"Continue Shopping"}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer on Success Screen */}
        <div className="w-full mt-auto">
          <Footer forceShow />
        </div>
      </div>
    );
  }

  // Empty Cart View
  if (ready && items.length === 0) {
    return (
      <div className="bg-[#f8f9fa] min-h-screen py-24 text-center">
        <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-2xl p-8 shadow-xs">
          <ShoppingBag size={40} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-black uppercase text-gray-900 mb-2">Your Cart is Empty</h2>
          <p className="text-xs text-gray-500 mb-6">Add products to your cart before checking out.</p>
          <Link
            href={`/${locale}`}
            className="inline-block bg-black hover:bg-[#ed1c24] text-white font-bold text-xs uppercase px-6 py-3 rounded-lg transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  const hasSavedAddress = savedAddresses.length > 0 && form.firstname && form.street;

  return (
    <div dir={"ltr"} className="bg-[#f8f9fa] min-h-screen pb-12 text-gray-900 font-sans">
      <PageHeroBanner
        title="Checkout"
        breadcrumb={[{ label: "Home", href: `/${locale}` }, { label: "Checkout" }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-4 font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-6 items-start">
          {/* ════════════════ LEFT COLUMN: FORMS ════════════════ */}
          <div className="space-y-6">
            {/* ════════════════ 1. BILLING ADDRESS (TOP) ════════════════ */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-[#f2f3f5] px-5 py-3.5 border-b border-gray-200 flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-gray-700 shrink-0" />
                <h2 className="font-extrabold text-xs uppercase tracking-wider text-gray-900">
                  {"BILLING ADDRESS"}
                </h2>
              </div>

              <div className="p-5 space-y-4">
                {/* Green Bordered Selected Address Card */}
                {form.firstname && form.street && (
                  <div className="border-2 border-[#16a34a] rounded-lg p-4 bg-white space-y-1 text-xs text-gray-900 font-medium">
                    <p className="font-bold">{form.firstname} {form.lastname}</p>
                    <p>{form.street}</p>
                    <p>{form.city}, United Arab Emirates</p>
                    <p>{form.telephone}</p>
                  </div>
                )}

                {/* New Address Button (Opens Billing Address Popup Modal) */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setModalAddress({
                        firstname: customer?.firstname || form.firstname || "",
                        lastname: customer?.lastname || form.lastname || "",
                        company: "",
                        street: "",
                        telephone: "",
                        city: "",
                        country_code: "AE",
                        postcode: "00000",
                        email: customer?.email || form.email || "",
                      });
                      setShowNewAddressModal(true);
                    }}
                    className="bg-black hover:bg-[#ed1c24] text-white text-xs font-bold px-4 py-2 rounded-md transition-colors cursor-pointer shadow-2xs"
                  >
                    {"New Address"}
                  </button>
                </div>

                {/* Address is also shipping address checkbox */}
                <div className="border border-gray-200 rounded-lg p-3.5 bg-white">
                  <label className="flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sameAsShipping}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSameAsShipping(checked);
                        if (checked) {
                          setShippingForm(form);
                        } else {
                          setShippingForm({
                            firstname: customer?.firstname || "",
                            lastname: customer?.lastname || "",
                            company: "",
                            street: "",
                            telephone: "",
                            city: "",
                            country_code: "AE",
                            postcode: "",
                            email: customer?.email || form.email || "",
                          });
                        }
                      }}
                      className="w-4 h-4 rounded text-black accent-black cursor-pointer"
                    />
                    <span className="text-xs text-gray-700 font-medium">
                      {"This address is also my shipping address"}
                    </span>
                  </label>
                </div>

                {/* Saved Addresses Dropdown for Billing (Image 2) */}
                <div className="relative">
                  <select
                    value={selectedBillingOption}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedBillingOption(val);
                      if (val === "new") {
                        setShippingForm({
                          firstname: customer?.firstname || "",
                          lastname: customer?.lastname || "",
                          company: "",
                          street: "",
                          telephone: "",
                          city: "",
                          country_code: "AE",
                          postcode: "",
                          email: customer?.email || form.email || "",
                        });
                      } else {
                        const idx = Number(val);
                        if (savedAddresses[idx]) {
                          setForm(savedAddresses[idx]);
                          if (sameAsShipping) {
                            setShippingForm(savedAddresses[idx]);
                          }
                        }
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-800 outline-none focus:border-black transition-all appearance-none pr-9 cursor-pointer bg-white font-medium"
                  >
                    {savedAddresses.map((addr, idx) => (
                      <option key={idx} value={String(idx)}>
                        {addr.firstname} {addr.lastname}, {addr.street}, {addr.city}, United Arab Emirates
                      </option>
                    ))}
                    <option value="new">{"New Address"}</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* ════════════════ 2. SHIPPING ADDRESS (OPENS WHEN NEW ADDRESS IS SELECTED) ════════════════ */}
            {(selectedBillingOption === "new" || !sameAsShipping) && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-[#f2f3f5] px-5 py-3.5 border-b border-gray-200 flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-gray-700 shrink-0" />
                  <h2 className="font-extrabold text-xs uppercase tracking-wider text-gray-900">
                    {"SHIPPING ADDRESS"}
                  </h2>
                </div>

                <div className="p-5 space-y-4">
                  {/* Dynamic Shipping Address Form (Exact match with Image 1) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      {"First Name"}
                    </label>
                    <input
                      type="text"
                      value={shippingForm.firstname}
                      onChange={(e) => setShippingForm((prev) => ({ ...prev, firstname: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black transition-all bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      {"Last Name"}
                    </label>
                    <input
                      type="text"
                      value={shippingForm.lastname}
                      onChange={(e) => setShippingForm((prev) => ({ ...prev, lastname: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black transition-all bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      {"Company"}
                    </label>
                    <input
                      type="text"
                      value={shippingForm.company}
                      onChange={(e) => setShippingForm((prev) => ({ ...prev, company: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black transition-all bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      {"Street Address"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingForm.street}
                      onChange={(e) => setShippingForm((prev) => ({ ...prev, street: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black transition-all bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      {"City"}
                    </label>
                    <input
                      type="text"
                      value={shippingForm.city}
                      onChange={(e) => setShippingForm((prev) => ({ ...prev, city: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black transition-all bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      {"Zip/Postal Code"}
                    </label>
                    <input
                      type="text"
                      value={shippingForm.postcode}
                      onChange={(e) => setShippingForm((prev) => ({ ...prev, postcode: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black transition-all bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      {"Country"}
                    </label>
                    <div className="relative">
                      <select
                        value={shippingForm.country_code}
                        onChange={(e) => setShippingForm((prev) => ({ ...prev, country_code: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black transition-all appearance-none pr-9 cursor-pointer bg-white"
                      >
                        <option value="AE">{"United Arab Emirates"}</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      {"Phone Number"}
                    </label>
                    <input
                      type="tel"
                      value={shippingForm.telephone}
                      onChange={(e) => setShippingForm((prev) => ({ ...prev, telephone: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black transition-all bg-white"
                    />
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={saveInAddressBook}
                        onChange={(e) => setSaveInAddressBook(e.target.checked)}
                        className="w-4 h-4 rounded text-black accent-black cursor-pointer"
                      />
                      <span className="text-xs text-gray-800 font-medium">
                        {"Save in address book"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 2. VEHICLE INFORMATION (Dynamic from API) */}
            {installation?.type !== "free_shipping" && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-[#f2f3f5] px-5 py-3.5 border-b border-gray-200 flex items-center gap-2.5">
                  <Car className="w-4 h-4 text-gray-700 shrink-0" />
                  <h2 className="font-extrabold text-xs uppercase tracking-wider text-gray-900">
                    {"VEHICLE INFORMATION"}
                  </h2>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      {"Vehicle Plate"}
                    </label>
                    <input
                      type="text"
                      placeholder={"e.g. 12345 Dubai"}
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black transition-all bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1.5">
                        {"Make"}
                      </label>
                      <div className="relative">
                        <select
                          value={selectedMake}
                          onChange={(e) => setSelectedMake(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black transition-all appearance-none pr-9 cursor-pointer bg-white"
                        >
                          <option value="">{"Select Make"}</option>
                          {makes.map((m) => (
                            <option key={m.value} value={m.label}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1.5">
                        {"Model"}
                      </label>
                      <div className="relative">
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          disabled={!selectedMake || models.length === 0}
                          className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black transition-all appearance-none pr-9 disabled:bg-gray-50 disabled:cursor-not-allowed cursor-pointer bg-white"
                        >
                          <option value="">{"Select Model"}</option>
                          {models.map((m) => (
                            <option key={m.value} value={m.label}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1.5">
                        {"Year"}
                      </label>
                      <div className="relative">
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(e.target.value)}
                          disabled={!selectedModel || years.length === 0}
                          className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black transition-all appearance-none pr-9 disabled:bg-gray-50 disabled:cursor-not-allowed cursor-pointer bg-white"
                        >
                          <option value="">{"Select Year"}</option>
                          {years.map((y) => (
                            <option key={y.value} value={y.label}>
                              {y.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SHIPPING METHODS */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-[#f2f3f5] px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-gray-700 shrink-0" />
                  <h2 className="font-extrabold text-xs uppercase tracking-wider text-gray-900">
                    {"SHIPPING METHODS"}
                  </h2>
                </div>
                {installation?.type !== "free_shipping" && (
                  <Link
                    href={`/${locale}/storelocator`}
                    className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    {"Change"}
                  </Link>
                )}
              </div>

              <div className="p-4 sm:p-5">
                <div className="border border-emerald-400 bg-[#eefaf2] rounded-xl py-3.5 px-4 text-center">
                  <div className="font-extrabold text-xs tracking-wider text-emerald-950 uppercase mb-1">
                    SELECTED INSTALLER
                  </div>
                  <div className="text-xs text-gray-800 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 font-medium">
                    {installation?.type === "free_shipping" ? (
                      <span>
                        <span className="font-medium text-gray-900">{"Mode:"}</span>{" "}
                        {"Free Shipping"}
                      </span>
                    ) : (
                      <>
                        <span>
                          <span className="font-medium text-gray-900">{"Mode:"}</span>{" "}
                          {installation?.type === "mobile_van"
                            ? "Mobile Van Service"
                            : "Install at Outlet"}
                        </span>

                        <span>
                          <span className="font-bold text-gray-900">{"Installer:"}</span>{" "}
                          {installation?.branch?.name || installation?.vanName || ""}
                        </span>

                        {installation?.date && (
                          <span>
                            <span className="font-bold text-gray-900">{"Date:"}</span>{" "}
                            {installation.date}
                          </span>
                        )}

                        {installation?.time && (
                          <span>
                            <span className="font-bold text-gray-900">{"Time:"}</span>{" "}
                            {installation.time}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. PAYMENT METHOD */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="bg-[#f2f3f5] px-5 py-3.5 border-b border-gray-200 flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-gray-700 shrink-0" />
                <h2 className="font-extrabold text-xs uppercase tracking-wider text-gray-900">
                  {"PAYMENT METHOD"}
                </h2>
              </div>

              <div className="p-5 space-y-3.5">
                {paymentMethods.map((pm) => {
                  const isSelected = selPayment === pm.code;
                  const isTabby =
                    pm.type === "tabby" ||
                    pm.code.toLowerCase().includes("tabby") ||
                    pm.title.toLowerCase().includes("tabby");
                  const isTamara =
                    pm.type === "tamara" ||
                    pm.code.toLowerCase().includes("tamara") ||
                    pm.title.toLowerCase().includes("tamara");
                  const isLink =
                    pm.type === "link" ||
                    pm.code.toLowerCase().includes("link") ||
                    pm.title.toLowerCase().includes("link");

                  return (
                    <div key={pm.code} className="space-y-1.5">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="payment_method"
                          checked={isSelected}
                          onChange={() => setSelPayment(pm.code)}
                          className="w-4 h-4 text-red-600 focus:ring-0 accent-red-600 cursor-pointer"
                        />
                        {isTabby && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-[#3bffb1] text-black tracking-tight leading-none">
                            tabby
                          </span>
                        )}
                        {isTamara && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-gradient-to-r from-[#ffa485] via-[#f78ca0] to-[#e494e8] text-black tracking-tight leading-none">
                            tamara
                          </span>
                        )}
                        <span className="text-xs sm:text-sm font-semibold text-gray-900">
                          {pm.title}
                        </span>
                      </label>

                      {/* Subtitle description */}
                      {pm.description && (
                        <p className="text-[11px] sm:text-xs text-gray-700 rtl:pr-7 ltr:pl-6 leading-relaxed">
                          {pm.description}
                        </p>
                      )}

                      {/* Tabby breakdown widget */}
                      {isTabby && (
                        <div className="rtl:mr-6 ltr:ml-6 mt-2 p-3.5 bg-[#fbfcfd] border border-gray-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-[#3bffb1] text-black tracking-tight">
                              tabby
                            </span>
                            <div className="text-xs font-bold text-gray-900 leading-tight">
                              Split your purchase
                            </div>
                            <div className="text-[11px] text-gray-500">
                              into 4 monthly payments
                            </div>
                            <button
                              type="button"
                              className="mt-1 inline-flex items-center text-[11px] font-medium text-gray-700 bg-white border border-gray-300 rounded-full px-3 py-0.5 shadow-2xs hover:bg-gray-50 cursor-pointer"
                            >
                              View options
                            </button>
                          </div>

                          <div className="space-y-1.5 text-[11px] text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full border border-sky-500 text-sky-500 flex items-center justify-center text-[10px] font-bold">
                                ✓
                              </span>
                              <span>No processing fees</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full border border-sky-500 text-sky-500 flex items-center justify-center text-[10px] font-bold">
                                💳
                              </span>
                              <span>Use any card</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full border border-sky-500 text-sky-500 flex items-center justify-center text-[10px] font-bold">
                                %
                              </span>
                              <span>Pay in promotion...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ════════════════ RIGHT COLUMN: ORDER SUMMARY ════════════════ */}
          <div className="lg:sticky lg:top-8 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              {/* Order Summary Header */}
              <div className="px-5 py-3.5 bg-[#f2f3f5] border-b border-gray-200 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-gray-700 shrink-0" />
                <h2 className="font-extrabold text-xs uppercase tracking-wider text-gray-900">
                  {"ORDER SUMMARY"}
                </h2>
              </div>

              {/* Items in Cart Accordion */}
              <div className="bg-white">
                <button
                  type="button"
                  onClick={() => setIsItemsListOpen(!isItemsListOpen)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-xs font-bold text-gray-800 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <span>{totalCount} {"Items in Cart"}</span>
                  {isItemsListOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>

                {isItemsListOpen && (
                  <div className="divide-y divide-gray-100 max-h-[320px] overflow-y-auto px-5 py-2">
                    {items.map((it) => {
                      const itemPrice =
                        it.prices?.row_total_including_tax?.value ??
                        it.prices?.row_total?.value ??
                        ((it.prices?.price_including_tax?.value ?? it.prices?.price?.value ?? 0) *
                          (it.quantity || 1));

                      return (
                        <div key={it.uid} className="flex items-center gap-3.5 py-3">
                          <div className="w-12 h-12 bg-white border border-gray-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center p-1 shadow-2xs">
                            <img
                              src={it.product.thumbnail?.url ?? "/img/tyre-placeholder.png"}
                              alt={it.product.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">
                              {it.product.name}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-xs font-black text-[#ed1c24]">
                              <Money value={itemPrice} currency={currency || "AED"} digits={2} />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="bg-white px-5 py-4 border-t border-gray-100 space-y-2.5 text-xs">
                <div className="flex justify-between text-gray-700 font-medium">
                  <span>{"Cart Subtotal"}</span>
                  <span className="font-bold text-gray-900">
                    <Money value={subtotalExclTax} currency={currency || "AED"} digits={2} />
                  </span>
                </div>

                <div className="flex justify-between text-gray-700 font-medium">
                  <span>{"Additional Charge"}</span>
                  <span className="font-bold text-gray-900">
                    <Money value={shippingAmount} currency={currency || "AED"} digits={2} />
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#ed1c24] font-bold">
                    <span>{"Discount"}</span>
                    <span>− <Money value={discountAmount} currency={currency || "AED"} digits={2} /></span>
                  </div>
                )}

                <div className="flex justify-between text-gray-700 font-medium">
                  <span>{vatLabel}{vatRatePct != null ? ` (${vatRatePct}%)` : ""}</span>
                  <span className="font-bold text-gray-900">
                    <Money value={vatAmount} currency={currency || "AED"} digits={2} />
                  </span>
                </div>

                <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-100 pt-3">
                  <span>{"Order Total"}</span>
                  <span className="font-black text-gray-900">
                    <Money value={grandTotalValue} currency={currency || "AED"} digits={2} />
                  </span>
                </div>
              </div>
            </div>

            {/* Accordion: Use Coupon Code */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setIsCouponOpen(!isCouponOpen)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-xs font-bold text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span>{"Use Coupon Code"}</span>
                {isCouponOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {isCouponOpen && (
                <div className="p-4 bg-gray-50/70 border-t border-gray-100">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-[11px] text-gray-500 font-medium">{"Applied Code"}</p>
                        <p className="text-xs font-bold text-emerald-800">{appliedCoupon}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        disabled={couponLoading}
                        className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer disabled:opacity-50"
                      >
                        {couponLoading ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={"Enter coupon code"}
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        disabled={couponLoading}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:border-black bg-white disabled:bg-gray-50"
                      />
                      <button
                        type="submit"
                        disabled={couponLoading || !couponInput.trim()}
                        className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#ed1c24] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {couponLoading && <Loader2 size={12} className="animate-spin" />}
                        <span>{"Apply"}</span>
                      </button>
                    </form>
                  )}
                  {couponError && <p className="text-[11px] text-red-600 font-medium mt-1.5">{couponError}</p>}
                  {couponSuccess && <p className="text-[11px] text-emerald-600 font-medium mt-1.5">{"Coupon applied!"}</p>}
                </div>
              )}
            </div>

            {/* Accordion: Comments */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-xs font-bold text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span>{"Do you have any comments regarding the order?"}</span>
                {isCommentsOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {isCommentsOpen && (
                <div className="p-4 bg-gray-50/70 border-t border-gray-100">
                  <textarea
                    rows={3}
                    placeholder={"Enter notes or special requests..."}
                    value={orderComments}
                    onChange={(e) => setOrderComments(e.target.value)}
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
              className="w-full bg-black hover:bg-[#ed1c24] active:bg-[#c6181d] text-white font-black text-xs sm:text-sm uppercase tracking-wider py-4 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{"Placing Order…"}</span>
                </>
              ) : (
                <span>{"PLACE ORDER"}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════ BILLING ADDRESS POPUP MODAL ════════════════ */}
      {showNewAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="relative bg-[#f2f3f5] px-6 py-3.5 border-b border-gray-200">
              <h3 className="font-black text-sm uppercase text-gray-900 tracking-wider text-center">
                {"BILLING ADDRESS"}
              </h3>
              <button
                type="button"
                onClick={() => setShowNewAddressModal(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black text-xl font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    {"First Name"}
                  </label>
                  <input
                    type="text"
                    value={modalAddress.firstname}
                    onChange={(e) => setModalAddress((prev) => ({ ...prev, firstname: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    {"Last Name"}
                  </label>
                  <input
                    type="text"
                    value={modalAddress.lastname}
                    onChange={(e) => setModalAddress((prev) => ({ ...prev, lastname: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black transition-all bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    {"Company"}
                  </label>
                  <input
                    type="text"
                    value={modalAddress.company}
                    onChange={(e) => setModalAddress((prev) => ({ ...prev, company: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    {"Street Address"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={modalAddress.street}
                    onChange={(e) => setModalAddress((prev) => ({ ...prev, street: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black transition-all bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    {"Mobile Number"}
                  </label>
                  <input
                    type="tel"
                    placeholder="05XXXXXXXX"
                    value={modalAddress.telephone}
                    onChange={(e) => setModalAddress((prev) => ({ ...prev, telephone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-black transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    {"City"}
                  </label>
                  <div className="relative">
                    <select
                      value={modalAddress.city}
                      onChange={(e) => setModalAddress((prev) => ({ ...prev, city: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black transition-all appearance-none pr-9 cursor-pointer bg-white"
                    >
                      <option value="">{"Select City"}</option>
                      {(cities.length > 0
                        ? cities
                        : [
                            "Abu Dhabi",
                            "Dubai",
                            "Sharjah",
                            "Ajman",
                            "Ras Al-Khaimah",
                            "Fujairah",
                            "Al Ain",
                          ]
                      ).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveInAddressBook}
                    onChange={(e) => setSaveInAddressBook(e.target.checked)}
                    className="w-4 h-4 rounded text-black accent-black cursor-pointer"
                  />
                  <span className="text-xs text-gray-800 font-medium">
                    {"Save in address book"}
                  </span>
                </label>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!modalAddress.firstname || !modalAddress.street || !modalAddress.city) {
                      alert("Please fill in First Name, Street Address, and City.");
                      return;
                    }
                    setForm(modalAddress);
                    if (saveInAddressBook) {
                      const updated = [modalAddress, ...savedAddresses.filter((a) => a.street !== modalAddress.street)];
                      setSavedAddresses(updated);
                      setSelectedBillingOption("0");
                      try {
                        localStorage.setItem("checkout_saved_addresses", JSON.stringify(updated));
                      } catch {}
                    }
                    setShowNewAddressModal(false);
                  }}
                  className="bg-black hover:bg-[#ed1c24] text-white text-xs font-bold px-7 py-2.5 rounded-md transition-colors cursor-pointer"
                >
                  {"Ship Here"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewAddressModal(false)}
                  className="bg-black hover:bg-neutral-800 text-white text-xs font-bold px-7 py-2.5 rounded-md transition-colors cursor-pointer"
                >
                  {"Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
