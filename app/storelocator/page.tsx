"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  MapPin,
  Search,
  Crosshair,
  Truck,
  Store,
  Package,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Navigation,
  Loader2,
} from "lucide-react";
import StoreLocatorMap, { type StoreLocation } from "@/components/StoreLocatorMap";
import { APP_CONFIG } from "@/src/config/app-config";

// Delivery option interface
interface DeliveryOption {
  id: "install_outlet" | "mobile_van" | "free_shipping" | string;
  title: string;
  subtitle: string;
  icon: string;
}

interface MobileVan {
  id: string;
  name: string;
  city?: string;
  address?: string;
  lat?: number;
  lng?: number;
  defaultDistanceKm?: number;
  distanceKm?: number;
  phone?: string;
  whatsapp?: string;
  fee?: string;
}

// Haversine distance calculator
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
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
    <svg className="w-4 h-4 fill-[#25D366]" viewBox="0 0 24 24" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function StoreBadgeIcon() {
  return (
    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-emerald-300/80 bg-white flex items-center justify-center shadow-xs">
      <img
        src="/img/independent-badge.png"
        alt="Independent Installer"
        className="w-full h-full object-contain p-0.5"
      />
    </div>
  );
}

function MobileVanBadgeIcon() {
  return (
    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-emerald-300/80 bg-[#eefaf2] flex flex-col items-center justify-center shadow-xs">
      <svg
        className="w-5 h-5 text-emerald-600"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
        <path d="M15 18H9" />
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
        <circle cx="17" cy="18" r="2" />
        <circle cx="7" cy="18" r="2" />
      </svg>
      <span className="text-[7.5px] font-black tracking-wider text-emerald-700 uppercase leading-none mt-0.5 font-sans">
        MOBILE
      </span>
    </div>
  );
}

export default function StoreLocatorPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] === "ar" ? "ar" : "en";
  const isAr = locale === "ar";

  // API Data State
  const [cities, setCities] = useState<string[]>([]);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [branches, setBranches] = useState<StoreLocation[]>([]);
  const [mobileVans, setMobileVans] = useState<MobileVan[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Interactive UI State
  const [selectedCity, setSelectedCity] = useState<string>(isAr ? "الكل" : "All");
  const [selectedDelivery, setSelectedDelivery] = useState<string>("install_outlet");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // Accordion Expand States
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);
  const [expandedVanId, setExpandedVanId] = useState<string | null>(null);

  // Booking Form Inputs
  const [mobileAddress, setMobileAddress] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");

  // Generate upcoming 10 days for date selector
  const upcomingDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 10; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const label =
        i === 0
          ? isAr
            ? `اليوم (${dateStr})`
            : `Today (${dateStr})`
          : i === 1
          ? isAr
            ? `غداً (${dateStr})`
            : `Tomorrow (${dateStr})`
          : d.toLocaleDateString(locale === "ar" ? "ar-AE" : "en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
      dates.push({ value: dateStr, label });
    }
    return dates;
  }, [locale, isAr]);

  // Fetch all data from API dynamically
  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/store-locator?locale=${locale}`);
        const data = await res.json();
        if (active && data) {
          setCities(data.cities || []);
          setDeliveryOptions(data.deliveryOptions || []);
          setBranches(data.branches || []);
          setMobileVans(data.mobileVans || []);
          setTimeSlots(data.timeSlots || []);
          if (data.deliveryOptions?.[0]?.id) {
            setSelectedDelivery(data.deliveryOptions[0].id);
          }
          if (data.branches?.[0]?.id) {
            setSelectedStoreId(data.branches[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load store locator data:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => {
      active = false;
    };
  }, [locale]);

  // Handle Geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert(isAr ? "خدمة تحديد الموقع غير مدعومة في متصفحك." : "Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setSelectedCity(isAr ? "الكل" : "All");
        setLocating(false);
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setLocating(false);
        alert(
          isAr
            ? "تعذر تحديد موقعك الحالي. يرجى البحث يدوياً."
            : "Could not determine your location. Please search manually."
        );
      },
      { timeout: 10000 }
    );
  };

  // Filtered & Sorted Stores (for Install at Outlet)
  const filteredStores = useMemo(() => {
    let result = branches.map((store) => {
      let distance = store.defaultDistanceKm ?? 1.0;
      if (userCoords) {
        distance = calculateDistanceKm(userCoords.lat, userCoords.lng, store.lat, store.lng);
      }
      return { ...store, distanceKm: distance };
    });

    // Filter by City
    if (selectedCity && selectedCity !== "All" && selectedCity !== "الكل") {
      result = result.filter(
        (s) =>
          s.city.toLowerCase() === selectedCity.toLowerCase() ||
          s.address.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q)
      );
    }

    // Sort by distance
    result.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

    return result;
  }, [branches, selectedCity, searchQuery, userCoords]);

  // Filtered & Sorted Mobile Vans (for Mobile Van Service)
  const filteredMobileVans = useMemo(() => {
    let result = mobileVans.map((van) => {
      let distance = van.defaultDistanceKm ?? 15.0;
      if (userCoords && van.lat && van.lng) {
        distance = calculateDistanceKm(userCoords.lat, userCoords.lng, van.lat, van.lng);
      }
      return { ...van, distanceKm: distance };
    });

    // Filter by City
    if (selectedCity && selectedCity !== "All" && selectedCity !== "الكل") {
      result = result.filter(
        (v) =>
          (v.city && v.city.toLowerCase() === selectedCity.toLowerCase()) ||
          (v.address && v.address.toLowerCase().includes(selectedCity.toLowerCase())) ||
          v.name.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          (v.address && v.address.toLowerCase().includes(q)) ||
          (v.city && v.city.toLowerCase().includes(q))
      );
    }

    // Sort by distance
    result.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

    return result;
  }, [mobileVans, selectedCity, searchQuery, userCoords]);

  // Proceed Checkout Handlers
  const handleProceedCheckoutStore = (store: StoreLocation) => {
    const installation = {
      type: "install_outlet",
      branch: store,
      date: selectedDate || new Date().toISOString().split("T")[0],
      time: selectedTimeSlot || "09:00 AM - 01:00 PM",
    };
    try {
      localStorage.setItem("selected_installation", JSON.stringify(installation));
    } catch {}
    router.push(`/${locale}/checkout`);
  };

  const handleProceedCheckoutVan = (van: MobileVan) => {
    const installation = {
      type: "mobile_van",
      van,
      mobileAddress,
      date: selectedDate || new Date().toISOString().split("T")[0],
      time: selectedTimeSlot || "09:00 AM - 01:00 PM",
    };
    try {
      localStorage.setItem("selected_installation", JSON.stringify(installation));
    } catch {}
    router.push(`/${locale}/checkout`);
  };

  const handleProceedCheckoutFreeShipping = () => {
    const installation = {
      type: "free_shipping",
      mobileAddress,
    };
    try {
      localStorage.setItem("selected_installation", JSON.stringify(installation));
    } catch {}
    router.push(`/${locale}/checkout`);
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="bg-[#f8f9fa] pb-10">
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
              <span className="base">{isAr ? "اختر خيار التوصيل" : "SELECT DELIVERY OPTION"}</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6 sm:pt-8">
        {/* ── Heading & City Filter Pills Row ── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-gray-950 uppercase tracking-tight font-sans">
              {isAr ? "شركاء تركيب الإطارات بالقرب منك" : "TYRE FITTING PARTNERS NEAR YOU"}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {isAr
                ? "أدخل منطقتك أو مدينتك لعرض شركاء التركيب القريبين منك."
                : "Enter your area or city to see nearby fitting partners."}
            </p>
          </div>

          {/* City Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {cities.map((city) => {
              const isSelected = selectedCity === city;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    setSelectedCity(city);
                    setSearchQuery("");
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? "bg-[#ed1c24] text-white shadow-xs"
                      : "bg-white text-gray-700 border border-gray-250 hover:border-gray-900 hover:text-black"
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Search Bar & Location Trigger ── */}
        <div className="bg-white border border-gray-200/90 rounded-xl p-2 sm:p-2.5 mb-6 shadow-2xs flex flex-col sm:flex-row items-center gap-2.5">
          <div className="flex items-center gap-2.5 flex-1 w-full px-2">
            <MapPin size={18} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? "أدخل اسم المنطقة أو المدينة..." : "Enter area or city"}
              className="w-full text-xs sm:text-sm text-gray-900 bg-transparent focus:outline-none placeholder:text-gray-400 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-gray-700 text-xs px-1.5 py-0.5 rounded-full hover:bg-gray-100 transition-colors"
                title="Clear"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              className="btn-slide-black text-xs font-black uppercase tracking-wider px-6 py-2.5 rounded-lg flex-1 sm:flex-none"
            >
              <div className="flex items-center justify-center gap-1.5">
                <Search size={14} strokeWidth={2.5} />
                <span>{isAr ? "بحث" : "Search"}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locating}
              className="border border-gray-300 hover:border-gray-900 hover:bg-gray-50 text-gray-800 text-xs font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-none disabled:opacity-60"
            >
              {locating ? (
                <Loader2 size={14} className="animate-spin text-gray-500" />
              ) : (
                <Crosshair size={14} className="text-gray-700" />
              )}
              <span>{isAr ? "موقعي الحالي" : "Use my location"}</span>
            </button>
          </div>
        </div>

        {/* ── 3 Delivery Options Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {deliveryOptions.map((opt) => {
            const isSelected = selectedDelivery === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setSelectedDelivery(opt.id)}
                className={`relative p-5 rounded-2xl border transition-all cursor-pointer text-center flex flex-col items-center justify-center shadow-2xs ${
                  isSelected
                    ? "border-[#ed1c24] ring-2 ring-[#ed1c24]/20 bg-red-50/10"
                    : "border-gray-200/90 bg-white hover:border-gray-300"
                }`}
              >
                {/* Icon in Red Circle */}
                <div className="w-12 h-12 rounded-full bg-[#ed1c24] text-white flex items-center justify-center mb-3 shadow-xs">
                  {opt.icon === "truck" ? (
                    <Truck size={22} strokeWidth={2.2} />
                  ) : opt.icon === "package" ? (
                    <Package size={22} strokeWidth={2.2} />
                  ) : (
                    <Store size={22} strokeWidth={2.2} />
                  )}
                </div>

                <h3 className="text-sm font-black text-gray-950 uppercase tracking-tight font-sans">
                  {opt.title}
                </h3>
                <p className="text-[11.5px] text-gray-500 mt-1 leading-tight">
                  {opt.subtitle}
                </p>
              </div>
            );
          })}
        </div>

        {/* ════ VIEW 1: Install at Outlet (2 Columns: Store Cards + Map) ════ */}
        {selectedDelivery === "install_outlet" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-6 items-start">
            {/* LEFT COLUMN: STORE LIST */}
            <div className="space-y-3.5">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse space-y-2.5"
                    >
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-200 rounded w-4/5" />
                      <div className="h-8 bg-gray-100 rounded w-1/3 mt-2" />
                    </div>
                  ))}
                </div>
              ) : filteredStores.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
                  <p className="text-sm font-bold text-gray-900 mb-1">
                    {isAr ? "لم يتم العثور على شركاء تركيب" : "No fitting partners found"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isAr
                      ? "جرب البحث باسم مدينة أخرى أو اختر (الكل)."
                      : "Try searching for a different city or select 'All'."}
                  </p>
                </div>
              ) : (
                filteredStores.map((store) => {
                  const isSelected = selectedStoreId === store.id;
                  const isExpanded = expandedStoreId === store.id;
                  const waText = encodeURIComponent(
                    `Hi tyresworld.ae, I would like to book a tyre fitting appointment at: ${store.name} (${store.address})`
                  );
                  const waUrl = `https://api.whatsapp.com/send/?phone=${
                    store.whatsapp || APP_CONFIG.contact.whatsapp
                  }&text=${waText}`;
                  const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`;

                  return (
                    <div
                      key={store.id}
                      className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-2xs hover:shadow-xs relative ${
                        isSelected || isExpanded
                          ? "border-l-4 border-l-[#ed1c24] border-gray-200/90 shadow-sm"
                          : "border-gray-200/80"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <StoreBadgeIcon />

                        <div className="flex-1 min-w-0">
                          {/* Store Name */}
                          <h4 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-tight leading-snug">
                            {store.name}
                          </h4>

                          {/* Address & Distance */}
                          <div className="mt-1 flex items-start gap-1 text-[11.5px] text-gray-600">
                            <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                            <span className="leading-snug">{store.address}</span>
                          </div>

                          <div className="mt-1 text-[11px] font-bold text-gray-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ed1c24]" />
                            <span>
                              {store.distanceKm != null ? `${store.distanceKm} kilometer` : "Nearby"}
                            </span>
                          </div>

                          {/* Action Links Row */}
                          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3 text-[11px] font-bold">
                              {/* WhatsApp */}
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-gray-700 hover:text-[#25D366] transition-colors"
                              >
                                <WhatsAppIcon />
                                <span>WhatsApp</span>
                              </a>

                              {/* Directions */}
                              <a
                                href={dirUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-gray-700 hover:text-black transition-colors"
                              >
                                <Navigation size={12} className="text-gray-500" />
                                <span>{isAr ? "الاتجاهات" : "Directions"}</span>
                              </a>

                              {/* See on Map */}
                              <button
                                type="button"
                                onClick={() => setSelectedStoreId(store.id)}
                                className="inline-flex items-center gap-1 text-gray-700 hover:text-[#ed1c24] transition-colors cursor-pointer"
                              >
                                <MapPin size={12} className="text-gray-500" />
                                <span>{isAr ? "عرض على الخريطة" : "See on Map"}</span>
                              </button>
                            </div>

                            {/* Book Installer Button with Toggle */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStoreId(store.id);
                                setExpandedStoreId(isExpanded ? null : store.id);
                              }}
                              className="btn-slide-red text-[11px] sm:text-xs font-black uppercase tracking-wider py-2 px-4 rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <span>{isAr ? "حجز المركز" : "Book Installer"}</span>
                              {isExpanded ? (
                                <ChevronDown size={13} strokeWidth={3} />
                              ) : (
                                <ChevronRight size={13} strokeWidth={3} />
                              )}
                            </button>
                          </div>

                          {/* ── EXPANDED BOOKING BOX (Smooth Zero-Jerk Transition) ── */}
                          <div
                            className={`grid transition-all duration-300 ease-out ${
                              isExpanded
                                ? "grid-rows-[1fr] opacity-100 mt-3.5"
                                : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="bg-[#faf1f2] rounded-2xl p-4 sm:p-5 border border-red-100/90 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                  <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1.5">
                                      {isAr ? "التاريخ المفضل" : "Preferred Date"}
                                    </label>
                                    <div className="relative">
                                      <select
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full bg-white border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-[#ed1c24] appearance-none pr-8 cursor-pointer shadow-2xs"
                                      >
                                        <option value="">{isAr ? "-- اختر التاريخ --" : "-- Select Date --"}</option>
                                        {upcomingDates.map((d) => (
                                          <option key={d.value} value={d.value}>
                                            {d.label}
                                          </option>
                                        ))}
                                      </select>
                                      <ChevronDown
                                        size={14}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1.5">
                                      {isAr ? "الوقت المفضل" : "Preferred Time"}
                                    </label>
                                    <div className="relative">
                                      <select
                                        value={selectedTimeSlot}
                                        onChange={(e) => setSelectedTimeSlot(e.target.value)}
                                        className="w-full bg-white border border-red-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-[#ed1c24] appearance-none pr-8 cursor-pointer shadow-2xs"
                                      >
                                        <option value="">{isAr ? "-- اختر الوقت --" : "-- Select Time --"}</option>
                                        {(timeSlots.length > 0
                                          ? timeSlots
                                          : [
                                              "09:00 AM - 01:00 PM",
                                              "01:00 PM - 05:00 PM",
                                              "05:00 PM - 09:00 PM",
                                            ]
                                        ).map((t) => (
                                          <option key={t} value={t}>
                                            {t}
                                          </option>
                                        ))}
                                      </select>
                                      <ChevronDown
                                        size={14}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="flex justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleProceedCheckoutStore(store)}
                                    className="btn-slide-red text-xs sm:text-sm font-bold tracking-wide py-2.5 px-6 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                                  >
                                    <span>{isAr ? "المتابعة إلى الدفع" : "Proceed to Checkout"}</span>
                                    <span className="text-base leading-none">→</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Back to Cart Button */}
              <div className="pt-2">
                <Link
                  href={`/${locale}/cart`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 hover:border-gray-900 bg-white text-gray-800 text-xs font-bold uppercase tracking-wider transition-all shadow-2xs hover:shadow-xs"
                >
                  <ArrowLeft size={14} strokeWidth={2.5} />
                  <span>{isAr ? "العودة إلى السلة" : "Back to Cart"}</span>
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN: INTERACTIVE MAP */}
            <div className="sticky top-24 h-[550px] lg:h-[650px]">
              <StoreLocatorMap
                stores={filteredStores}
                selectedStoreId={selectedStoreId}
                onSelectStore={(s) => {
                  setSelectedStoreId(s.id);
                  setExpandedStoreId(s.id);
                }}
                locale={locale}
              />
            </div>
          </div>
        )}

        {/* ════ VIEW 2: Mobile Van Service (2-Column Grid of Van Cards) ════ */}
        {selectedDelivery === "mobile_van" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse space-y-2.5"
                  >
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-4/5" />
                    <div className="h-8 bg-gray-100 rounded w-1/3 mt-2" />
                  </div>
                ))
              ) : filteredMobileVans.length === 0 ? (
                <div className="col-span-full bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
                  <p className="text-sm font-bold text-gray-900 mb-1">
                    {isAr ? "لم يتم العثور على خدمات الفان المتنقل" : "No Mobile Van services found"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isAr
                      ? "جرب البحث باسم مدينة أخرى أو اختر (الكل)."
                      : "Try searching for a different city or select 'All'."}
                  </p>
                </div>
              ) : (
                filteredMobileVans.map((van) => {
                  const isExpanded = expandedVanId === van.id;
                  const waText = encodeURIComponent(
                    `Hi tyresworld.ae, I would like to book a Mobile Van tyre fitting appointment in: ${van.name} (${van.city || van.address})`
                  );
                  const waUrl = `https://api.whatsapp.com/send/?phone=${
                    van.whatsapp || APP_CONFIG.contact.whatsapp
                  }&text=${waText}`;
                  const dirUrl =
                    van.lat && van.lng
                      ? `https://www.google.com/maps/dir/?api=1&destination=${van.lat},${van.lng}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          van.city || "Dubai"
                        )}`;

                  return (
                    <div
                      key={van.id}
                      className={`bg-white rounded-2xl border transition-all shadow-2xs hover:shadow-xs relative p-4 sm:p-5 ${
                        isExpanded ? "border-[#ed1c24] ring-2 ring-[#ed1c24]/20 shadow-md" : "border-gray-200/90"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <MobileVanBadgeIcon />

                        <div className="flex-1 min-w-0">
                          {/* Van Service Title */}
                          <h4 className="text-xs sm:text-sm font-black text-gray-950 uppercase tracking-tight leading-snug">
                            {van.name}
                          </h4>

                          {/* Address / City */}
                          <div className="mt-1 flex items-start gap-1 text-[11.5px] text-gray-600">
                            <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                            <span className="leading-snug">{van.address || van.city}</span>
                          </div>

                          {/* Distance in Kilometers */}
                          <div className="mt-1 text-[11px] font-bold text-gray-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ed1c24]" />
                            <span>
                              {van.distanceKm != null ? `${van.distanceKm} kilometers` : "Nearby"}
                            </span>
                          </div>

                          {/* Action Links & Booking Row */}
                          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3 text-[11px] font-bold">
                              {/* WhatsApp */}
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-gray-700 hover:text-[#25D366] transition-colors"
                              >
                                <WhatsAppIcon />
                                <span>WhatsApp</span>
                              </a>

                              {/* Directions */}
                              <a
                                href={dirUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-gray-700 hover:text-black transition-colors"
                              >
                                <Navigation size={12} className="text-gray-500" />
                                <span>{isAr ? "الاتجاهات" : "Directions"}</span>
                              </a>
                            </div>

                            {/* Book Mobile Van Button with Toggle */}
                            <button
                              type="button"
                              onClick={() => setExpandedVanId(isExpanded ? null : van.id)}
                              className="btn-slide-red text-[11px] sm:text-xs font-black uppercase tracking-wider py-2 px-4 rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <span>{isAr ? "حجز الفان" : "Book Mobile Van"}</span>
                              {isExpanded ? (
                                <ChevronDown size={13} strokeWidth={3} />
                              ) : (
                                <ChevronRight size={13} strokeWidth={3} />
                              )}
                            </button>
                          </div>

                          {/* ── EXPANDED MOBILE VAN BOOKING BOX (Smooth Zero-Jerk Transition) ── */}
                          <div
                            className={`grid transition-all duration-300 ease-out ${
                              isExpanded
                                ? "grid-rows-[1fr] opacity-100 mt-3.5"
                                : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="bg-[#faf1f2] rounded-2xl p-4 sm:p-5 border border-red-100/90 space-y-3.5">
                                {/* Location Input */}
                                <div>
                                  <label className="block text-xs font-bold text-gray-900 mb-1.5">
                                    {isAr ? "موقع التركيب" : "Fitting Location"}
                                  </label>
                                  <div className="relative flex items-center">
                                    <MapPin size={15} className="absolute left-3.5 text-emerald-600 pointer-events-none" />
                                    <input
                                      type="text"
                                      value={mobileAddress}
                                      onChange={(e) => setMobileAddress(e.target.value)}
                                      placeholder={isAr ? "أدخل موقعك..." : "Enter your location..."}
                                      className="w-full bg-white border border-gray-200/90 rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm font-medium text-gray-800 focus:outline-none focus:border-[#ed1c24] shadow-2xs"
                                    />
                                  </div>
                                </div>

                                {/* Date & Time Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                  <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1.5">
                                      {isAr ? "التاريخ المفضل" : "Preferred Date"}
                                    </label>
                                    <div className="relative">
                                      <select
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full bg-white border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-[#ed1c24] appearance-none pr-8 cursor-pointer shadow-2xs"
                                      >
                                        <option value="">{isAr ? "-- اختر التاريخ --" : "-- Select Date --"}</option>
                                        {upcomingDates.map((d) => (
                                          <option key={d.value} value={d.value}>
                                            {d.label}
                                          </option>
                                        ))}
                                      </select>
                                      <ChevronDown
                                        size={14}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1.5">
                                      {isAr ? "الوقت المفضل" : "Preferred Time"}
                                    </label>
                                    <div className="relative">
                                      <select
                                        value={selectedTimeSlot}
                                        onChange={(e) => setSelectedTimeSlot(e.target.value)}
                                        className="w-full bg-white border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-[#ed1c24] appearance-none pr-8 cursor-pointer shadow-2xs"
                                      >
                                        <option value="">{isAr ? "-- اختر الوقت --" : "-- Select Time --"}</option>
                                        {(timeSlots.length > 0
                                          ? timeSlots
                                          : [
                                              "09:00 AM - 01:00 PM",
                                              "01:00 PM - 05:00 PM",
                                              "05:00 PM - 09:00 PM",
                                            ]
                                        ).map((t) => (
                                          <option key={t} value={t}>
                                            {t}
                                          </option>
                                        ))}
                                      </select>
                                      <ChevronDown
                                        size={14}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Proceed to Checkout Button */}
                                <div className="flex justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleProceedCheckoutVan(van)}
                                    className="btn-slide-red text-xs sm:text-sm font-bold tracking-wide py-2.5 px-6 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                                  >
                                    <span>{isAr ? "المتابعة إلى الدفع" : "Proceed to Checkout"}</span>
                                    <span className="text-base leading-none">→</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Back to Cart Button */}
            <div className="pt-2">
              <Link
                href={`/${locale}/cart`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 hover:border-gray-900 bg-white text-gray-800 text-xs font-bold uppercase tracking-wider transition-all shadow-2xs hover:shadow-xs"
              >
                <ArrowLeft size={14} strokeWidth={2.5} />
                <span>{isAr ? "العودة إلى السلة" : "Back to Cart"}</span>
              </Link>
            </div>
          </div>
        )}

        {/* ════ VIEW 3: Free Shipping ════ */}
        {selectedDelivery === "free_shipping" && (
          <div className="flex items-center justify-between pt-2">
            <Link
              href={`/${locale}/cart`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 hover:border-gray-900 bg-white text-gray-800 text-xs font-bold uppercase tracking-wider transition-all shadow-2xs hover:shadow-xs"
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              <span>{isAr ? "العودة إلى السلة" : "Back to Cart"}</span>
            </Link>

            <button
              type="button"
              onClick={handleProceedCheckoutFreeShipping}
              className="btn-slide-red text-xs sm:text-sm font-bold tracking-wide py-2.5 px-7 rounded-lg flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span>{isAr ? "المتابعة إلى الدفع" : "Proceed to Checkout"}</span>
              <span className="text-base leading-none">→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
