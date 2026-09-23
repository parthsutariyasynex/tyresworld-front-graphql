"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Wrench,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Truck,
  Car,
  Phone,
  User,
  ShieldCheck,
  Sparkles,
  CreditCard,
  Banknote,
  Loader2,
  AlertCircle,
  ArrowRight,
  Store,
  Package,
  Search,
  Crosshair,
  Navigation,
  Check,
} from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useOverviewDrawer } from "@/lib/overview-drawer-context";
import { useScrollLock } from "@/lib/useScrollLock";
import { Money } from "@/components/Price";
import ProductImage from "@/components/ProductImage";
import type { StoreLocation } from "@/components/StoreLocatorMap";

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

function WhatsAppIcon() {
  return (
    <svg className="w-3.5 h-3.5 fill-[#25D366]" viewBox="0 0 24 24" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function StoreBadgeIcon() {
  return (
    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shrink-0 border border-emerald-300/80 bg-[#f0fbf5] flex items-center justify-center shadow-2xs">
      <img
        src="/img/independent-badge.png"
        alt="Independent Installer"
        className="w-full h-full object-contain p-0.5"
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = "none";
        }}
      />
      <Store className="w-5 h-5 text-emerald-700 hidden" />
    </div>
  );
}

function MobileVanBadgeIcon() {
  return (
    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shrink-0 border border-emerald-300/80 bg-[#f0fbf5] flex flex-col items-center justify-center shadow-2xs">
      <img
        src="/img/installer-badge.png"
        alt="Mobile Van"
        className="w-full h-full object-contain p-0.5"
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = "none";
        }}
      />
      <Truck className="w-5 h-5 text-emerald-700 hidden" />
    </div>
  );
}

interface MobileVanItem {
  id: string;
  name: string;
  city: string;
  address: string;
  lat?: number;
  lng?: number;
  distanceKm?: number;
}

type PaymentMethodItem = {
  id: string;
  code: string;
  title: string;
  description?: string;
  type?: "standard" | "tabby" | "tamara" | "link";
};

/* ── Custom Quantity Dropdown Component ── */
function CartQtyDropdown({
  uid,
  quantity,
  qtyOptions,
  onUpdate,
  disabled,
}: {
  uid: string;
  quantity: number;
  qtyOptions?: number[] | null;
  onUpdate: (uid: string, qty: number) => void;
  disabled?: boolean;
}) {
  const defaultOptions = [1, 2, 3, 4, 5, 6, 7, 8];
  const baseOptions = qtyOptions && qtyOptions.length > 1 ? qtyOptions : defaultOptions;
  const options = Array.from(new Set([...baseOptions, quantity])).sort((a, b) => a - b);
  const selectable = options.length > 1;

  return (
    <div className="relative inline-flex items-center">
      <select
        value={quantity}
        disabled={disabled || !selectable}
        onChange={(e) => {
          const val = Number(e.target.value);
          if (val !== quantity) onUpdate(uid, val);
        }}
        aria-label={`Quantity: ${quantity}`}
        className="appearance-none min-w-[56px] sm:min-w-[62px] h-8 sm:h-9 pl-3 pr-7 bg-[#f8f9fa] hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg text-gray-950 font-bold text-xs cursor-pointer transition-all shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed outline-none focus:border-black"
      >
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
        {disabled ? (
          <Loader2 size={12} className="animate-spin text-gray-400" />
        ) : (
          <ChevronDown size={13} strokeWidth={2.5} />
        )}
      </div>
    </div>
  );
}

const DEFAULT_PAYMENT_METHODS: PaymentMethodItem[] = [
  // Only "Pay via Payment Link" should show for now — the other methods
  // are commented out (not removed) so they're a one-line uncomment away
  // when they need to come back.
  // {
  //   id: "payonline",
  //   code: "payonline",
  //   title: "Credit/Debit Card – Pay Online",
  //   description: "You will be redirected to our partner's website where you can safely pay",
  //   type: "standard",
  // },
  // {
  //   id: "apple_pay",
  //   code: "apple_pay",
  //   title: "Apple Pay",
  //   type: "standard",
  // },
  // {
  //   id: "tabby_installments",
  //   code: "tabby_installments",
  //   title: "Tabby – Pay in installments",
  //   type: "tabby",
  // },
  // {
  //   id: "tamara_installments",
  //   code: "tamara_installments",
  //   title: "Tamara – Pay in installments",
  //   type: "tamara",
  // },
  // {
  //   id: "cashondelivery",
  //   code: "cashondelivery",
  //   title: "Cash on Fitting / Delivery",
  //   type: "standard",
  // },
  {
    id: "payment_link",
    code: "payment_link",
    title: "Pay via Payment Link",
    type: "link",
  },
];

