"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import StickyBottomFinder from "@/components/home/partora/StickyBottomFinder";

/** One entry as /api/brands returns it (real Magento kleverBrands data). */
type Brand = {
  name: string;
  filterValue: string;
  logo: string;
  category: string;
  isFeatured: boolean;
  sortOrder: number;
};

/* Real brand_category values (confirmed live) → the real product-listing
   page each one's brand filter (?mgs_brand=<name>) actually works against.
   Order here is also the tab display order. Any brand whose category isn't
   one of these (a handful come back with no category at all) falls into a
   trailing "Other" tab that links to the general tyres listing — not
   guessed onto one of the real categories below. */
const CATEGORY_SLUGS: Record<string, string> = {
  "Tyres": "tyres",
  "Battery": "car-battery",
  "Wheels": "car-wheels",
  "Motorcycle Tyres": "motorcycle-tyre",
  "Wheel Alignment": "rim-protectors",
};
const CATEGORY_ORDER = Object.keys(CATEGORY_SLUGS);
const CATEGORY_LABELS_AR: Record<string, string> = {
  "Tyres": "الإطارات",
  "Battery": "البطاريات",
  "Wheels": "الجنوط",
  "Motorcycle Tyres": "إطارات الدراجات",
  "Wheel Alignment": "محاذاة العجلات",
  "Other": "أخرى",
};

export default function BrandsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split("/")[1] === "ar" ? "ar" : "en") as Locale;
  const isAr = locale === "ar";

  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState("ALL");

  // Load the real brand directory (all categories at once — there are only
  // ~90 brands total, so one request and client-side grouping into tabs).
  useEffect(() => {
    let active = true;

    fetch("/api/brands")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const list: Brand[] = (data?.brands ?? []).filter(
          (b: Partial<Brand>) => b?.name && b?.logo,
        );
        setAllBrands(list);
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

  // Real categories actually present in the data, in the preferred order,
  // with any leftover (blank/unrecognized) category grouped as "Other".
  const tabs = useMemo(() => {
    const present = new Set(allBrands.map((b) => b.category));
    const known = CATEGORY_ORDER.filter((c) => present.has(c));
    const hasOther = allBrands.some((b) => !CATEGORY_SLUGS[b.category]);
    return hasOther ? [...known, "Other"] : known;
  }, [allBrands]);

  useEffect(() => {
    if (activeTab === null && tabs.length) setActiveTab(tabs[0]);
  }, [tabs, activeTab]);

  const currentBrandsList = useMemo(() => {
    if (!activeTab) return [];
    const list =
      activeTab === "Other"
        ? allBrands.filter((b) => !CATEGORY_SLUGS[b.category])
        : allBrands.filter((b) => b.category === activeTab);
    return [...list].sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });
  }, [allBrands, activeTab]);

  const filteredBrands = useMemo(() => {
    return currentBrandsList.filter((brand) => {
      const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const firstLetter = brand.name.charAt(0).toUpperCase();
      const matchesLetter = activeLetter === "ALL" || firstLetter === activeLetter;
      return matchesSearch && matchesLetter;
    });
  }, [currentBrandsList, searchQuery, activeLetter]);

  const lettersWithBrands = useMemo(() => {
    return new Set(currentBrandsList.map((b) => b.name.charAt(0).toUpperCase()));
  }, [currentBrandsList]);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const handleBrandClick = (brand: Brand) => {
    const slug = activeTab && CATEGORY_SLUGS[activeTab] ? CATEGORY_SLUGS[activeTab] : "tyres";
    router.push(`/${locale}/${slug}?mgs_brand=${encodeURIComponent(brand.filterValue)}`);
  };

  const tabLabel = (cat: string) => (isAr ? CATEGORY_LABELS_AR[cat] ?? cat : cat);

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="bg-white pt-6 sm:pt-8 pb-8 sm:pb-12 font-sans">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">

        {/* ── 1. Category Switcher — built from whichever real brand_category
              values kleverBrands actually returns, not a hardcoded pair ── */}
        {tabs.length > 1 && (
          <div className="flex justify-center mb-10">
            <div className="bg-[#1f242b] p-1.5 rounded-full inline-flex items-center gap-1 shadow-md flex-wrap justify-center">
              {tabs.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setActiveTab(cat);
                    setActiveLetter("ALL");
                    setSearchQuery("");
                  }}
                  className={`px-6 sm:px-8 py-2.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 ${
                    activeTab === cat
                      ? "bg-[#ed1c24] text-white shadow-md"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {tabLabel(cat)}
                </button>
              ))}
            </div>
          </div>
        )}

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
            {activeTab ? `${tabLabel(activeTab)} ${isAr ? "" : "Brands"}` : ""}
          </p>
          <h1 className="text-xl sm:text-2xl md:text-[28px] font-black uppercase tracking-tight text-gray-950">
            {isAr
              ? "مجموعة واسعة من العلامات التجارية الموثوقة"
              : `WIDE RANGE OF TRUSTED ${activeTab ? activeTab.toUpperCase() : ""} BRANDS`}
          </h1>
        </div>

        {/* ── 4. Brands Grid (5 columns per row) ────────────────────── */}
        {loading ? (
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
                onClick={() => handleBrandClick(brand)}
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
