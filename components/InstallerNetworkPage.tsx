"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPin,
  Search,
  Crosshair,
  ChevronRight,
  Navigation,
  Loader2,
  CheckCircle2,
  Check,
} from "lucide-react";
import StoreLocatorMap, { type StoreLocation } from "@/components/StoreLocatorMap";

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
    <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-emerald-300/80 bg-white flex items-center justify-center shadow-xs">
      <img
        src="/img/independent-badge.png"
        alt="Independent Installer"
        className="w-full h-full object-contain p-0.5"
      />
    </div>
  );
}

export default function InstallerNetworkPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <InstallerNetworkContent />
    </Suspense>
  );
}

function InstallerNetworkContent() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] === "ar" ? "ar" : "en";
  const isAr = locale === "ar";

  const [cities, setCities] = useState<string[]>([]);
  const [branches, setBranches] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCity, setSelectedCity] = useState<string>(isAr ? "الكل" : "All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

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

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert(isAr ? "متصفحك لا يدعم تحديد الموقع الجغرافي." : "Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserCoords({ lat, lng });
        setSelectedCity(isAr ? "الكل" : "All");

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

  const filteredStores = useMemo(() => {
    const baseCoords = userCoords || { lat: 24.3682674, lng: 54.5124881 };

    let result = branches.map((store) => {
      const distance = calculateDistanceKm(baseCoords.lat, baseCoords.lng, store.lat, store.lng);
      return { ...store, distanceKm: distance };
    });

    if (selectedCity && selectedCity !== "All" && selectedCity !== "الكل") {
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

    result.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    return result;
  }, [branches, selectedCity, searchQuery, userCoords, isGeoAddress]);

  // Sync default selected store
  useEffect(() => {
    if (filteredStores.length > 0) {
      const exists = filteredStores.some((s) => s.id === selectedStoreId);
      if (!exists || !selectedStoreId) {
        setSelectedStoreId(filteredStores[0].id);
      }
    }
  }, [filteredStores, selectedStoreId]);

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="bg-white min-h-screen pb-16">
      {/* ── Page Hero Title Banner with Radiant Red Glow, Dot Mesh & Exact Curved Wave ── */}
      <div
        className="relative overflow-hidden text-white pt-12 pb-20 sm:pt-16 sm:pb-28"
        style={{
          backgroundColor: "#09090b",
          backgroundImage: `
            radial-gradient(rgba(255, 255, 255, 0.12) 1.2px, transparent 1.2px),
            radial-gradient(ellipse 70% 80% at 90% 50%, #9e141b 0%, #52090e 45%, transparent 80%),
            linear-gradient(115deg, #070709 0%, #130406 40%, #3d070b 70%, #851216 100%)
          `,
          backgroundSize: "22px 22px, 100% 100%, 100% 100%",
        }}
      >
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#251517]/90 backdrop-blur-xs border border-white/10 px-3.5 py-1 rounded-full text-[11.5px] font-medium text-white/90 mb-5 shadow-xs">
            <CheckCircle2 size={13} className="text-[#ed1c24] shrink-0" />
            <span>{isAr ? "شبكة شركاء التركيب المعتمدين في كافة أنحاء الإمارات" : "UAE-Wide Network of Trusted Installers Partner"}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] font-black uppercase text-white tracking-tight leading-none">
            {isAr ? "احجز تركيب الإطارات" : "BOOK TYRE FITTING"}
          </h1>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-black uppercase tracking-tight mt-1.5 mb-3.5 leading-tight">
            <span className="text-[#ed1c24]">{isAr ? "بالقرب منك في أي مكان في " : "NEAR YOU ANYWHERE IN "}</span>
            <span className="text-white">{isAr ? "الإمارات" : "THE UAE"}</span>
          </h2>

          <p className="text-xs sm:text-sm text-gray-300 max-w-lg leading-relaxed mb-5 font-normal">
            {isAr
              ? "ابحث في شبكتنا من مراكز التركيب المعتمدة، واختر الموعد المناسب لك، وقم بتركيب إطاراتك في المركز أو في المكان الذي يناسبك."
              : "Search our network of trusted installers, pick a slot that works for you, and get your tyres fitted at a workshop or wherever suits you best."}
          </p>

          <div className="mb-6">
            <Link
              href={`/${locale}/tyres`}
              className="inline-flex items-center gap-2 bg-[#2a171a]/90 hover:bg-[#3d2024] border border-white/15 hover:border-white/30 text-white text-[12px] font-semibold px-4.5 py-2 rounded-full transition-all shadow-xs"
            >
              <Search size={13} className="text-white" />
              <span>{isAr ? "البحث عن الإطارات حسب المقاس" : "Search Tyres by Size"}</span>
              <ChevronRight size={13} className="text-white/70 rtl:rotate-180" />
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11.5px] text-gray-200 font-medium">
            <div className="flex items-center gap-1.5">
              <Check size={13} className="text-[#25D366] stroke-[3]" />
              <span>{isAr ? "مراكز تركيب معتمدة ومضمونة" : "Vetted, Quality Installers"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check size={13} className="text-[#25D366] stroke-[3]" />
              <span>{isAr ? "تواصل معهم مباشرة عبر واتساب" : "Contact Installers Directly"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check size={13} className="text-[#25D366] stroke-[3]" />
              <span>{isAr ? "تركيب في المركز أو عبر الفان المتنقل" : "Workshop or Mobile Fitting"}</span>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-1 left-0 right-0 w-full overflow-hidden leading-none z-0 pointer-events-none">
          <svg
            className="relative block w-full h-8 sm:h-14 lg:h-18 text-white"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            fill="currentColor"
          >
            <path d="M0,50 C320,95 720,85 1060,25 C1220,-5 1360,10 1440,25 L1440,120 L0,120 Z" />
          </svg>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <Link href={`/${locale}`} className="hover:text-black transition-colors">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-semibold">
              {isAr ? "شبكة مراكز التركيب" : "Installer Network"}
            </span>
          </nav>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-950 uppercase tracking-tight font-sans">
              {isAr ? "شركاء تركيب الإطارات بالقرب منك" : "TYRE FITTING PARTNERS NEAR YOU"}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {isAr
                ? "أدخل منطقتك أو مدينتك لعرض شركاء التركيب القريبين منك."
                : "Enter your area or city to see nearby fitting partners."}
            </p>
          </div>

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
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? "bg-[#ed1c24] text-white shadow-xs"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-gray-900 hover:text-black"
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200/90 rounded-xl p-2 sm:p-2.5 mb-6 shadow-2xs flex flex-col sm:flex-row items-center gap-2.5">
          <div className="flex items-center gap-2.5 flex-1 w-full px-2">
            <MapPin size={18} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsGeoAddress(false);
              }}
              placeholder={isAr ? "أدخل اسم المنطقة أو المدينة..." : "Enter area or city"}
              className="w-full text-xs sm:text-sm text-gray-900 bg-transparent focus:outline-none placeholder:text-gray-400 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setIsGeoAddress(false);
                }}
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
              className="btn-cta text-xs px-6 py-2.5 rounded-lg gap-1.5"
            >
              <Search size={14} strokeWidth={2.5} />
              <span>{isAr ? "بحث" : "Search"}</span>
            </button>

            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locating}
              className="bg-white border border-gray-300 hover:border-gray-900 hover:bg-gray-50 text-gray-800 text-xs font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap disabled:opacity-60"
            >
              {locating ? (
                <Loader2 size={14} className="animate-spin text-gray-500" />
              ) : (
                <Crosshair size={14} className="text-gray-700" />
              )}
              <span>{isAr ? "استخدم موقعي" : "Use my location"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-6 sm:gap-8 items-start">
          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredStores.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                <p className="text-gray-500 text-sm">
                  {isAr ? "لم يتم العثور على شركاء تركيب في هذا النطاق." : "No fitting partners found for this search."}
                </p>
              </div>
            ) : (
              filteredStores.map((store) => {
                const isSelected = selectedStoreId === store.id;

                return (
                  <div
                    key={store.id}
                    onClick={() => setSelectedStoreId(store.id)}
                    className={`group bg-white rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer ${
                      isSelected
                        ? "border-gray-300 shadow-xs rtl:border-r-4 rtl:border-r-[#ed1c24] ltr:border-l-4 ltr:border-l-[#ed1c24]"
                        : "border-gray-200/90 hover:border-gray-300 hover:shadow-2xs"
                    }`}
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-3.5 sm:gap-4">
                        <StoreBadgeIcon />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-extrabold text-xs sm:text-sm text-gray-950 uppercase tracking-tight line-clamp-1">
                            {store.name}
                          </h3>
                          <p className="text-xs text-gray-500 flex items-start gap-1 mt-1 leading-snug">
                            <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{store.address}</span>
                          </p>
                          {store.distanceKm !== undefined && (
                            <p className="text-xs font-bold text-gray-800 mt-1.5 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ed1c24]" />
                              <span>{store.distanceKm.toFixed(2)} kilometer</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2.5 mt-3 pt-3 border-t border-gray-100 text-xs">
                        <div className="flex items-center gap-3.5">
                          {store.whatsapp && (
                            <a
                              href={`https://wa.me/${store.whatsapp}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[#25D366] hover:opacity-80 font-bold"
                            >
                              <WhatsAppIcon />
                              <span>WhatsApp</span>
                            </a>
                          )}
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-gray-700 hover:text-black font-medium"
                          >
                            <Navigation size={12} className="text-gray-500" />
                            <span>{isAr ? "الاتجاهات" : "Directions"}</span>
                          </a>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStoreId(store.id);
                            }}
                            className="inline-flex items-center gap-1 text-gray-500 hover:text-[#ed1c24] cursor-pointer"
                          >
                            <span>{isAr ? "عرض على الخريطة" : "See on Map"}</span>
                          </button>
                        </div>

                        {/* <Link
                          href={`/${locale}/storelocator`}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-[#ed1c24] hover:bg-[#c6181d] text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer rtl:mr-auto ltr:ml-auto"
                        >
                          <span>{isAr ? "احجز المركز" : "Book Installer"}</span>
                          <span className="text-xs">→</span>
                        </Link> */}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="sticky top-24 h-[550px] lg:h-[680px]">
            <StoreLocatorMap
              stores={filteredStores}
              selectedStoreId={selectedStoreId}
              onSelectStore={(s) => setSelectedStoreId(s.id)}
              locale={locale}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