export default function OverviewDrawer() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    isOpen,
    closeDrawer,
    toggleDrawer,
    activeSection,
    setActiveSection,
  } = useOverviewDrawer();

  // Whenever the user actually navigates to a different real page, any
  // in-drawer accordion progress from wherever they were before is stale —
  // clear it so the progress bar re-derives purely from the new page
  // (otherwise a step reached in the drawer on one page would keep showing
  // as "current" forever, even after navigating far away from it).
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setActiveSection(null);
    }
  }, [pathname, setActiveSection]);

  // Prevent background page scrolling & eliminate layout shift — same
  // shared lock every other modal/drawer on the site uses (also locks
  // <html>, the actual scrolling element per globals.css).
  useScrollLock(isOpen);

  const { customer } = useAuth();
  const {
    cartId,
    cartToken,
    items,
    currency,
    cart,
    updateQty,
    removeItem,
    applyCoupon,
    removeCoupon,
    clearLocal,
    refresh,
  } = useCart();

  const locale = pathname?.split("/")[1] === "ar" ? "ar" : "en";

  // ── Step 3: Real Store Locator State (Exact match to storelocator/page.tsx) ──
  const [cities, setCities] = useState<string[]>([]);
  const [branches, setBranches] = useState<StoreLocation[]>([]);
  const [mobileVans, setMobileVans] = useState<MobileVanItem[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);

  // 3 Delivery Modes: install_outlet | mobile_van | free_shipping
  const [deliveryMode, setDeliveryMode] = useState<"install_outlet" | "mobile_van" | "free_shipping">("install_outlet");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);
  const [spinningStoreId, setSpinningStoreId] = useState<string | null>(null);
  const [mobileAddress, setMobileAddress] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");

  const handleToggleStore = (branchId: string) => {
    setSpinningStoreId(branchId);
    setSelectedStoreId(branchId);
    setExpandedStoreId((prev) => (prev === branchId ? null : branchId));
    setTimeout(() => {
      setSpinningStoreId(null);
    }, 250);
  };
  const [confirmedFitting, setConfirmedFitting] = useState<{
    type: string;
    name?: string;
    address?: string;
    date?: string;
    time?: string;
  } | null>(null);

  // Sync existing fitting choice from localStorage on load
  useEffect(() => {
    try {
      const raw = localStorage.getItem("selected_installation");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.type) {
          setConfirmedFitting({
            type: parsed.type,
            name: parsed.branch?.name || parsed.vanName,
            address: parsed.branch?.address || parsed.mobileAddress,
            date: parsed.date,
            time: parsed.time,
          });
        }
      }
    } catch {}
  }, []);

  // ── Step 4: Contact, Vehicle & Payment State (100% Dynamic Matching Checkout Page) ──
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    company: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    country_code: "AE",
    postcode: "00000",
  });

  const [shippingForm, setShippingForm] = useState({
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

  const [savedAddresses, setSavedAddresses] = useState<Array<{
    firstname: string;
    lastname: string;
    company: string;
    street: string;
    telephone: string;
    city: string;
    country_code: string;
    postcode: string;
    email: string;
  }>>([]);
  const [selectedBillingOption, setSelectedBillingOption] = useState<string>("0");
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [saveInAddressBook, setSaveInAddressBook] = useState(true);
  const [showNewAddressModal, setShowNewAddressModal] = useState(false);
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

  // Dynamic Vehicle state from /api/vehicles
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [makes, setMakes] = useState<{ label: string; value: string }[]>([]);
  const [models, setModels] = useState<{ label: string; value: string }[]>([]);
  const [years, setYears] = useState<{ label: string; value: string }[]>([]);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>(DEFAULT_PAYMENT_METHODS);
  // Defaults to the one method currently shown (see DEFAULT_PAYMENT_METHODS
  // above) — was "payonline" before the other methods were commented out.
  const [paymentMethod, setPaymentMethod] = useState<string>("payment_link");
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [orderComments, setOrderComments] = useState("");
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isSummaryItemsOpen, setIsSummaryItemsOpen] = useState(true);

  // ── Checkout Execution & Order Success State ────────────────────
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string | null>(null);

  // 1. Sync saved addresses from Customer Account or localStorage
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
          postcode: a.postcode || "00000",
          email: customer.email || "",
        }));
        setSavedAddresses(mapped);
        setForm({
          firstname: mapped[0].firstname,
          lastname: mapped[0].lastname,
          company: mapped[0].company,
          phone: mapped[0].telephone,
          email: mapped[0].email,
          street: mapped[0].street,
          city: mapped[0].city,
          country_code: mapped[0].country_code,
          postcode: mapped[0].postcode,
        });
        setShippingForm(mapped[0]);
        setSelectedBillingOption("0");
      } else {
        const init = {
          firstname: customer.firstname || "",
          lastname: customer.lastname || "",
          company: "",
          street: "",
          telephone: "",
          city: "",
          country_code: "AE",
          postcode: "00000",
          email: customer.email || "",
        };
        setForm({
          firstname: init.firstname,
          lastname: init.lastname,
          company: init.company,
          phone: init.telephone,
          email: init.email,
          street: init.street,
          city: init.city,
          country_code: init.country_code,
          postcode: init.postcode,
        });
        setShippingForm(init);
        setSelectedBillingOption("0");
      }
    } else {
      try {
        const localSaved = localStorage.getItem("checkout_saved_addresses");
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSavedAddresses(parsed);
            setForm({
              firstname: parsed[0].firstname,
              lastname: parsed[0].lastname,
              company: parsed[0].company || "",
              phone: parsed[0].telephone || "",
              email: parsed[0].email || "",
              street: parsed[0].street || "",
              city: parsed[0].city || "",
              country_code: parsed[0].country_code || "AE",
              postcode: parsed[0].postcode || "00000",
            });
            setShippingForm(parsed[0]);
            setSelectedBillingOption("0");
          }
        }
      } catch {}
    }
  }, [customer]);

  // 2. Sync payment methods from Magento Cart
  useEffect(() => {
    if (cart?.available_payment_methods && cart.available_payment_methods.length > 0) {
      const fromApi = cart.available_payment_methods;
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

  // Ensure a valid payment method is always selected by default
  useEffect(() => {
    if (paymentMethods.length > 0) {
      const match = paymentMethods.find((p) => p.id === paymentMethod || p.code === paymentMethod);
      if (!match || !paymentMethod) {
        setPaymentMethod(paymentMethods[0].id || paymentMethods[0].code);
      }
    }
  }, [paymentMethods, paymentMethod]);

  // Fetch dynamic vehicle makes
  useEffect(() => {
    fetch("/api/vehicles")
      .then((r) => r.json())
      .then((d) => {
        if (d.makes?.length) setMakes(d.makes);
      })
      .catch(() => {});
  }, []);

  // Fetch dynamic models when make changes
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
        if (d.models?.length) setModels(d.models);
        else setModels([]);
      })
      .catch(() => {});
  }, [selectedMake, makes]);

  // Fetch dynamic years when model changes
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
        if (d.years?.length) setYears(d.years);
        else setYears([]);
      })
      .catch(() => {});
  }, [selectedModel, selectedMake, makes, models]);

  // Generate upcoming 10 dates for fitting selector (matching storelocator)
  const upcomingDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 10; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const val = d.toISOString().split("T")[0];
      const lbl =
        i === 0
          ? `Today (${val})`
          : i === 1
          ? `Tomorrow (${val})`
          : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
      dates.push({ value: val, label: lbl });
    }
    return dates;
  }, []);

  // Fetch real Store Locator data dynamically from Magento
  useEffect(() => {
    let active = true;
    async function loadStores() {
      try {
        setStoresLoading(true);
        const res = await fetch(`/api/store-locator?locale=${locale}`);
        const data = await res.json();
        if (active && data) {
          if (data.cities?.length) {
            setCities(data.cities);
          }
          if (data.branches?.length) {
            setBranches(data.branches);
          }
          if (data.mobileVans?.length) setMobileVans(data.mobileVans);
          if (data.timeSlots?.length) {
            setTimeSlots(data.timeSlots);
          }
        }
      } catch (err) {
        console.error("Failed to load store locator data in overview:", err);
      } finally {
        if (active) setStoresLoading(false);
      }
    }
    loadStores();
    return () => {
      active = false;
    };
  }, [locale]);

  // Use My Location handler (Matching storelocator/page.tsx with Reverse Geocoding)
  const handleUseMyLocation = () => {
    if (locating) return;
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserCoords({ lat, lng });
        setSelectedCity("All");

        try {
          const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
          const data = await res.json();
          if (data?.address) {
            setSearchQuery(data.address);
          } else {
            setSearchQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        } catch {
          setSearchQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Pre-fill contact from auth
  useEffect(() => {
    if (customer) {
      setForm((prev) => ({
        ...prev,
        firstname: customer.firstname || "",
        lastname: customer.lastname || "",
        email: customer.email || "",
      }));
    }
  }, [customer]);


  // Total Tyres Count and Subtotal
  const totalTyres = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [items]);

  const totalItemSums = items.reduce((acc, item) => acc + (item.prices?.row_total?.value || 0), 0);
  const subtotalExclTax = cart?.prices?.subtotal_excluding_tax?.value ?? totalItemSums;
  const grandTotal = cart?.prices?.grand_total?.value ?? subtotalExclTax;
  const appliedCoupons = cart?.applied_coupons ?? [];

  const [updatingCartUid, setUpdatingCartUid] = useState<string | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);

  const handleCartUpdateQty = async (uid: string, qty: number) => {
    setUpdatingCartUid(uid);
    setCartError(null);
    try {
      const res = await updateQty(uid, qty);
      if (res?.error) {
        setCartError(res.error);
      }
    } catch {
      setCartError("Failed to update quantity.");
    } finally {
      setUpdatingCartUid(null);
    }
  };

  // Active step in overall flow
  // Real-page anchor — the site's checkout flow spans dedicated pages
  // (cart → storelocator → checkout → checkout/complete) as well as the
  // in-drawer accordion, so the progress bar has to track whichever page
  // Determine active step from the real URL page path
  const pageStepNum = useMemo(() => {
    const path = (pathname || "/").replace(/^\/(en|ar)(?=\/|$)/, "") || "/";
    if (path.startsWith("/checkout/complete")) return 5;
    if (path.startsWith("/checkout")) return 4;
    if (
      path.startsWith("/installer-network") ||
      path.startsWith("/fitting-installation-partner") ||
      path.startsWith("/storelocator")
    )
      return 3;
    if (path.startsWith("/cart")) return 2;
    return 1;
  }, [pathname]);

  const currentStep = useMemo(() => {
    if (completedOrderNumber) return 5;
    if (activeSection === "contact") return 4;
    if (activeSection === "fitting") return 3;
    if (activeSection === "cart") return 2;
    return pageStepNum;
  }, [completedOrderNumber, activeSection, pageStepNum]);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  // Filter & calculate distances for branches
  const filteredBranches = useMemo(() => {
    const baseCoords = userCoords || { lat: 24.3682674, lng: 54.5124881 };
    let result = branches.map((store) => {
      const distance =
        store.lat && store.lng
          ? calculateDistanceKm(baseCoords.lat, baseCoords.lng, store.lat, store.lng)
          : 0;
      return { ...store, distance };
    });

    if (selectedCity && selectedCity !== "All") {
      result = result.filter(
        (b) =>
          b.city?.toLowerCase() === selectedCity.toLowerCase() ||
          b.address?.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.name?.toLowerCase().includes(q) ||
          b.address?.toLowerCase().includes(q) ||
          b.city?.toLowerCase().includes(q)
      );
    }

    if (userCoords) {
      result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return result;
  }, [branches, selectedCity, searchQuery, userCoords]);

  // Selected store details
  const selectedStore = useMemo(() => {
    if (!selectedStoreId) return null;
    return branches.find((b) => b.id === selectedStoreId) || null;
  }, [branches, selectedStoreId]);

  // Save Fitting Selection to live cart & localStorage (Exact match to storelocator/page.tsx)
  const handleSaveFitting = async (branchOverride?: StoreLocation) => {
    const storeToUse = branchOverride || selectedStore;
    if (!cartId) {
      setActiveSection("contact");
      return;
    }

    try {
      if (deliveryMode === "install_outlet" && storeToUse) {
        const installData = {
          type: "install_outlet",
          branch: { id: storeToUse.id, name: storeToUse.name, address: storeToUse.address, city: storeToUse.city },
          date: selectedDate,
          time: selectedTimeSlot,
        };
        try { localStorage.setItem("selected_installation", JSON.stringify(installData)); } catch {}

        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            op: "setInstallerSelection",
            cartId,
            deliveryMode: "install_at_outlet",
            storeId: storeToUse.id,
            pickupDate: selectedDate,
            pickupTime: selectedTimeSlot,
            token: cartToken || undefined,
          }),
        });
      } else if (deliveryMode === "mobile_van") {
        const van = mobileVans[0] || { id: "", name: "Mobile Fitting", address: mobileAddress || "", city: "" };
        const installData = {
          type: "mobile_van",
          vanId: van.id,
          vanName: van.name,
          mobileAddress,
          city: van.city,
          date: selectedDate,
          time: selectedTimeSlot,
        };
        try { localStorage.setItem("selected_installation", JSON.stringify(installData)); } catch {}

        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            op: "setInstallerSelection",
            cartId,
            deliveryMode: "mobile_van_service",
            storeId: van.id,
            pickupLocation: mobileAddress || "Customer Location (UAE)",
            pickupDate: selectedDate,
            pickupTime: selectedTimeSlot,
            token: cartToken || undefined,
          }),
        });
      } else {
        const installData = { type: "free_shipping" };
        try { localStorage.setItem("selected_installation", JSON.stringify(installData)); } catch {}

        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            op: "setInstallerSelection",
            cartId,
            deliveryMode: "free_shipping",
            token: cartToken || undefined,
          }),
        });
      }

      if (deliveryMode === "install_outlet" && storeToUse) {
        setConfirmedFitting({
          type: "install_outlet",
          name: storeToUse.name,
          address: storeToUse.address,
          date: selectedDate,
          time: selectedTimeSlot,
        });
      } else if (deliveryMode === "mobile_van") {
        setConfirmedFitting({
          type: "mobile_van",
          address: mobileAddress || "Doorstep",
          date: selectedDate,
          time: selectedTimeSlot,
        });
      } else {
        setConfirmedFitting({
          type: "free_shipping",
        });
      }

      await refresh();
      setActiveSection("contact");
    } catch (e) {
      console.error("Failed saving fitting in overview:", e);
      setActiveSection("contact");
    }
  };

  // Dynamic Price Calculations directly from Magento cart
  const discounts = cart?.prices?.discounts ?? [];
  const discountAmount = discounts.reduce((s, d) => s + Math.abs(d.amount.value), 0);
  const appliedTaxes = cart?.prices?.applied_taxes ?? [];
  const shippingAmount = cart?.shipping_addresses?.[0]?.selected_shipping_method?.amount?.value ?? 0;
  const vatAmount = appliedTaxes.reduce((s, t) => s + t.amount.value, 0);
  const vatRatePct = subtotalExclTax > 0 && vatAmount > 0 ? Math.round((vatAmount / subtotalExclTax) * 100) : 5;
  const vatLabel = appliedTaxes[0]?.label || "VAT";
  const additionalCharge = shippingAmount;
  const grandTotalValue =
    cart?.prices?.grand_total?.value ||
    grandTotal ||
    Math.round((subtotalExclTax + vatAmount + shippingAmount - discountAmount) * 100) / 100;
  const appliedCoupon = cart?.applied_coupons?.[0]?.code;

  // Handle Coupon in-drawer
  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    setCouponSuccess(false);
    try {
      const err = await applyCoupon(couponCode.trim());
      if (err) {
        setCouponError(err);
      } else {
        setCouponSuccess(true);
        setCouponCode("");
      }
    } catch {
      setCouponError("Could not apply coupon.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponLoading(true);
    setCouponError("");
    try {
      await removeCoupon();
    } catch {
      setCouponError("Could not remove coupon.");
    } finally {
      setCouponLoading(false);
    }
  };

  // Place Order directly from Overview Drawer (100% Real Live Flow)
  const handlePlaceOrder = async () => {
    if (!cartId) {
      setOrderError("No active cart found. Please add tyres first.");
      return;
    }

    const activeShipping = sameAsShipping ? form : {
      firstname: shippingForm.firstname,
      lastname: shippingForm.lastname,
      company: shippingForm.company,
      street: shippingForm.street,
      city: shippingForm.city,
      country_code: shippingForm.country_code,
      postcode: shippingForm.postcode,
      phone: shippingForm.telephone,
      email: shippingForm.email,
    };

    if (!form.firstname || !form.lastname) {
      setOrderError("Please enter your Billing First Name and Last Name.");
      return;
    }
    if (!form.street || !form.city) {
      setOrderError("Please enter your Billing Street Address and City.");
      return;
    }
    if (!form.phone) {
      setOrderError("Please enter your Billing Mobile Number.");
      return;
    }

    if (!sameAsShipping) {
      if (!activeShipping.firstname || !activeShipping.lastname) {
        setOrderError("Please enter your Shipping First Name and Last Name.");
        return;
      }
      if (!activeShipping.street || !activeShipping.city) {
        setOrderError("Please enter your Shipping Street Address and City.");
        return;
      }
      if (!activeShipping.phone) {
        setOrderError("Please enter your Shipping Mobile Number.");
        return;
      }
    }

    setPlacingOrder(true);
    setOrderError("");

    try {
      const tok = cartToken || undefined;
      const emailToUse = form.email || activeShipping.email || `${form.phone.replace(/\D/g, "")}@tyresworld.ae`;

      const vehicleString = [
        selectedMake ? `Make: ${selectedMake}` : "",
        selectedModel ? `Model: ${selectedModel}` : "",
        selectedYear ? `Year: ${selectedYear}` : "",
        vehiclePlate ? `Plate: ${vehiclePlate}` : "",
      ]
        .filter(Boolean)
        .join(", ");

      const shippingPayload = {
        firstname: activeShipping.firstname,
        lastname: activeShipping.lastname,
        company: activeShipping.company || undefined,
        street: [activeShipping.street, vehicleString].filter(Boolean),
        city: activeShipping.city || form.city || "",
        postcode: activeShipping.postcode || "00000",
        country_code: activeShipping.country_code || "AE",
        telephone: activeShipping.phone,
      };

      const billingPayload = {
        firstname: form.firstname,
        lastname: form.lastname,
        company: form.company || undefined,
        street: [form.street],
        city: form.city || "",
        postcode: form.postcode || "00000",
        country_code: form.country_code || "AE",
        telephone: form.phone,
      };

      // 1. Set guest email
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "setEmail", cartId, email: emailToUse, token: tok }),
      });

      // 2. Set Shipping Address
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "setShippingAddress", cartId, address: shippingPayload, token: tok }),
      });

      // 3. Set Installer Selection if free shipping
      if (deliveryMode === "free_shipping") {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            op: "setInstallerSelection",
            cartId,
            deliveryMode: "free_shipping",
            token: tok,
          }),
        });
      }

      // 4. Set Billing Address
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "setBilling",
          cartId,
          sameAsShipping,
          address: billingPayload,
          token: tok,
        }),
      });

      // 5. Set Payment Method
      const selectedPm = paymentMethods.find((p) => p.id === paymentMethod);
      const codeToSend = selectedPm?.code || paymentMethod;
      const pmRes = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "setPayment", cartId, code: codeToSend, token: tok }),
      });
      const pmData = await pmRes.json();
      if (pmData.error) throw new Error(String(pmData.error));

      // 6. Place Order
      const ordRes = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "placeOrder",
          cartId,
          token: tok,
          orderComments: orderComments || undefined,
        }),
      });
      const ordData = await ordRes.json();
      if (ordData.error) throw new Error(String(ordData.error));

      const placedNumber = ordData.orderNumber ? String(ordData.orderNumber) : `TW-${Date.now().toString().slice(-6)}`;
      setCompletedOrderNumber(placedNumber);
      clearLocal();
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "Failed to place order. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const stepsList = [
    { num: 1, name: "Select Tyres", desc: "Choose genuine branded tyres", key: "browse" },
    { num: 2, name: "Shopping Cart", desc: "Review items & quantities", key: "cart" },
    { num: 3, name: "Installer Network", desc: "Select delivery & fitting option", key: "fitting" },
    { num: 4, name: "Contact & Vehicle", desc: "Customer info, address & payment", key: "contact" },
    { num: 5, name: "Order Confirmed", desc: "Live order placement & receipt", key: "success" },
  ];

  return (
    <>
      {/* ── Floating Side Trigger Tab (Right edge) ── */}
      <button
        type="button"
        onClick={toggleDrawer}
        aria-label="Open Overview"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-gray-950 hover:bg-[#ed1c24] text-white py-3 px-2 rounded-l-2xl shadow-2xl border-y border-l border-white/20 transition-all duration-300 flex flex-col items-center gap-2 group cursor-pointer"
      >
        <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
          <Sparkles size={13} className="text-amber-400" />
        </div>
        <span className="text-[11px] font-black uppercase tracking-widest [writing-mode:vertical-rl] rotate-180 select-none py-1">
          Overview
        </span>
        {totalTyres > 0 && (
          <span className="w-5 h-5 rounded-full bg-[#ed1c24] group-hover:bg-white group-hover:text-[#ed1c24] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
            {totalTyres}
          </span>
        )}
      </button>

      {/* ── Backdrop Overlay ── */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 overscroll-contain touch-none ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeDrawer}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* ── Overview Drawer Panel (Complete In-Drawer Purchase Flow) ── */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-[420px] sm:max-w-[540px] md:max-w-[620px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out transform overscroll-contain ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Your Overview"
      >
        {/* ── 1. Header (Matching User Screenshot) ── */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-gray-100 shrink-0 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* TyresWorld Logo Mark */}
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo/tires-logo.png"
                  alt="TyresWorld"
                  className="w-full h-full object-contain"
                />
              </div>

              <h2 className="text-xl sm:text-[22px] font-black text-gray-950 tracking-tight leading-none font-sans">
                Tyres & fitment
              </h2>
            </div>

            <button
              type="button"
              onClick={closeDrawer}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close Overview"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ── SUCCESS SCREEN: Order Completed Directly In-Drawer ── */}
        {completedOrderNumber ? (
          <div className="flex-1 overflow-y-scroll p-6 flex flex-col justify-between custom-scrollbar bg-[#fcfdfd] [scrollbar-gutter:stable]">
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Order Confirmed
                </span>
                <h3 className="text-2xl font-black text-gray-950 mt-2 font-sans">
                  Thank You For Your Purchase!
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Your order has been successfully placed in our system.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-xs text-left space-y-2.5">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-100">
                  <span className="font-semibold text-gray-500">Order Number:</span>
                  <span className="font-black text-gray-950 text-sm">{completedOrderNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-100">
                  <span className="font-semibold text-gray-500">Customer:</span>
                  <span className="font-bold text-gray-900">{form.firstname} {form.lastname}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-100">
                  <span className="font-semibold text-gray-500">Phone:</span>
                  <span className="font-bold text-gray-900">{form.phone}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-100">
                  <span className="font-semibold text-gray-500">Service:</span>
                  <span className="font-bold text-gray-900 capitalize">
                    {deliveryMode === "install_outlet" ? "Installer Workshop Fitting" : deliveryMode === "mobile_van" ? "Mobile Van Doorstep Fitting" : "Direct Tyre Shipping"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-500">Payment:</span>
                  <span className="font-bold text-gray-900">
                    {paymentMethod === "cashondelivery" ? "Cash on Fitting / Delivery" : "Card on Delivery"}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 text-left text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-gray-900">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Free Manufacturer Warranty Included</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  We'll contact you at {form.phone} with scheduling updates.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setCompletedOrderNumber(null);
                  closeDrawer();
                }}
                className="w-full py-3 px-4 rounded-xl bg-gray-950 hover:bg-[#ed1c24] text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          /* ── MAIN IN-DRAWER ACCORDION FLOW ── */
          <div className="flex-1 overflow-y-scroll divide-y divide-gray-100 custom-scrollbar [scrollbar-gutter:stable]">
            
            {/* ── 1. Progress Row (Toggles directly in drawer) ── */}
            <div className="bg-white">
              <button
                type="button"
                onClick={() => toggleSection("progress")}
                className="w-full px-5 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors cursor-pointer text-left"
              >
                <div>
                  <h3 className="text-[15px] font-black text-gray-950">Progress</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Step {currentStep} of 5 • {
                      currentStep === 1 ? "Select Tyres" :
                      currentStep === 2 ? "Cart Review" :
                      currentStep === 3 ? "Installer Network" :
                      currentStep === 4 ? "Contact & Vehicle" : "Confirmed"
                    }
                  </p>
                </div>
                <div className="text-gray-400">
                  {activeSection === "progress" ? (
                    <ChevronDown size={18} strokeWidth={2.5} />
                  ) : (
                    <ChevronRight size={18} strokeWidth={2.5} />
                  )}
                </div>
              </button>

              {/* In-drawer Progress details */}
              {activeSection === "progress" && (
                <div className="px-5 sm:px-6 pb-5 pt-2 bg-gray-50/70 border-t border-gray-100 space-y-2 animate-in fade-in duration-200">
                  {stepsList.map((st) => {
                    const isPassed = currentStep > st.num;
                    const isCurr = currentStep === st.num;
                    const isClickable = st.key !== "success";

                    return (
                      <div
                        key={st.num}
                        onClick={
                          isClickable
                            ? () => {
                                if (st.key === "browse") {
                                  closeDrawer();
                                  router.push(`/${locale}`);
                                } else if (st.key === "cart") {
                                  setActiveSection("cart");
                                } else if (st.key === "fitting") {
                                  setActiveSection("fitting");
                                } else if (st.key === "contact") {
                                  setActiveSection("contact");
                                }
                              }
                            : undefined
                        }
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                          isClickable ? "cursor-pointer" : "cursor-default"
                        } ${
                          isCurr
                            ? "bg-white border-[#ed1c24] shadow-xs"
                            : isPassed
                            ? "bg-white border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/20 text-gray-900 shadow-2xs"
                            : "bg-white/80 border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                              isCurr
                                ? "bg-[#ed1c24] text-white shadow-xs"
                                : isPassed
                                ? "bg-emerald-600 text-white"
                                : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {isPassed ? "✓" : st.num}
                          </span>
                          <div>
                            <h4
                              className={`text-xs font-bold ${
                                isCurr || isPassed ? "text-gray-900" : "text-gray-800"
                              }`}
                            >
                              {st.name}
                            </h4>
                            <p
                              className={`text-[11px] ${
                                isCurr || isPassed ? "text-gray-500" : "text-gray-400"
                              }`}
                            >
                              {st.desc}
                            </p>
                          </div>
                        </div>
                        {isCurr && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ed1c24] bg-red-50 px-2 py-0.5 rounded-md shrink-0">
                            Current
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── 2. Shopping Cart Row ── */}
            <div className="bg-white">
              <button
                type="button"
                onClick={() => toggleSection("cart")}
                className="w-full px-5 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors cursor-pointer text-left"
              >
                <div>
                  <h3 className="text-[15px] font-black text-gray-950">Cart</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {totalTyres > 0 ? `${totalTyres} ${totalTyres === 1 ? "tyre" : "tyres"}` : "Empty cart"}
                  </p>
                </div>
                <div className="text-gray-400">
                  {activeSection === "cart" ? (
                    <ChevronDown size={18} strokeWidth={2.5} />
                  ) : (
                    <ChevronRight size={18} strokeWidth={2.5} />
                  )}
                </div>
              </button>

              {/* In-drawer Cart Items */}
              {activeSection === "cart" && (
                <div className="px-4 sm:px-6 pb-5 pt-3 bg-gray-50/70 border-t border-gray-100 space-y-3.5 animate-in fade-in duration-200">
                  {cartError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-[#ed1c24] flex items-center justify-between animate-in fade-in duration-200">
                      <span>{cartError}</span>
                      <button
                        type="button"
                        onClick={() => setCartError(null)}
                        className="text-gray-400 hover:text-gray-700 ml-2 font-black cursor-pointer px-1"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {items.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-gray-200/80 space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto text-[#ed1c24]">
                        <ShoppingBag size={24} strokeWidth={2.2} />
                      </div>
                      <h3 className="text-base font-black text-gray-950 uppercase tracking-tight">Your cart is empty</h3>
                      <p className="text-xs text-gray-500 max-w-xs mx-auto">
                        You haven't added any tyres to your cart yet. Explore our wide range of premium tyres today.
                      </p>
                      <button
                        type="button"
                        onClick={closeDrawer}
                        className="inline-flex items-center justify-center gap-1.5 bg-[#ed1c24] hover:bg-[#c6181d] text-white font-bold text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <span>Browse Tyres</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Items List matching Cart Page Exactly */}
                      <div className="space-y-2.5">
                        {items.map((item) => {
                          const productUrl = `/${locale}/product/${item.product?.url_key ?? item.product?.sku ?? ""}`;
                          const unitPrice =
                            item.prices?.price_including_tax?.value ??
                            item.prices?.price?.value ??
                            0;
                          const rowTotal =
                            item.prices?.row_total_including_tax?.value ??
                            item.prices?.row_total?.value ??
                            0;

                          return (
                            <div
                              key={item.uid}
                              className="bg-white border border-gray-200/90 rounded-xl p-3 sm:p-3.5 shadow-2xs hover:shadow-xs transition-shadow"
                            >
                              <div className="flex gap-3 items-center">
                                {/* Thumbnail */}
                                <Link
                                  href={productUrl}
                                  onClick={closeDrawer}
                                  className="relative w-16 h-16 bg-[#fafafa] border border-gray-100 rounded-xl flex items-center justify-center p-1.5 shrink-0 hover:border-gray-300 transition-colors"
                                >
                                  <ProductImage
                                    src={item.product?.thumbnail?.url ?? ""}
                                    alt={item.product?.name ?? "Product"}
                                    fill
                                    className="object-contain"
                                    sizes="64px"
                                  />
                                </Link>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                  <Link
                                    href={productUrl}
                                    onClick={closeDrawer}
                                    className="text-xs sm:text-sm font-black text-gray-950 hover:text-[#ed1c24] line-clamp-2 leading-snug block transition-colors"
                                  >
                                    {item.product?.name ?? "Tyre"}
                                  </Link>
                                  <div className="flex items-center gap-1 text-[10.5px] text-gray-400 font-medium mt-0.5">
                                    <Package size={11} className="shrink-0" />
                                    <span>TyresWorld Certified Fitment Center</span>
                                  </div>

                                  {/* Price & Qty Row */}
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className="text-xs font-bold text-gray-600 tabular-nums">
                                      <Money value={unitPrice} currency={currency} digits={2} />
                                    </span>
                                    <span className="text-xs text-gray-300">×</span>
                                    <CartQtyDropdown
                                      uid={item.uid}
                                      quantity={item.quantity}
                                      qtyOptions={item.product?.kleverQtyOptions?.options}
                                      onUpdate={handleCartUpdateQty}
                                      disabled={updatingCartUid === item.uid}
                                    />
                                    <span className="text-xs text-gray-300">=</span>
                                    <span className="text-xs sm:text-sm font-black text-gray-950 tabular-nums">
                                      <Money value={rowTotal} currency={currency} digits={2} />
                                    </span>
                                  </div>
                                </div>

                                {/* Remove Button */}
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.uid)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#ed1c24] hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors cursor-pointer shrink-0 self-start mt-0.5"
                                  aria-label="Remove item"
                                >
                                  <Trash2 size={15} strokeWidth={2.2} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Coupon Code Box */}
                      <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-2 shadow-2xs">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            placeholder="Enter coupon code"
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs uppercase font-semibold focus:outline-hidden focus:border-[#ed1c24]"
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={couponLoading || !couponCode.trim()}
                            className="px-4 py-2 bg-gray-900 hover:bg-[#ed1c24] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                          >
                            {couponLoading ? "Applying..." : "Apply"}
                          </button>
                        </div>
                        {couponError && <p className="text-[11px] text-red-600 font-bold">{couponError}</p>}
                        {couponSuccess && <p className="text-[11px] text-emerald-600 font-bold">Coupon applied successfully!</p>}
                        {appliedCoupons.map((c) => (
                          <div key={c.code} className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg font-medium">
                            <span>Coupon <strong>{c.code}</strong> applied</span>
                            <button
                              type="button"
                              onClick={() => removeCoupon()}
                              className="text-gray-400 hover:text-red-600 font-bold px-1"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Order Summary Pricing Breakdown */}
                      <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 sm:p-4 space-y-2.5 shadow-2xs">
                        <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                          <span>Subtotal</span>
                          <span className="font-bold text-gray-950 tabular-nums text-xs sm:text-sm">
                            <Money value={subtotalExclTax} currency={currency} digits={2} />
                          </span>
                        </div>

                        {additionalCharge > 0 && (
                          <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                            <span>Additional Charge</span>
                            <span className="font-bold text-gray-950 tabular-nums">
                              <Money value={additionalCharge} currency={currency} digits={2} />
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>Professional Fitting</span>
                          <span className="font-bold text-emerald-600">FREE</span>
                        </div>

                        {discountAmount > 0 && (
                          <div className="flex justify-between items-center text-xs text-emerald-600 font-bold">
                            <span>Discount</span>
                            <span>-<Money value={discountAmount} currency={currency} digits={2} /></span>
                          </div>
                        )}

                        {vatAmount > 0 && (
                          <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                            <span>{vatLabel}{vatRatePct !== null ? ` (${vatRatePct}%)` : ""}</span>
                            <span className="font-bold text-gray-950 tabular-nums">
                              <Money value={vatAmount} currency={currency} digits={2} />
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-gray-100 font-bold text-gray-900">
                          <span className="text-xs sm:text-sm uppercase tracking-wide">Order Total</span>
                          <span className="text-sm sm:text-base font-black text-gray-950 tabular-nums">
                            <Money value={grandTotal} currency={currency} digits={2} />
                          </span>
                        </div>
                      </div>

                      {/* Next button to Installer Network inside drawer */}
                      <button
                        type="button"
                        onClick={() => setActiveSection("fitting")}
                        className="w-full py-3 px-4 rounded-xl bg-black hover:bg-[#ed1c24] text-center text-xs font-extrabold uppercase tracking-wider text-white transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                      >
                        <span>CONTINUE TO INSTALLER NETWORK</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── 3. Installer Network Row (Exact Match to User Images) ── */}
            <div className="bg-white">
              <button
                type="button"
                onClick={() => toggleSection("fitting")}
                className="w-full px-5 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors cursor-pointer text-left"
              >
                <div>
                  <h3 className="text-[15px] font-black text-gray-950">Installer network</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {selectedStore
                      ? `Install at Outlet: ${selectedStore.name}`
                      : confirmedFitting?.name && (selectedCity === "All" || confirmedFitting.address?.toLowerCase().includes(selectedCity.toLowerCase()) || confirmedFitting.name?.toLowerCase().includes(selectedCity.toLowerCase()))
                      ? `Install at Outlet: ${confirmedFitting.name}`
                      : confirmedFitting?.type === "mobile_van"
                      ? `Mobile Van Service (${confirmedFitting.address || ""})`
                      : deliveryMode === "mobile_van"
                      ? "Mobile Van Service (Doorstep)"
                      : deliveryMode === "free_shipping"
                      ? "Free Shipping (Delivery Only)"
                      : selectedCity && selectedCity !== "All"
                      ? `Select fitting partner in ${selectedCity}`
                      : "Select fitting option & partner"}
                  </p>
                </div>
                <div className="text-gray-400">
                  {activeSection === "fitting" ? (
                    <ChevronDown size={18} strokeWidth={2.5} />
                  ) : (
                    <ChevronRight size={18} strokeWidth={2.5} />
                  )}
                </div>
              </button>

              {/* In-drawer Real Store Locator View */}
              {activeSection === "fitting" && (
                <div className="px-4 sm:px-6 pb-6 pt-3 bg-[#f9fafb] border-t border-gray-100 space-y-4 animate-in fade-in duration-200">
                  
                  {/* 1. Header: Title + Subtitle */}
                  <div className="space-y-0.5">
                    <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-gray-950 font-sans">
                      TYRE FITTING PARTNERS NEAR YOU
                    </h3>
                    <p className="text-[11px] sm:text-xs text-gray-500">
                      Enter your area or city to see nearby fitting partners.
                    </p>
                  </div>

                  {/* 2. City Filter Pills */}
                  <div
                    onWheel={(e) => {
                      if (e.deltaY !== 0) {
                        e.currentTarget.scrollLeft += e.deltaY;
                      }
                    }}
                    className="flex items-center gap-1.5 w-full max-w-full overflow-x-auto min-h-[36px] pb-1 pt-0.5 scroll-smooth touch-pan-x scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {cities.length === 0 ? (
                      <div className="flex items-center gap-1.5 py-0.5">
                        {[48, 72, 54, 52, 56, 64].map((w, i) => (
                          <div
                            key={i}
                            style={{ width: `${w}px` }}
                            className="h-[26px] bg-gray-200/80 rounded-full animate-pulse shrink-0"
                          />
                        ))}
                      </div>
                    ) : (
                      cities.map((city) => {
                        const isActive = selectedCity.toLowerCase() === city.toLowerCase();
                        return (
                          <button
                            key={city}
                            type="button"
                            onClick={() => {
                              setSelectedCity(city);
                              setSelectedStoreId(null);
                              setConfirmedFitting(null);
                            }}
                            className={`px-3.5 py-1 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer select-none border ${
                              isActive
                                ? "bg-[#ed1c24] border-[#ed1c24] text-white shadow-xs"
                                : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:text-gray-900"
                            }`}
                          >
                            {city}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* 3. Search & Location Row */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1 bg-white border border-gray-300 rounded-xl flex items-center px-3 py-2.5 shadow-2xs focus-within:border-black transition-all">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-2" />
                      <input
                        type="text"
                        placeholder="Enter area or city"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="text-xs text-gray-400 hover:text-gray-700 font-bold px-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        className="bg-black hover:bg-[#ed1c24] text-white px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-2xs"
                      >
                        <Search size={13} />
                        <span>Search</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleUseMyLocation}
                        disabled={locating}
                        className="border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-semibold text-xs transition-colors cursor-pointer shrink-0 disabled:opacity-75 shadow-2xs min-w-[130px] sm:min-w-[138px]"
                      >
                        {locating ? (
                          <Loader2 size={13} className="animate-spin text-[#ed1c24] shrink-0" />
                        ) : (
                          <Crosshair size={13} className="text-emerald-700 shrink-0" />
                        )}
                        <span className="text-emerald-950 font-semibold text-[11px] sm:text-xs whitespace-nowrap">
                          {locating ? "Locating..." : "Use my location"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 4. 3 Delivery Option Cards */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Option 1: Install at Outlet */}
                    <button
                      type="button"
                      onClick={() => setDeliveryMode("install_outlet")}
                      className={`p-3 rounded-xl border-2 transition-colors cursor-pointer flex flex-col items-center justify-center text-center ${
                        deliveryMode === "install_outlet"
                          ? "border-[#ed1c24] bg-[#f0f9f6] shadow-xs"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 ${
                          deliveryMode === "install_outlet" ? "bg-[#ed1c24] text-white" : "bg-[#e8f6f0] text-[#ed1c24]"
                        }`}
                      >
                        <Store size={18} />
                      </div>
                      <h4 className="font-bold text-xs text-gray-900 leading-tight">Install at Outlet</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight hidden sm:block">
                        Visit our outlet for professional installation
                      </p>
                    </button>

                    {/* Option 2: Mobile Van Service */}
                    <button
                      type="button"
                      onClick={() => setDeliveryMode("mobile_van")}
                      className={`p-3 rounded-xl border-2 transition-colors cursor-pointer flex flex-col items-center justify-center text-center ${
                        deliveryMode === "mobile_van"
                          ? "border-[#ed1c24] bg-[#f0f9f6] shadow-xs"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 ${
                          deliveryMode === "mobile_van" ? "bg-[#ed1c24] text-white" : "bg-[#e8f6f0] text-[#ed1c24]"
                        }`}
                      >
                        <Truck size={18} />
                      </div>
                      <h4 className="font-bold text-xs text-gray-900 leading-tight">Mobile Van Service</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight hidden sm:block">
                        Our mobile van comes to your location
                      </p>
                    </button>

                    {/* Option 3: Free Shipping */}
                    <button
                      type="button"
                      onClick={() => setDeliveryMode("free_shipping")}
                      className={`p-3 rounded-xl border-2 transition-colors cursor-pointer flex flex-col items-center justify-center text-center ${
                        deliveryMode === "free_shipping"
                          ? "border-[#ed1c24] bg-[#f0f9f6] shadow-xs"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 ${
                          deliveryMode === "free_shipping" ? "bg-[#ed1c24] text-white" : "bg-[#e8f6f0] text-[#ed1c24]"
                        }`}
                      >
                        <Package size={18} />
                      </div>
                      <h4 className="font-bold text-xs text-gray-900 leading-tight">Free Shipping</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight hidden sm:block">
                        Delivery without fitment service
                      </p>
                    </button>
                  </div>

                  {/* ── Mode 1 Content: Install at Outlet (Store Cards List Matching User Screenshot) ── */}
                  {deliveryMode === "install_outlet" && (
                    <div className="space-y-3">
                      {storesLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-[138px] bg-gray-200/70 rounded-xl animate-pulse" />
                          ))}
                        </div>
                      ) : filteredBranches.length === 0 ? (
                        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-2xs">
                          <p className="text-gray-500 text-xs">
                            No fitting partners found for this search or city.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCity("All");
                              setSearchQuery("");
                            }}
                            className="mt-2 text-xs font-bold text-[#ed1c24] hover:underline cursor-pointer"
                          >
                            Reset Filters
                          </button>
                        </div>
                      ) : (
                        filteredBranches.map((branch) => {
                          const isSelected = selectedStoreId === branch.id;
                          const isExpanded = expandedStoreId === branch.id;

                          return (
                            <div
                              key={branch.id}
                              className={`relative bg-white rounded-xl border border-l-4 transition-colors duration-150 ${
                                isExpanded
                                  ? "border-gray-400 shadow-md border-l-[#ed1c24] z-40"
                                  : isSelected
                                  ? "border-gray-300 shadow-xs border-l-[#ed1c24] z-10"
                                  : "border-gray-200/90 border-l-transparent hover:border-gray-300 z-0"
                              } p-4`}
                            >
                              <div
                                onClick={() => handleToggleStore(branch.id)}
                                className="flex items-start gap-3 cursor-pointer group"
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleToggleStore(branch.id);
                                  }
                                }}
                              >
                                <StoreBadgeIcon />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <h4
                                      className={`font-extrabold text-xs sm:text-sm uppercase tracking-tight line-clamp-1 transition-colors flex items-center gap-1.5 ${
                                        isExpanded ? "text-[#ed1c24]" : "text-gray-950 group-hover:text-[#ed1c24]"
                                      }`}
                                    >
                                      <span>{branch.name}</span>
                                      {spinningStoreId === branch.id ? (
                                        <Loader2 className="w-3.5 h-3.5 text-[#ed1c24] animate-spin shrink-0" />
                                      ) : (
                                        <ChevronDown
                                          className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                                            isExpanded ? "rotate-180 text-[#ed1c24]" : "text-gray-400 group-hover:text-[#ed1c24]"
                                          }`}
                                        />
                                      )}
                                    </h4>
                                  </div>
                                  <p className="text-xs text-gray-500 flex items-start gap-1 mt-1 leading-snug">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                    <span>{branch.address}</span>
                                  </p>
                                  <p className="text-xs font-bold text-gray-800 mt-1.5 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#ed1c24]" />
                                    <span>{(branch.distance !== undefined ? branch.distance : 0).toFixed(2)} kilometer</span>
                                  </p>
                                </div>
                              </div>

                              {/* Bottom Actions Row */}
                              <div className="flex flex-wrap items-center justify-between gap-2.5 mt-3 pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-3 text-xs font-medium text-gray-600">
                                  {branch.whatsapp ? (
                                    <a
                                      href={`https://wa.me/${branch.whatsapp.replace(/[^0-9]/g, "")}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
                                    >
                                      <WhatsAppIcon />
                                      <span>WhatsApp</span>
                                    </a>
                                  ) : (
                                    <a
                                      href="https://wa.me/971500000000"
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
                                    >
                                      <WhatsAppIcon />
                                      <span>WhatsApp</span>
                                    </a>
                                  )}
                                  <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${branch.lat || 24.36},${branch.lng || 54.51}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 hover:text-[#ed1c24] transition-colors"
                                  >
                                    <Navigation size={12} className="text-gray-400" />
                                    <span>Directions</span>
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStore(branch.id)}
                                    className="flex items-center gap-1 hover:text-gray-900 transition-colors cursor-pointer text-gray-500"
                                  >
                                    <span>See on Map</span>
                                  </button>
                                </div>
                              </div>

                              {/* Floating Anchored Popover Overlay directly under Red Store Name */}
                              {isExpanded && (
                                <div className="absolute left-2 right-2 top-[44px] z-50 bg-white rounded-2xl border border-gray-300 shadow-2xl p-4 sm:p-4.5 animate-in fade-in zoom-in-95 duration-150">
                                  {/* Upward Caret Pointer Arrow (pointing straight to red name) */}
                                  <div className="absolute -top-2 left-[58px] w-4 h-4 bg-white border-t border-l border-gray-300 rotate-45 transform" />

                                  <div className="relative flex items-center justify-between pb-2 mb-3 border-b border-gray-100">
                                    <p className="text-[11.5px] font-extrabold uppercase text-gray-950 tracking-wider font-sans flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-[#ed1c24]" />
                                      <span>SELECT FITTING DATE & TIME SLOT</span>
                                    </p>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedStoreId(null);
                                      }}
                                      className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                                      aria-label="Close"
                                    >
                                      ✕
                                    </button>
                                  </div>

                                  <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3.5">
                                    <div>
                                      <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                                        Preferred Date
                                      </label>
                                      <select
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-xs text-gray-900 outline-none focus:border-black cursor-pointer shadow-2xs"
                                      >
                                        <option value="">Select Date</option>
                                        {upcomingDates.map((d) => (
                                          <option key={d.value} value={d.value}>
                                            {d.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                                        Time Slot
                                      </label>
                                      <select
                                        value={selectedTimeSlot}
                                        onChange={(e) => setSelectedTimeSlot(e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-xs text-gray-900 outline-none focus:border-black cursor-pointer shadow-2xs"
                                      >
                                        <option value="">Select Time Slot</option>
                                        {timeSlots.map((t) => (
                                          <option key={t} value={t}>
                                            {t}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleSaveFitting(branch)}
                                    className="relative w-full bg-black hover:bg-[#ed1c24] text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                                  >
                                    <span>CONFIRM & PROCEED TO CHECKOUT</span>
                                    <ArrowRight size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* ── Mode 2 Details: Mobile Van Service ── */}
                  {deliveryMode === "mobile_van" && (
                    <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-3">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                        <MobileVanBadgeIcon />
                        <div>
                          <h4 className="font-extrabold text-xs sm:text-sm text-gray-950 uppercase">
                            Free Mobile Van Fitting Service
                          </h4>
                          <p className="text-[11px] text-gray-500">
                            Our fully equipped mobile van fits tyres at your doorstep anywhere in UAE.
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-gray-700 uppercase mb-1">
                          Doorstep Fitting Location in UAE *
                        </label>
                        <input
                          type="text"
                          value={mobileAddress}
                          onChange={(e) => setMobileAddress(e.target.value)}
                          placeholder="e.g. Villa 12, Al Barsha 2, Dubai"
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-[#ed1c24]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10.5px] font-bold text-gray-700 uppercase mb-1">
                            Fitting Date
                          </label>
                          <select
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer"
                          >
                            <option value="">Select Date</option>
                            {upcomingDates.map((d) => (
                              <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10.5px] font-bold text-gray-700 uppercase mb-1">
                            Time Slot
                          </label>
                          <select
                            value={selectedTimeSlot}
                            onChange={(e) => setSelectedTimeSlot(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer"
                          >
                            <option value="">Select Time Slot</option>
                            {timeSlots.map((ts) => (
                              <option key={ts} value={ts}>{ts}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveFitting()}
                        className="w-full bg-black hover:bg-[#ed1c24] text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <span>CONFIRM & PROCEED TO CHECKOUT</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}

                  {/* ── Mode 3 Details: Free Shipping (Delivery Only) ── */}
                  {deliveryMode === "free_shipping" && (
                    <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                        <Package size={18} className="text-[#ed1c24]" />
                        <span className="font-extrabold text-xs sm:text-sm">Free Courier Shipping</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Your tyres will be delivered directly to your doorstep anywhere in the UAE without fitment service.
                      </p>

                      <button
                        type="button"
                        onClick={() => handleSaveFitting()}
                        className="w-full bg-black hover:bg-[#ed1c24] text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <span>CONFIRM & PROCEED TO CHECKOUT</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── 4. Contact & Vehicle Row (Complete Checkout Form) ── */}
            <div className="bg-white">
              <button
                type="button"
                onClick={() => toggleSection("contact")}
                className="w-full px-5 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors cursor-pointer text-left"
              >
                <div>
                  <h3 className="text-[15px] font-black text-gray-950">Contact & vehicle</h3>
                  <p className="">
                    {form.firstname ? `${form.firstname} ${form.lastname} • ${form.city}` : "Customer info & vehicle details"}
                  </p>
                </div>
                <div className="text-gray-400">
                  {activeSection === "contact" ? (
                    <ChevronDown size={18} strokeWidth={2.5} />
                  ) : (
                    <ChevronRight size={18} strokeWidth={2.5} />
                  )}
                </div>
              </button>

              {/* In-drawer Complete Checkout Form Matching Checkout Page */}
              {activeSection === "contact" && (
                <div className="px-4 sm:px-6 pb-6 pt-3 bg-[#f9fafb] border-t border-gray-100 space-y-4 animate-in fade-in duration-200">
                  {orderError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{orderError}</span>
                    </div>
                  )}

                  {/* ════ 1. BILLING ADDRESS (Matching Checkout Page Image 1 & 2) ════ */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-[#f2f3f5] px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-700 shrink-0" />
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-900 font-sans">
                        BILLING ADDRESS
                      </h4>
                    </div>

                    <div className="p-4 space-y-3.5">
                      {/* Green Bordered Selected Address Card */}
                      {form.firstname && form.street && (
                        <div className="border-2 border-[#16a34a] rounded-lg p-3.5 bg-white space-y-1 text-xs text-gray-900 font-medium">
                          <p className="font-bold">{form.firstname} {form.lastname}</p>
                          <p>{form.street}</p>
                          <p>{form.city}, United Arab Emirates</p>
                          <p>{form.phone}</p>
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
                          className="bg-black hover:bg-[#ed1c24] text-white text-xs font-bold px-3.5 py-2 rounded-md transition-colors cursor-pointer shadow-2xs"
                        >
                          New Address
                        </button>
                      </div>

                      {/* Address is also shipping address checkbox */}
                      <div className="border border-gray-200 rounded-lg p-3 bg-white">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={sameAsShipping}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSameAsShipping(checked);
                              if (checked) {
                                setShippingForm({
                                  firstname: form.firstname,
                                  lastname: form.lastname,
                                  company: form.company,
                                  street: form.street,
                                  telephone: form.phone,
                                  city: form.city,
                                  country_code: form.country_code,
                                  postcode: form.postcode,
                                  email: form.email,
                                });
                              } else {
                                setShippingForm({
                                  firstname: customer?.firstname || "",
                                  lastname: customer?.lastname || "",
                                  company: "",
                                  street: "",
                                  telephone: "",
                                  city: "",
                                  country_code: "AE",
                                  postcode: "00000",
                                  email: customer?.email || form.email || "",
                                });
                              }
                            }}
                            className="w-4 h-4 rounded text-black accent-black cursor-pointer"
                          />
                          <span className="text-xs text-gray-700 font-medium">
                            This address is also my shipping address
                          </span>
                        </label>
                      </div>

                      {/* Saved Addresses Dropdown for Billing */}
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
                                postcode: "00000",
                                email: customer?.email || form.email || "",
                              });
                            } else {
                              const idx = Number(val);
                              if (savedAddresses[idx]) {
                                const addr = savedAddresses[idx];
                                setForm({
                                  firstname: addr.firstname,
                                  lastname: addr.lastname,
                                  company: addr.company || "",
                                  phone: addr.telephone || "",
                                  email: addr.email || "",
                                  street: addr.street,
                                  city: addr.city || "",
                                  country_code: addr.country_code || "AE",
                                  postcode: addr.postcode || "00000",
                                });
                                if (sameAsShipping) {
                                  setShippingForm(addr);
                                }
                              }
                            }
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 outline-none focus:border-black transition-all appearance-none pr-8 cursor-pointer bg-white font-medium"
                        >
                          {savedAddresses.map((addr, idx) => (
                            <option key={idx} value={String(idx)}>
                              {addr.firstname} {addr.lastname}, {addr.street}, {addr.city}, United Arab Emirates
                            </option>
                          ))}
                          <option value="new">New Address</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* ════ 2. SHIPPING ADDRESS (Shown when New Address or !sameAsShipping) ════ */}
                  {(selectedBillingOption === "new" || !sameAsShipping || savedAddresses.length === 0) && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                      <div className="bg-[#f2f3f5] px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-700 shrink-0" />
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-900 font-sans">
                          SHIPPING ADDRESS
                        </h4>
                      </div>

                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-800 mb-1">
                              First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={shippingForm.firstname}
                              onChange={(e) => setShippingForm({ ...shippingForm, firstname: e.target.value })}
                              placeholder="First Name"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:border-black transition-all bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-800 mb-1">
                              Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={shippingForm.lastname}
                              onChange={(e) => setShippingForm({ ...shippingForm, lastname: e.target.value })}
                              placeholder="Last Name"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:border-black transition-all bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-800 mb-1">
                            Company
                          </label>
                          <input
                            type="text"
                            value={shippingForm.company}
                            onChange={(e) => setShippingForm({ ...shippingForm, company: e.target.value })}
                            placeholder="Company (optional)"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:border-black transition-all bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-800 mb-1">
                            Street Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={shippingForm.street}
                            onChange={(e) => setShippingForm({ ...shippingForm, street: e.target.value })}
                            placeholder="Street, building, villa number"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:border-black transition-all bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-800 mb-1">
                              City <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <select
                                value={shippingForm.city}
                                onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:border-black transition-all bg-white appearance-none pr-8 cursor-pointer"
                              >
                                <option value="">Select City</option>
                                {cities
                                  .filter((c) => c.toLowerCase() !== "all")
                                  .map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-2.5 pointer-events-none" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-800 mb-1">
                              Country
                            </label>
                            <div className="relative">
                              <select
                                value={shippingForm.country_code}
                                onChange={(e) => setShippingForm({ ...shippingForm, country_code: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:border-black transition-all bg-white appearance-none pr-8 cursor-pointer"
                              >
                                <option value="AE">United Arab Emirates</option>
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-2.5 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-800 mb-1">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            value={shippingForm.telephone}
                            onChange={(e) => setShippingForm({ ...shippingForm, telephone: e.target.value })}
                            placeholder="e.g. 050 123 4567"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:border-black transition-all bg-white"
                          />
                        </div>

                        <div className="pt-1">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={saveInAddressBook}
                              onChange={(e) => setSaveInAddressBook(e.target.checked)}
                              className="w-4 h-4 rounded text-black accent-black cursor-pointer"
                            />
                            <span className="text-xs text-gray-800 font-medium">
                              Save in address book
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ════ 3. VEHICLE INFORMATION (Dynamic from /api/vehicles) ════ */}
                  {deliveryMode !== "free_shipping" && (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                      <div className="bg-[#f2f3f5] px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                        <Car className="w-4 h-4 text-gray-700 shrink-0" />
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-900 font-sans">
                          VEHICLE INFORMATION
                        </h4>
                      </div>

                      <div className="p-4 space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-800 mb-1">
                            Vehicle Plate
                          </label>
                          <input
                            type="text"
                            value={vehiclePlate}
                            onChange={(e) => setVehiclePlate(e.target.value)}
                            placeholder="e.g. 12345 Dubai"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:border-black transition-all bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-xs font-bold text-gray-800 mb-1">
                              Make
                            </label>
                            <div className="relative">
                              <select
                                value={selectedMake}
                                onChange={(e) => setSelectedMake(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-xs text-gray-900 outline-none focus:border-black transition-all bg-white appearance-none pr-7 cursor-pointer"
                              >
                                <option value="">Select Make</option>
                                {makes.map((m) => (
                                  <option key={m.value} value={m.label}>{m.label}</option>
                                ))}
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-2.5 pointer-events-none" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-800 mb-1">
                              Model
                            </label>
                            <div className="relative">
                              <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                disabled={!selectedMake || models.length === 0}
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-xs text-gray-900 outline-none focus:border-black transition-all bg-white appearance-none pr-7 disabled:bg-gray-50 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <option value="">Select Model</option>
                                {models.map((m) => (
                                  <option key={m.value} value={m.label}>{m.label}</option>
                                ))}
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-2.5 pointer-events-none" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-800 mb-1">
                              Year
                            </label>
                            <div className="relative">
                              <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                disabled={!selectedModel || years.length === 0}
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-2 text-xs text-gray-900 outline-none focus:border-black transition-all bg-white appearance-none pr-7 disabled:bg-gray-50 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <option value="">Select Year</option>
                                {years.map((y) => (
                                  <option key={y.value} value={y.label}>{y.label}</option>
                                ))}
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-2.5 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ════ 4. SHIPPING METHODS / SELECTED INSTALLER ════ */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-[#f2f3f5] px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-700 shrink-0" />
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-900 font-sans">
                          SHIPPING METHODS
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSection("fitting")}
                        className="text-xs font-bold text-[#ed1c24] hover:underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>

                    <div className="p-3.5">
                      <div className="border border-emerald-400 bg-[#eefaf2] rounded-xl py-3 px-3.5 text-center">
                        <div className="font-extrabold text-xs tracking-wider text-emerald-950 uppercase mb-1">
                          SELECTED INSTALLER
                        </div>
                        <div className="text-xs text-gray-800 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-medium">
                          {deliveryMode === "free_shipping" ? (
                            <span>
                              <span className="font-bold text-gray-900">Mode:</span> Free Shipping
                            </span>
                          ) : (
                            <>
                              <span>
                                <span className="font-bold text-gray-900">Mode:</span>{" "}
                                {deliveryMode === "mobile_van" ? "Mobile Van Service" : "Install at Outlet"}
                              </span>
                              <span>
                                <span className="font-bold text-gray-900">Installer:</span>{" "}
                                {deliveryMode === "mobile_van"
                                  ? "Mobile Doorstep Van"
                                  : selectedStore?.name || "Partner Outlet"}
                              </span>
                              {selectedDate && (
                                <span>
                                  <span className="font-bold text-gray-900">Date:</span> {selectedDate}
                                </span>
                              )}
                              {selectedTimeSlot && (
                                <span>
                                  <span className="font-bold text-gray-900">Time:</span> {selectedTimeSlot}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ════ 5. PAYMENT METHOD ════ */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-[#f2f3f5] px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-700 shrink-0" />
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-900 font-sans">
                        PAYMENT METHOD
                      </h4>
                    </div>

                    <div className="p-3.5 space-y-2.5">
                      {paymentMethods.map((pm) => {
                        const isSelected = paymentMethod === pm.id || paymentMethod === pm.code;
                        const isTabby =
                          pm.type === "tabby" ||
                          pm.code.toLowerCase().includes("tabby") ||
                          pm.title.toLowerCase().includes("tabby");
                        const isTamara =
                          pm.type === "tamara" ||
                          pm.code.toLowerCase().includes("tamara") ||
                          pm.title.toLowerCase().includes("tamara");

                        return (
                          <div
                            key={pm.id}
                            onClick={() => setPaymentMethod(pm.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                              isSelected
                                ? "border-[#ed1c24] bg-red-50/15 shadow-2xs"
                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                            }`}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setPaymentMethod(pm.id);
                              }
                            }}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected ? "border-[#ed1c24] bg-[#ed1c24]" : "border-gray-300 bg-white"
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <input
                                type="radio"
                                name="drawer_payment_method"
                                value={pm.id}
                                checked={isSelected}
                                onChange={() => setPaymentMethod(pm.id)}
                                className="sr-only"
                              />
                              <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
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
                                <span className={`text-xs sm:text-sm font-bold ${isSelected ? "text-gray-950" : "text-gray-800"}`}>
                                  {pm.title}
                                </span>
                              </div>
                            </div>

                            {/* Description */}
                            {pm.description && (
                              <p className="text-[11px] text-gray-500 pl-6.5 mt-1 leading-relaxed">
                                {pm.description}
                              </p>
                            )}

                            {/* Tabby Breakdown Widget */}
                            {isTabby && isSelected && (
                              <div className="ml-6.5 mt-2.5 p-3 bg-[#fbfcfd] border border-gray-200 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-gray-900">Split your purchase</span>
                                  <span className="text-[10.5px] font-bold text-gray-500">4 monthly payments</span>
                                </div>
                                <div className="space-y-1 text-[11px] text-gray-600">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sky-500 font-bold">✓</span>
                                    <span>No processing fees</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span>💳</span>
                                    <span>Use any credit or debit card</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ════ 6. ORDER SUMMARY & COMMENTS ════ */}
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-[#f2f3f5] px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gray-700 shrink-0" />
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-900 font-sans">
                        ORDER SUMMARY
                      </h4>
                    </div>

                    {/* Items in Cart & Price Breakdown Accordion */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setIsSummaryItemsOpen(!isSummaryItemsOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer select-none"
                        aria-expanded={isSummaryItemsOpen}
                      >
                        <span>{totalTyres} {totalTyres === 1 ? "Item" : "Items"} in Cart</span>
                        <ChevronDown
                          size={15}
                          className={`text-gray-500 transition-transform duration-200 ${
                            isSummaryItemsOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isSummaryItemsOpen && (
                        <div className="border-t border-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
                          {/* Items List */}
                          <div className="divide-y divide-gray-100 max-h-[220px] overflow-y-auto px-4 py-1.5 custom-scrollbar [scrollbar-gutter:stable] bg-gray-50/40">
                            {items.length === 0 ? (
                              <p className="text-xs text-gray-400 py-3 text-center italic">
                                Your cart is empty
                              </p>
                            ) : (
                              items.map((it) => (
                                <div key={it.uid} className="flex items-center gap-3 py-2.5">
                                  <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-2xs">
                                    <img
                                      src={it.product.thumbnail?.url ?? "/images/home/tyre.webp"}
                                      alt={it.product.name}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-900 truncate">
                                      {it.product.name}
                                    </p>
                                    <p className="text-[11px] text-gray-500">Qty: {it.quantity}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="text-xs font-black text-[#ed1c24]">
                                      <Money
                                        value={it.prices?.row_total?.value || (it.prices?.price?.value || 0) * it.quantity}
                                        currency={currency}
                                        digits={2}
                                      />
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Price Breakdown */}
                          <div className="px-4 py-3 space-y-2 text-xs bg-white border-t border-gray-100">
                            <div className="flex justify-between text-gray-700 font-medium">
                              <span>Cart Subtotal</span>
                              <span className="font-bold text-gray-900">
                                <Money value={subtotalExclTax} currency={currency} digits={2} />
                              </span>
                            </div>

                            <div className="flex justify-between text-gray-700 font-medium">
                              <span>Additional Charge</span>
                              <span className="font-bold text-gray-900">
                                <Money value={shippingAmount} currency={currency} digits={2} />
                              </span>
                            </div>

                            {discountAmount > 0 && (
                              <div className="flex justify-between text-[#ed1c24] font-bold">
                                <span>Discount</span>
                                <span>− <Money value={discountAmount} currency={currency} digits={2} /></span>
                              </div>
                            )}

                            <div className="flex justify-between text-gray-700 font-medium">
                              <span>{vatLabel} ({vatRatePct}%)</span>
                              <span className="font-bold text-gray-900">
                                <Money value={vatAmount} currency={currency} digits={2} />
                              </span>
                            </div>

                            <div className="flex justify-between text-sm font-black text-gray-950 border-t border-gray-100 pt-2.5">
                              <span>Order Total</span>
                              <span className="font-black text-gray-950 text-base">
                                <Money value={grandTotalValue} currency={currency} digits={2} />
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Accordion: Use Coupon Code */}
                    <div className="border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setIsCouponOpen(!isCouponOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer select-none"
                        aria-expanded={isCouponOpen}
                      >
                        <span>Use Coupon Code</span>
                        <ChevronDown
                          size={15}
                          className={`text-gray-500 transition-transform duration-200 ${
                            isCouponOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isCouponOpen && (
                        <div className="p-3.5 bg-gray-50/70 border-t border-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
                          {appliedCoupon ? (
                            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                              <div>
                                <p className="text-[10px] text-gray-500 font-medium">Applied Code</p>
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
                                placeholder="Enter coupon code"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                disabled={couponLoading}
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 outline-none focus:border-black bg-white"
                              />
                              <button
                                type="submit"
                                disabled={couponLoading || !couponCode.trim()}
                                className="bg-black text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#ed1c24] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0"
                              >
                                {couponLoading && <Loader2 size={11} className="animate-spin" />}
                                <span>Apply</span>
                              </button>
                            </form>
                          )}
                          {couponError && <p className="text-[10px] text-red-600 font-medium mt-1">{couponError}</p>}
                          {couponSuccess && <p className="text-[10px] text-emerald-600 font-medium mt-1">Coupon applied!</p>}
                        </div>
                      )}
                    </div>

                    {/* Accordion: Order Comments */}
                    <div className="border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-gray-800 hover:bg-gray-50 transition-colors cursor-pointer select-none"
                        aria-expanded={isCommentsOpen}
                      >
                        <span>Do you have any comments regarding the order?</span>
                        <ChevronDown
                          size={15}
                          className={`text-gray-500 transition-transform duration-200 ${
                            isCommentsOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isCommentsOpen && (
                        <div className="p-3.5 bg-gray-50/70 border-t border-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
                          <textarea
                            rows={2}
                            value={orderComments}
                            onChange={(e) => setOrderComments(e.target.value)}
                            placeholder="Special requests or instructions..."
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 outline-none focus:border-black resize-none bg-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ════ PLACE ORDER CTA BUTTON ════ */}
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={placingOrder || totalTyres === 0}
                    className="w-full bg-black hover:bg-[#ed1c24] active:bg-[#c6181d] text-white font-black text-xs sm:text-sm uppercase tracking-wider py-4 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {placingOrder ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Placing Order…</span>
                      </>
                    ) : (
                      <>
                        <span>PLACE ORDER • <Money value={grandTotalValue} currency={currency} digits={2} /></span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── ════════════════ BILLING ADDRESS POPUP MODAL ════════════════ ── */}
        {showNewAddressModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="relative bg-[#f2f3f5] px-6 py-3.5 border-b border-gray-200">
                <h3 className="font-black text-sm uppercase text-gray-900 tracking-wider text-center">
                  BILLING ADDRESS
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
                      First Name
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
                      Last Name
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
                      Company
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
                      Street Address <span className="text-red-500">*</span>
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
                      Mobile Number
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
                      City
                    </label>
                    <div className="relative">
                      <select
                        value={modalAddress.city}
                        onChange={(e) => setModalAddress((prev) => ({ ...prev, city: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 outline-none focus:border-black transition-all appearance-none pr-9 cursor-pointer bg-white"
                      >
                        <option value="">Select City</option>
                        {cities
                          .filter((c) => c.toLowerCase() !== "all")
                          .map((c) => (
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
                      Save in address book
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
                      setForm({
                        firstname: modalAddress.firstname,
                        lastname: modalAddress.lastname,
                        company: modalAddress.company,
                        phone: modalAddress.telephone,
                        email: modalAddress.email || form.email,
                        street: modalAddress.street,
                        city: modalAddress.city,
                        country_code: modalAddress.country_code,
                        postcode: modalAddress.postcode,
                      });
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
                    Ship Here
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewAddressModal(false)}
                    className="bg-black hover:bg-neutral-800 text-white text-xs font-bold px-7 py-2.5 rounded-md transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </aside>
    </>
  );
}
