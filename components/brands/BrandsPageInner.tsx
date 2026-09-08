"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import TyreFinder from "@/components/TyreFinder";
import StickyBottomFinder from "@/components/home/partora/StickyBottomFinder";

/** One entry as /api/brands returns it. */
type Brand = {
  name: string;
  filterValue: string;
  logo: string;
};

// Known Battery Brands (both from catalogue & standard inventory)
const BATTERY_BRAND_NAMES = new Set([
  "bosch",
  "dagenite",
  "duracell",
  "f-power",
  "fpower",
  "fiamm",
  "solite",
  "varta",
  "volcan",
  "asimco",
  "acdelco",
  "amaron",
  "energizer",
  "exide",
  "optima",
  "yuasa",
]);

// Dedicated Battery Brands list with verified logo paths
const BATTERY_BRANDS: Brand[] = [
  { name: "ACDelco", filterValue: "ACDelco", logo: "/brands/mgs_brand/7/9/79e8bb2b62_1422510267_acdelco-logo_1__1__1_.jpg" },
  { name: "Amaron", filterValue: "Amaron", logo: "/brands/mgs_brand/a/m/amaron_logo_0.jpg" },
  { name: "Asimco", filterValue: "Asimco", logo: "/brands/mgs_brand/a/s/asimco_1_.jpg" },
  { name: "Bosch", filterValue: "Bosch", logo: "/brands/mgs_brand/b/o/bosch_1_.png" },
  { name: "Dagenite", filterValue: "Dagenite", logo: "/brands/mgs_brand/d/a/dagenite_1_.jpg" },
  { name: "Duracell", filterValue: "Duracell", logo: "/brands/mgs_brand/d/u/duracell_1_.jpg" },
  { name: "F-Power", filterValue: "F-Power", logo: "/brands/mgs_brand/f/p/fpower_1_.png" },
  { name: "Fiamm", filterValue: "Fiamm", logo: "/brands/mgs_brand/f/i/fiamm_1_.jpg" },
  { name: "Rhino Battery", filterValue: "Rhino", logo: "/brands/mgs_brand/r/h/rhino-battery-shop.png" },
  { name: "Solite", filterValue: "Solite", logo: "/brands/mgs_brand/s/o/solite_1_.jpg" },
  { name: "Varta", filterValue: "Varta", logo: "/brands/mgs_brand/v/a/varta_1_.jpg" },
  { name: "Volcan", filterValue: "Volcan", logo: "/brands/mgs_brand/v/o/volcan_1_.png" },
];

