"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  MapPin,
  Search,
  Crosshair,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Navigation,
  Loader2,
  Store,
  Truck,
  Package,
} from "lucide-react";
import StoreLocatorMap, { type StoreLocation } from "@/components/StoreLocatorMap";
import { useCart } from "@/lib/cart-context";
import PageHeroBanner from "@/components/PageHeroBanner";

export interface MobileVanItem {
  id: string;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  whatsapp?: string;
  email?: string;
  shipping_amount?: string | null;
  shipping_fee?: string;
  installer_type?: string;
  delivery_mode?: string;
  openingHoursByDay?: string[][];
  distanceKm?: number;
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
    <svg className="w-3.5 h-3.5 fill-[#25D366]" viewBox="0 0 24 24" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function StoreBadgeIcon() {
  return (
    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-emerald-300/80 bg-[#f0fbf5] flex items-center justify-center shadow-2xs">
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
    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-emerald-300/80 bg-[#f0fbf5] flex flex-col items-center justify-center shadow-2xs">
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

export default function StoreLocatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f9fafb]" />}>
      <StoreLocatorContent />
    </Suspense>
  );
}

function StoreLocatorContent() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] === "ar" ? "ar" : "en";
  const { cartId, cartToken, refresh, items, ready } = useCart();

  // Empty cart guard
  useEffect(() => {
    if (ready && items.length === 0) {
      router.replace(`/${locale}/cart`);
    }
  }, [ready, items.length, router, locale]);

