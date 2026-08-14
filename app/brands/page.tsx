"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { BRAND_NAMES, BRAND_LOGOS } from "@/lib/brandLogos";

export default function BrandsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split("/")[1] === "ar" ? "ar" : "en") as Locale;
  const isAr = locale === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState("ALL");
  const [brands, setBrands] = useState<{ name: string; ids: number[]; logo: string | null }[]>([]);

  // Initialize and group brands dynamically from lib/brandLogos
  useEffect(() => {
    const uniqueBrandsMap = new Map<string, { name: string; ids: number[]; logo: string | null }>();

    Object.entries(BRAND_NAMES).forEach(([idStr, rawName]) => {
      const id = Number(idStr);
      const logo = BRAND_LOGOS[id] || null;

      if (!logo) return;

      const normalizedKey = rawName.toLowerCase().replace(/[^a-z0-9]/g, "");

      const existing = uniqueBrandsMap.get(normalizedKey);
      if (existing) {
        existing.ids.push(id);
        if (logo && !existing.logo) {
          existing.logo = logo;
        }
        // Prefer name with better capitalization
        if (rawName !== rawName.toLowerCase() && existing.name === existing.name.toLowerCase()) {
          existing.name = rawName;
        }
      } else {
        uniqueBrandsMap.set(normalizedKey, {
          name: rawName,
          ids: [id],
          logo: logo,
        });
      }
    });

    const sortedBrands = Array.from(uniqueBrandsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    setBrands(sortedBrands);
  }, []);

  const getT = (key: string) => {
    return t(locale, `brands.${key}`);
  };

  // Filter brands based on search query and active letter
  const filteredBrands = brands.filter((brand) => {
    const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase());
    const firstLetter = brand.name.charAt(0).toUpperCase();
    const matchesLetter = activeLetter === "ALL" || firstLetter === activeLetter;
    return matchesSearch && matchesLetter;
  });

  // Calculate letters that have brands associated with them
  const lettersWithBrands = new Set(
    brands.map((b) => b.name.charAt(0).toUpperCase())
  );

  // Generate alphabet list
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const handleBrandClick = (name: string) => {
    // Find all IDs in BRAND_NAMES that correspond to this brand name (case-insensitive)
    const ids = Object.entries(BRAND_NAMES)
      .filter(([_, val]) => val.toLowerCase() === name.toLowerCase())
      .map(([key, _]) => key);

    if (ids.length > 0) {
      const brandParam = ids.join(",");
      router.push(`/${locale}/tyres?mgs_brand=${brandParam}`);
    }
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="bg-[#f8f8f8] min-h-screen pb-16 font-sans">
      {/* Header Banner */}
      <div
        className="relative bg-black py-14 lg:py-20 text-center bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.45)), url('https://powertire.klever.ae/static/frontend/Klever/automotive/en_US/images/brand-banner-new.jpg')`,
        }}
      >
        <div className="container mx-auto px-4">
          <h1 className="text-xl sm:text-2xl lg:text-[34px] font-black uppercase tracking-wide text-white leading-tight">
            {getT("headerTitle")}
          </h1>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-100 py-3.5 mb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <nav className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <Link href={`/${locale}`} className="hover:text-black transition-colors">
              {getT("breadcrumbHome")}
            </Link>
            <span className="text-gray-455 font-normal">&gt;</span>
            <span className="text-black">{getT("breadcrumbBrands")}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4">
        {/* Search Bar & Alphabet Filter */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-10">
          <div className="flex flex-col gap-6">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder={getT("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-200 bg-white rounded-lg pl-4 pr-12 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-800 transition-colors"
              />
              <Search
                size={18}
                className={`absolute ${isAr ? "left-4" : "right-4"} top-1/2 -translate-y-1/2 text-gray-400`}
              />
            </div>

            {/* Alphabet Filter List */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-gray-100">
              <button
                onClick={() => setActiveLetter("ALL")}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all duration-200 ${
                  activeLetter === "ALL"
                    ? "bg-[#ed1c24] text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400 hover:text-black"
                }`}
              >
                {getT("all")}
              </button>

              {alphabet.map((letter) => {
                const hasBrands = lettersWithBrands.has(letter);
                return (
                  <button
                    key={letter}
                    disabled={!hasBrands}
                    onClick={() => setActiveLetter(letter)}
                    className={`w-8 h-8 flex items-center justify-center text-xs font-black rounded-lg transition-all duration-200 ${
                      activeLetter === letter
                        ? "bg-[#ed1c24] text-white shadow-sm"
                        : hasBrands
                        ? "bg-white text-gray-655 border border-gray-200 hover:border-gray-400 hover:text-black cursor-pointer"
                        : "bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed opacity-40"
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Brand Section Header */}
        <div className="text-center mb-10">
          <span className="text-[#ed1c24] font-black uppercase text-[10px] tracking-[2px] block mb-2">
            {getT("sectionSubtitle")}
          </span>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-gray-900">
            {getT("sectionTitle")}
          </h2>
        </div>

        {/* Brands Grid */}
        {filteredBrands.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center max-w-md mx-auto shadow-sm">
            <p className="text-gray-500 text-sm font-semibold">{getT("noBrands")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredBrands.map((brand) => (
              <div
                key={brand.name}
                onClick={() => handleBrandClick(brand.name)}
                className="aspect-[3/2] flex items-center justify-center p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-350 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative group"
              >
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-h-12 w-auto max-w-[85%] object-contain transition-all duration-300"
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
    </div>
  );
}