export default function BrandsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split("/")[1] === "ar" ? "ar" : "en") as Locale;
  const isAr = locale === "ar";

  const [activeTab, setActiveTab] = useState<"TYRES" | "BATTERY">("TYRES");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState("ALL");
  const [tyreBrands, setTyreBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Load live tyre brands from API (strictly filtering out any battery brands)
  useEffect(() => {
    let active = true;

    fetch("/api/brands")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const list: Brand[] = (data?.brands ?? [])
          .filter((b: Partial<Brand>) => b?.name && b?.logo)
          // Exclude any battery brand from the tyres list
          .filter((b: Brand) => !BATTERY_BRAND_NAMES.has(b.name.toLowerCase().trim()));

        setTyreBrands([...list].sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch((err) => {
        console.error("Failed to load brands", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const currentBrandsList = useMemo(() => {
    return activeTab === "TYRES" ? tyreBrands : BATTERY_BRANDS;
  }, [activeTab, tyreBrands]);

  // Filter brands based on search query and active letter
  const filteredBrands = useMemo(() => {
    return currentBrandsList.filter((brand) => {
      const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const firstLetter = brand.name.charAt(0).toUpperCase();
      const matchesLetter = activeLetter === "ALL" || firstLetter === activeLetter;
      return matchesSearch && matchesLetter;
    });
  }, [currentBrandsList, searchQuery, activeLetter]);

  // Calculate letters that have brands associated with them in the current tab
  const lettersWithBrands = useMemo(() => {
    return new Set(currentBrandsList.map((b) => b.name.charAt(0).toUpperCase()));
  }, [currentBrandsList]);

  // Alphabet list A-Z
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const handleBrandClick = (brandName: string) => {
    if (activeTab === "BATTERY") {
      router.push(`/${locale}/car-batteries?brand=${encodeURIComponent(brandName)}`);
    } else {
      router.push(`/${locale}/tyres?brand=${encodeURIComponent(brandName)}`);
    }
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="bg-white min-h-screen pt-8 pb-20 font-sans">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* ── 1. Category Switcher (TYRES / BATTERY Pill) ─────────────── */}
        <div className="flex justify-center mb-10">
          <div className="bg-[#1f242b] p-1.5 rounded-full inline-flex items-center gap-1 shadow-md">
            <button
              type="button"
              onClick={() => {
                setActiveTab("TYRES");
                setActiveLetter("ALL");
                setSearchQuery("");
              }}
              className={`px-8 sm:px-10 py-2.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 ${
                activeTab === "TYRES"
                  ? "bg-[#ed1c24] text-white shadow-md"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              {isAr ? "الإطارات" : "TYRES"}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("BATTERY");
                setActiveLetter("ALL");
                setSearchQuery("");
              }}
              className={`px-8 sm:px-10 py-2.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 ${
                activeTab === "BATTERY"
                  ? "bg-[#ed1c24] text-white shadow-md"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              {isAr ? "البطاريات" : "BATTERY"}
            </button>
          </div>
        </div>

        {/* ── 2. Search Bar & Alphabet Filter Card ───────────────────── */}
        <div className="bg-[#ececec]/80 border border-gray-200/90 rounded-2xl p-5 sm:p-7 shadow-xs mb-14 max-w-5xl mx-auto">
          <div className="flex flex-col gap-5">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder={
                  isAr
                    ? "ابدأ بكتابة اسم العلامة التجارية..."
                    : "Start typing brand name.."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 pr-12 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#ed1c24] focus:ring-1 focus:ring-[#ed1c24] transition-all shadow-xs"
              />
              <Search
                size={20}
                className={`absolute ${isAr ? "left-4" : "right-4"} top-1/2 -translate-y-1/2 text-[#ed1c24]`}
              />
            </div>

            {/* Alphabet Filter List */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveLetter("ALL")}
                className={`px-4 py-1.5 text-xs font-black rounded-lg uppercase tracking-wider transition-all duration-150 ${
                  activeLetter === "ALL"
                    ? "bg-[#ed1c24] text-white shadow-sm"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-gray-400 hover:text-black shadow-2xs"
                }`}
              >
                {isAr ? "الكل" : "ALL"}
              </button>

              {alphabet.map((letter) => {
                const hasBrands = lettersWithBrands.has(letter);
                return (
                  <button
                    key={letter}
                    type="button"
                    disabled={!hasBrands}
                    onClick={() => setActiveLetter(letter)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-xs font-black rounded-lg transition-all duration-150 ${
                      activeLetter === letter
                        ? "bg-[#ed1c24] text-white shadow-sm"
                        : hasBrands
                        ? "bg-white text-gray-750 border border-gray-200 hover:border-[#ed1c24] hover:text-[#ed1c24] cursor-pointer shadow-2xs"
                        : "bg-white/60 text-gray-300 border border-gray-100 cursor-not-allowed opacity-40"
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 3. Section Title ───────────────────────────────────────── */}
        <div className="text-center mb-10">
          <p className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-widest mb-1.5">
            {activeTab === "BATTERY"
              ? isAr
                ? "ماركات البطاريات"
                : "Battery Brands"
              : isAr
              ? "ماركات الإطارات"
              : "Tyres Brands"}
          </p>
          <h1 className="text-xl sm:text-2xl md:text-[28px] font-black uppercase tracking-tight text-gray-950">
            {activeTab === "BATTERY"
              ? isAr
                ? "مجموعة واسعة من ماركات البطاريات الموثوقة"
                : "WIDE RANGE OF TRUSTED BATTERY BRANDS"
              : isAr
              ? "مجموعة واسعة من ماركات الإطارات الموثوقة"
              : "WIDE RANGE OF TRUSTED TYRES BRANDS"}
          </h1>
        </div>

        {/* ── 4. Brands Grid (5 columns per row) ────────────────────── */}
        {loading && activeTab === "TYRES" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="h-[76px] sm:h-[84px] bg-gray-100 animate-pulse rounded-xl border border-gray-200"
              />
            ))}
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center max-w-md mx-auto shadow-xs">
            <p className="text-gray-500 text-sm font-bold">
              {isAr ? "لا توجد علامات تجارية مطابقة" : "No matching brands found."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-4">
            {filteredBrands.map((brand) => (
              <div
                key={brand.name}
                onClick={() => handleBrandClick(brand.name)}
                className="h-[76px] sm:h-[84px] bg-white border border-gray-200/90 rounded-xl flex items-center justify-center px-4 py-2 hover:shadow-md hover:border-gray-350 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group shadow-2xs"
              >
                {brand.logo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-h-[38px] sm:max-h-[42px] w-auto max-w-[85%] object-contain transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <span className="text-xs sm:text-sm font-black text-gray-800 uppercase tracking-wider group-hover:text-[#ed1c24] transition-colors text-center px-2">
                    {brand.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sticky Bottom Floating Search ───────────────────────────── */}
      <StickyBottomFinder locale={locale} />
    </div>
  );
}