  // API Data State (100% Dynamic from Magento GraphQL / API)
  const [cities, setCities] = useState<string[]>([]);
  const [branches, setBranches] = useState<StoreLocation[]>([]);
  const [mobileVans, setMobileVans] = useState<MobileVanItem[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Delivery Mode State
  const [deliveryMode, setDeliveryMode] = useState<"install_outlet" | "mobile_van" | "free_shipping">("install_outlet");
  const [mobileAddress, setMobileAddress] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");

  // Interactive UI State
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // Accordion Expand States
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);
  const [expandedVanId, setExpandedVanId] = useState<string | null>(null);

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
          ? `Today (${dateStr})`
          : i === 1
          ? `Tomorrow (${dateStr})`
          : d.toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
      dates.push({ value: dateStr, label });
    }
    return dates;
  }, []);

  // Fetch all data from API dynamically
  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/store-locator?locale=${locale}`);
        const data = await res.json();
        if (active && data) {
          if (data.cities?.length) setCities(data.cities);
          if (data.branches?.length) {
            setBranches(data.branches);
            setSelectedStoreId(data.branches[0].id);
          }
          if (data.mobileVans?.length) {
            setMobileVans(data.mobileVans);
          }
          if (data.timeSlots?.length) {
            setTimeSlots(data.timeSlots);
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

  const [isGeoAddress, setIsGeoAddress] = useState(false);

  // Handle User Geolocation with Reverse Geocoding
  const handleUseMyLocation = () => {
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
            setIsGeoAddress(true);
          } else {
            setSearchQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            setIsGeoAddress(true);
          }
        } catch {
          setSearchQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          setIsGeoAddress(true);
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

  // Filtered & Sorted Outlet Stores
  const filteredBranches = useMemo(() => {
    const baseCoords = userCoords || { lat: 24.3682674, lng: 54.5124881 };

    let result = branches.map((store) => {
      const distance = calculateDistanceKm(baseCoords.lat, baseCoords.lng, store.lat, store.lng);
      return { ...store, distance };
    });

    if (selectedCity && selectedCity !== "All") {
      result = result.filter(
        (s) =>
          s.city.toLowerCase() === selectedCity.toLowerCase() ||
          s.address.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    if (searchQuery.trim() && !isGeoAddress) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return 0;
    });

    return result;
  }, [branches, selectedCity, searchQuery, userCoords, isGeoAddress]);

  // Sync default selectedStoreId with filtered list
  useEffect(() => {
    if (filteredBranches.length > 0) {
      const exists = filteredBranches.some((b) => b.id === selectedStoreId);
      if (!exists || !selectedStoreId) {
        setSelectedStoreId(filteredBranches[0].id);
      }
    }
  }, [filteredBranches, selectedStoreId]);

  // Filtered & Sorted Mobile Vans
  const filteredMobileVans = useMemo(() => {
    const baseCoords = userCoords || { lat: 24.3682674, lng: 54.5124881 };

    let result = mobileVans.map((van) => {
      const distance = calculateDistanceKm(baseCoords.lat, baseCoords.lng, van.lat, van.lng);
      return { ...van, distanceKm: distance };
    });

    if (selectedCity && selectedCity !== "All") {
      result = result.filter(
        (v) =>
          v.city.toLowerCase() === selectedCity.toLowerCase() ||
          v.name.toLowerCase().includes(selectedCity.toLowerCase()) ||
          v.address.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q) ||
          v.address.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    return result;
  }, [mobileVans, selectedCity, searchQuery, userCoords]);

  // Save installer selection to Magento quote & proceed to checkout
  const handleConfirmStoreBooking = async (branch: StoreLocation) => {
    if (!selectedDate) {
      alert("Please select a preferred fitting date.");
      return;
    }
    if (!selectedTimeSlot) {
      alert("Please select a preferred time slot.");
      return;
    }

    const installData = {
      type: "install_outlet",
      branch: { id: branch.id, name: branch.name, address: branch.address, city: branch.city },
      date: selectedDate,
      time: selectedTimeSlot,
    };
    try {
      localStorage.setItem("selected_installation", JSON.stringify(installData));
    } catch {}

    if (cartId) {
      try {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            op: "setInstallerSelection",
            cartId,
            deliveryMode: "install_at_outlet",
            storeId: branch.id,
            pickupDate: installData.date,
            pickupTime: installData.time,
            token: cartToken || undefined,
          }),
        });
        await refresh();
      } catch (e) {
        console.error("Save installer error:", e);
      }
    }
    router.push(`/${locale}/checkout`);
  };

  const handleConfirmMobileVan = async (van: MobileVanItem) => {
    if (!mobileAddress.trim()) {
      alert("Please enter your fitting location/address.");
      return;
    }
    if (!selectedDate) {
      alert("Please select a preferred fitting date.");
      return;
    }
    if (!selectedTimeSlot) {
      alert("Please select a preferred time slot.");
      return;
    }

    const installData = {
      type: "mobile_van",
      vanId: van.id,
      vanName: van.name,
      mobileAddress,
      city: van.city,
      date: selectedDate,
      time: selectedTimeSlot,
      shipping_amount: van.shipping_amount,
    };
    try {
      localStorage.setItem("selected_installation", JSON.stringify(installData));
    } catch {}

    if (cartId) {
      try {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            op: "setInstallerSelection",
            cartId,
            deliveryMode: "mobile_van_service",
            storeId: van.id,
            pickupLocation: `${mobileAddress || van.address}, ${van.city}`,
            pickupDate: installData.date,
            pickupTime: installData.time,
            token: cartToken || undefined,
          }),
        });
        await refresh();
      } catch (e) {
        console.error("Save mobile van error:", e);
      }
    }
    router.push(`/${locale}/checkout`);
  };

  const handleConfirmFreeShipping = async () => {
    const installData = {
      type: "free_shipping",
    };
    try {
      localStorage.setItem("selected_installation", JSON.stringify(installData));
    } catch {}

    if (cartId) {
      try {
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
        await refresh();
      } catch (e) {
        console.error("Save free shipping error:", e);
      }
    }
    router.push(`/${locale}/checkout`);
  };

  return (
    <div dir={"ltr"} className="bg-[#f9fafb] min-h-screen pb-20 text-gray-900 font-sans">
      <PageHeroBanner
        title="Select Delivery Option"
        breadcrumbLabel="Delivery Options"
        description="Choose your preferred fitting method — certified workshop partner, mobile fitting van, or doorstep delivery across the UAE."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Row: Title & Subtitle + City Filter Pills */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900 font-sans">
              {"TYRE FITTING PARTNERS NEAR YOU"}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {"Enter your area or city to see nearby fitting partners."}
            </p>
          </div>

          {/* City Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {cities.map((city) => {
              const isActive = selectedCity.toLowerCase() === city.toLowerCase();
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#ed1c24] text-white shadow-xs"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-gray-400 hover:text-gray-900"
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mb-6">
          <div className="relative flex-1 bg-white border border-gray-300 rounded-xl flex items-center px-3.5 py-2.5 shadow-2xs focus-within:border-black transition-all">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0 rtl:ml-2.5 ltr:mr-2.5" />
            <input
              type="text"
              placeholder={"Enter area or city"}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsGeoAddress(false);
              }}
              className="w-full text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setIsGeoAddress(false);
                }}
                className="text-xs text-gray-400 hover:text-gray-700 font-bold px-1.5 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="bg-black hover:bg-[#ed1c24] text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <Search size={15} />
              <span>{"Search"}</span>
            </button>

            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locating}
              className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm transition-colors cursor-pointer shrink-0 disabled:opacity-60 shadow-2xs"
            >
              {locating ? (
                <Loader2 size={15} className="animate-spin text-[#ed1c24]" />
              ) : (
                <Crosshair size={15} className="text-emerald-700" />
              )}
              <span className="text-emerald-950 font-semibold">
                {locating ? ("Locating...") : "Use my location"}
              </span>
            </button>
          </div>
        </div>

        {/* 3 Delivery Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Option 1: Install at Outlet */}
          <button
            type="button"
            onClick={() => setDeliveryMode("install_outlet")}
            className={`p-5 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
              deliveryMode === "install_outlet"
                ? "border-2 border-[#ed1c24] bg-[#f0f9f6] shadow-xs"
                : "border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2.5 ${
                deliveryMode === "install_outlet" ? "bg-[#ed1c24] text-white" : "bg-[#e8f6f0] text-[#ed1c24]"
              }`}
            >
              <Store size={20} />
            </div>
            <h3 className="font-bold text-sm text-gray-900">{"Install at Outlet"}</h3>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
              {"Visit our outlet for professional installation"}
            </p>
          </button>

          {/* Option 2: Mobile Van Service */}
          <button
            type="button"
            onClick={() => setDeliveryMode("mobile_van")}
            className={`p-5 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
              deliveryMode === "mobile_van"
                ? "border-2 border-[#ed1c24] bg-[#f0f9f6] shadow-xs"
                : "border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2.5 ${
                deliveryMode === "mobile_van" ? "bg-[#ed1c24] text-white" : "bg-[#e8f6f0] text-[#ed1c24]"
              }`}
            >
              <Truck size={20} />
            </div>
            <h3 className="font-bold text-sm text-gray-900">{"Mobile Van Service"}</h3>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
              {"Our mobile van comes to your location"}
            </p>
          </button>

          {/* Option 3: Free Shipping */}
          <button
            type="button"
            onClick={() => setDeliveryMode("free_shipping")}
            className={`p-5 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
              deliveryMode === "free_shipping"
                ? "border-2 border-[#ed1c24] bg-[#f0f9f6] shadow-xs"
                : "border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2.5 ${
                deliveryMode === "free_shipping" ? "bg-[#ed1c24] text-white" : "bg-[#e8f6f0] text-[#ed1c24]"
              }`}
            >
              <Package size={20} />
            </div>
            <h3 className="font-bold text-sm text-gray-900">{"Free Shipping"}</h3>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
              {"Delivery without fitment service"}
            </p>
          </button>
        </div>

        {/* ════ Option 1 Content: Install at Outlet ════ */}
        {deliveryMode === "install_outlet" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_520px] gap-6 items-start">
            {/* Left: Store Cards List */}
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredBranches.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                  <p className="text-gray-500 text-sm">
                    {"No fitting partners found for this search or city."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCity("All");
                      setSearchQuery("");
                    }}
                    className="mt-3 text-xs font-bold text-[#ed1c24] hover:underline cursor-pointer"
                  >
                    {"Reset Filters"}
                  </button>
                </div>
              ) : (
                filteredBranches.map((branch) => {
                  const isSelected = selectedStoreId === branch.id;
                  const isExpanded = expandedStoreId === branch.id;

                  return (
                    <div
                      key={branch.id}
                      className={`relative bg-white rounded-xl border transition-all ${
                        isSelected
                          ? "border-gray-300 shadow-xs rtl:border-r-4 rtl:border-r-[#ed1c24] ltr:border-l-4 ltr:border-l-[#ed1c24]"
                          : "border-gray-200/90 hover:border-gray-300"
                      } p-4 sm:p-5`}
                    >
                      <div className="flex items-start gap-3.5">
                        <StoreBadgeIcon />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-xs sm:text-sm text-gray-950 uppercase tracking-tight line-clamp-1">
                            {branch.name}
                          </h4>
                          <p className="text-xs text-gray-500 flex items-start gap-1 mt-1 leading-snug">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <span>{branch.address}</span>
                          </p>
                          {branch.distance !== undefined && (
                            <p className="text-xs font-bold text-gray-800 mt-1.5 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ed1c24]" />
                              <span>{branch.distance.toFixed(2)} {"kilometer"}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bottom Actions Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
                          {branch.whatsapp && (
                            <a
                              href={`https://wa.me/${branch.whatsapp.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
                            >
                              <WhatsAppIcon />
                              <span>WhatsApp</span>
                            </a>
                          )}
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${branch.lat},${branch.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 hover:text-[#ed1c24] transition-colors"
                          >
                            <Navigation size={13} className="text-gray-400" />
                            <span>{"Directions"}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => setSelectedStoreId(branch.id)}
                            className="flex items-center gap-1 hover:text-gray-900 transition-colors cursor-pointer text-gray-500"
                          >
                            <span>{"See on Map"}</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStoreId(branch.id);
                            setExpandedStoreId(isExpanded ? null : branch.id);
                          }}
                          className="bg-[#ed1c24] hover:bg-[#c6181d] active:bg-[#aa1217] text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer rtl:mr-auto ltr:ml-auto"
                        >
                          <span>{"Book Installer"}</span>
                          <ArrowRight size={13} className="rtl:rotate-180" />
                        </button>
                      </div>

                      {/* Expandable Booking Form Drawer */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100 bg-[#f9fafb] -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 sm:p-5 rounded-b-xl animate-in fade-in duration-200">
                          <p className="text-xs font-extrabold uppercase text-gray-900 mb-3 tracking-wider">
                            {"Select Fitting Date & Time Slot"}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                {"Preferred Date"}
                              </label>
                              <select
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:border-black cursor-pointer"
                              >
                                <option value="">{"Select Date"}</option>
                                {upcomingDates.map((d) => (
                                  <option key={d.value} value={d.value}>
                                    {d.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                {"Time Slot"}
                              </label>
                              <select
                                value={selectedTimeSlot}
                                onChange={(e) => setSelectedTimeSlot(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:border-black cursor-pointer"
                              >
                                <option value="">{"Select Time Slot"}</option>
                                {(timeSlots.length > 0
                                  ? timeSlots
                                  : [
                                      "09:00 AM - 11:00 AM",
                                      "11:00 AM - 01:00 PM",
                                      "02:00 PM - 04:00 PM",
                                      "04:00 PM - 06:00 PM",
                                      "06:00 PM - 08:00 PM",
                                    ]
                                ).map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleConfirmStoreBooking(branch)}
                            className="w-full bg-black hover:bg-[#ed1c24] text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>{"Confirm & Proceed to Checkout"}</span>
                            <ArrowRight size={14} className="rtl:rotate-180" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Back to Cart Button */}
              <div className="pt-2">
                <Link
                  href={`/${locale}/cart`}
                  className="inline-flex items-center gap-2 bg-[#f3f4f6] hover:bg-gray-200 text-gray-800 font-bold text-xs px-4 py-2.5 rounded-lg border border-gray-300 transition-colors shadow-2xs cursor-pointer"
                >
                  <span className="rtl:rotate-180">←</span>
                  <span>{"Back to Cart"}</span>
                </Link>
              </div>
            </div>

            {/* Right: Map */}
            <div className="sticky top-24 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs h-[600px]">
              <StoreLocatorMap
                stores={filteredBranches}
                selectedStoreId={selectedStoreId}
                userCoords={userCoords}
                onSelectStore={(store: StoreLocation) => {
                  setSelectedStoreId(store.id);
                  setExpandedStoreId(store.id);
                }}
                locale={locale}
              />
            </div>
          </div>
        )}

        {/* ════ Option 2 Content: Mobile Van Service ════ */}
        {deliveryMode === "mobile_van" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse space-y-2.5">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-4/5" />
                    <div className="h-8 bg-gray-100 rounded w-1/3 mt-2" />
                  </div>
                ))
              ) : filteredMobileVans.length === 0 ? (
                <div className="col-span-full bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
                  <p className="text-sm font-bold text-gray-900 mb-1">
                    {"No Mobile Van services found in this area"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {"Try searching for a different city or select 'All'."}
                  </p>
                </div>
              ) : (
                filteredMobileVans.map((van) => {
                  const isExpanded = expandedVanId === van.id;

                  return (
                    <div
                      key={van.id}
                      className="bg-white rounded-2xl border border-gray-200/90 hover:border-gray-300 transition-all p-4 sm:p-5 shadow-2xs"
                    >
                      <div className="flex items-start gap-3.5">
                        <MobileVanBadgeIcon />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-xs sm:text-sm text-gray-950 uppercase tracking-tight line-clamp-1">
                            {van.name}
                          </h4>
                          <p className="text-xs text-gray-500 flex items-start gap-1 mt-1 leading-snug">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <span>{van.address || van.city}</span>
                          </p>
                          {van.distanceKm !== undefined && (
                            <p className="text-xs font-bold text-gray-800 mt-1.5 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ed1c24]" />
                              <span>{van.distanceKm.toFixed(2)} {"kilometers"}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bottom Actions Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
                          {van.whatsapp && (
                            <a
                              href={`https://wa.me/${van.whatsapp.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
                            >
                              <WhatsAppIcon />
                              <span>WhatsApp</span>
                            </a>
                          )}
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${van.lat},${van.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 hover:text-[#ed1c24] transition-colors"
                          >
                            <Navigation size={13} className="text-gray-400" />
                            <span>{"Directions"}</span>
                          </a>
                        </div>

                        <button
                          type="button"
                          onClick={() => setExpandedVanId(isExpanded ? null : van.id)}
                          className="bg-[#ed1c24] hover:bg-[#c6181d] active:bg-[#aa1217] text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer rtl:mr-auto ltr:ml-auto"
                        >
                          <span>{"Book Mobile Van"}</span>
                          <ArrowRight size={13} className="rtl:rotate-180" />
                        </button>
                      </div>

                      {/* Expandable Booking Form Drawer */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100 bg-[#f9fafb] -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-4 sm:p-5 rounded-b-xl animate-in fade-in duration-200">
                          <p className="text-xs font-extrabold uppercase text-gray-900 mb-3 tracking-wider">
                            {"Mobile Van Booking Details"}
                          </p>

                          <div className="space-y-3 mb-4">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                {"Fitting Location / Address"} <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder={"Building, street, community or area"}
                                value={mobileAddress}
                                onChange={(e) => setMobileAddress(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:border-black"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                  {"Preferred Date"}
                                </label>
                                <select
                                  value={selectedDate}
                                  onChange={(e) => setSelectedDate(e.target.value)}
                                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:border-black cursor-pointer"
                                >
                                  <option value="">{"Select Date"}</option>
                                  {upcomingDates.map((d) => (
                                    <option key={d.value} value={d.value}>
                                      {d.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                  {"Time Slot"}
                                </label>
                                <select
                                  value={selectedTimeSlot}
                                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 outline-none focus:border-black cursor-pointer"
                                >
                                  <option value="">{"Select Time Slot"}</option>
                                  {(timeSlots.length > 0
                                    ? timeSlots
                                    : [
                                        "09:00 AM - 11:00 AM",
                                        "11:00 AM - 01:00 PM",
                                        "02:00 PM - 04:00 PM",
                                        "04:00 PM - 06:00 PM",
                                        "06:00 PM - 08:00 PM",
                                      ]
                                  ).map((t) => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleConfirmMobileVan(van)}
                            className="w-full bg-black hover:bg-[#ed1c24] text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>{"Confirm Mobile Van & Proceed to Checkout"}</span>
                            <ArrowRight size={14} className="rtl:rotate-180" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ════ Option 3 Content: Free Shipping ════ */}
        {deliveryMode === "free_shipping" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 max-w-xl mx-auto shadow-xs text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#ed1c24] flex items-center justify-center mx-auto mb-4">
              <Package size={32} />
            </div>
            <h3 className="text-lg font-black text-gray-900 uppercase mb-2">
              {"Free Courier Shipping"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">
              {"Your tyres will be delivered directly to your doorstep anywhere in the UAE without fitment service."}
            </p>

            <button
              type="button"
              onClick={handleConfirmFreeShipping}
              className="w-full bg-black hover:bg-[#ed1c24] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider py-4 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>{"PROCEED TO CHECKOUT"}</span>
              <ArrowRight size={16} className="rtl:rotate-180" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
