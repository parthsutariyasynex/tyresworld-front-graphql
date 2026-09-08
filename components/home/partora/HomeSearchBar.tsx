"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export default function HomeSearchBar({ locale }: { locale: string }) {
  const router = useRouter();
  const isAr = locale === "ar";
  const [searchVal, setSearchVal] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchVal.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(searchVal)}&locale=${locale}&pageSize=35`)
        .then((r) => r.json())
        .then((data) => {
          const products = data.products ?? [];
          const extractedSizes = new Set<string>();
          const trimmed = searchVal.trim();

          products.forEach((p: any) => {
            if (!p.name) return;
            const stdMatch = p.name.match(/(\d{3})\/(\d{2})\s*(?:Z?R)?(\d{2})/i);
            if (stdMatch) {
              extractedSizes.add(`${stdMatch[1]}/${stdMatch[2]} R${stdMatch[3]}`);
              return;
            }
            const commMatch = p.name.match(/(\d{3})\s*R(\d{2})C?/i);
            if (commMatch) {
              extractedSizes.add(`${commMatch[1]} R${commMatch[2]}`);
            }
          });

          const result: string[] = [];
          if (trimmed) {
            result.push(trimmed);
          }
          Array.from(extractedSizes).forEach((size) => {
            if (size.toLowerCase() !== trimmed.toLowerCase()) {
              result.push(size);
            }
          });

          setSuggestions(result.slice(0, 8));
        })
        .catch((err) => {
          console.error("Failed to fetch suggestions:", err);
        });
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchVal, locale]);

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const query = searchVal.trim();
    if (query) {
      router.push(`/${locale}/tyres?q=${encodeURIComponent(query)}`);
      setSearchFocused(false);
    }
  }

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative w-full">
        <input
          ref={searchRef}
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => {
            setTimeout(() => setSearchFocused(false), 200);
          }}
          placeholder={
            isAr
              ? "ابحث عن مقاس الإطارات… مثال: 195/65 R15"
              : "Search tyre size, brand or vehicle… e.g. 195/65 R15"
          }
          aria-label={isAr ? "بحث" : "Search"}
          className="ptr-search-input pr-12 pl-4 py-3 text-[13.5px] w-full bg-white border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#ed1c24] focus:ring-1 focus:ring-[#ed1c24] transition-colors shadow-sm"
        />

        {/* Clear Button */}
        {searchVal && (
          <button
            type="button"
            onClick={() => {
              setSearchVal("");
              setSuggestions([]);
              searchRef.current?.focus();
            }}
            className={`absolute ${isAr ? "left-11" : "right-11"} top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center transition-colors`}
            aria-label="Clear"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        )}

        {/* Search Submit Button */}
        <button
          type="submit"
          className={`absolute ${isAr ? "left-3.5" : "right-3.5"} top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ed1c24] transition-colors focus:outline-none`}
          aria-label={isAr ? "بحث" : "Search"}
        >
          <Search size={18} strokeWidth={2.2} />
        </button>
      </form>

      {/* Suggestions Dropdown */}
      {searchFocused && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-xl z-[999] max-h-[260px] overflow-y-auto divide-y divide-gray-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {suggestions.map((suggestion, index) => (
            <li key={index}>
              <button
                type="button"
                onMouseDown={() => {
                  setSearchVal(suggestion);
                  router.push(`/${locale}/tyres?q=${encodeURIComponent(suggestion)}`);
                  setSuggestions([]);
                  setSearchFocused(false);
                }}
                className={`w-full px-4 py-2.5 text-[13px] text-gray-700 hover:bg-red-50 hover:text-[#ed1c24] font-semibold transition-colors focus:outline-none ${
                  isAr ? "text-right" : "text-left"
                }`}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
