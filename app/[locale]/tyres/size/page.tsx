"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import StickyBottomFinder from "@/components/home/partora/StickyBottomFinder";
import type { TyreSizeItem } from "@/app/api/tyre-sizes/route";
import PageHeroBanner from "@/components/PageHeroBanner";
import { buildTyreSizeSlug } from "@/lib/filterBuilder";

export default function TyreSizeBrowserPage() {
  const params = useParams();
  const router = useRouter();
  const locale = String(params.locale ?? "en");

  const [sizes, setSizes] = useState<TyreSizeItem[]>([]);
  const [rims, setRims] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRim, setSelectedRim] = useState("ALL");

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/tyre-sizes?locale=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error && (!data.sizes || data.sizes.length === 0)) {
          setError(data.error);
        } else {
          setSizes(data.sizes ?? []);
          setRims(data.rims ?? ["ALL", "R12", "R13", "R14", "R15", "R16", "R17", "R18", "R19", "R20", "R21", "R22", "R23", "R24"]);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [locale]);

  // Filter sizes based on search query and selected rim
  const filteredSizes = useMemo(() => {
    let list = sizes;

    const query = searchQuery.trim().toLowerCase();

    if (query) {
      const qWithR = query.replace(/[\s\/\-\._]/g, "");
      const qDigitsOnly = query.replace(/[r\s\/\-\._]/g, "");
      const tokens = query.split(/[\s\/\-\._]+/g).filter(Boolean);

      list = list.filter((s) => {
        const labelLower = s.label.toLowerCase();
        const labelWithR = labelLower.replace(/[\s\/\-\._]/g, "");
        const labelDigitsOnly = labelLower.replace(/[r\s\/\-\._]/g, "");

        // 1. Exact or partial substring match on formatted label (e.g. "245/45 R19")
        if (labelLower.includes(query)) return true;
        if (labelWithR.includes(qWithR)) return true;

        // 2. Digits-only match (e.g. "2454519", "24545", "100020")
        if (qDigitsOnly.length >= 2 && labelDigitsOnly.includes(qDigitsOnly)) return true;

        // 3. Multi-token match (e.g. "245 45", "245 19", "245 45 19")
        if (tokens.length >= 2) {
          const matchTokens = tokens.every((tok) => {
            const cleanTok = tok.replace(/^r/i, "");
            return (
              s.width === tok ||
              s.width.startsWith(tok) ||
              s.height === tok ||
              s.rim.toLowerCase().includes(cleanTok) ||
              s.rimKey.toLowerCase() === tok.toLowerCase()
            );
          });
          if (matchTokens) return true;
        }

        return false;
      });
    }

    if (selectedRim !== "ALL") {
      const rimNum = parseFloat(selectedRim.replace(/[^0-9.]/g, ""));
      list = list.filter(
        (s) =>
          s.rimNumber === rimNum ||
          s.rimKey === selectedRim ||
          s.rim.includes(selectedRim.replace("R", ""))
      );
    }

    return list;
  }, [sizes, selectedRim, searchQuery]);

  const handleSizeClick = (size: TyreSizeItem) => {
    const cleanRim = size.rim ? size.rim.replace(/^R/i, "") : "";
    router.push(buildTyreSizeSlug({ width: size.width ?? "", height: size.height ?? "", rim: cleanRim }));
  };

  return (
    <div className="bg-[#f5f6f8] pb-8 sm:pb-12 flex flex-col justify-start" dir="ltr">
      <PageHeroBanner
        title="All Size"
        breadcrumbLabel="Tyre Sizes"
        description="Shop premium tyres in UAE with free mobile fitting, manufacturer warranty, and best prices across Dubai, Abu Dhabi, and UAE."
      />

      {/* ── Main Content Container ─────────────────────────────────── */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 grow">
        {/* Page Heading */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-black text-black uppercase tracking-tight font-sans">
            ALL SIZE
          </h1>
        </div>

        {/* White Card Container */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200/90 shadow-xs p-5 sm:p-8 md:p-9">
            {/* Search Input Bar with Rounded Border */}
            <div className="relative mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search here..."
                className="w-full bg-white hover:border-gray-300 focus:bg-white border border-gray-200 rounded-xl sm:rounded-2xl pr-12 pl-5 sm:pl-6 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:border-[#ed1c24] focus:ring-2 focus:ring-[#ed1c24]/10 shadow-2xs transition-all"
              />
              <div className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-[#ed1c24] pointer-events-none flex items-center justify-center">
                <Search size={20} strokeWidth={2.5} />
              </div>
            </div>

            {/* Rim Filter Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-3 mb-7 scrollbar-none">
              {(rims.length > 0 ? rims : ["ALL", "R12", "R13", "R14", "R15", "R16", "R17", "R18", "R19", "R20", "R21", "R22", "R23", "R24"]).map((rim) => {
                const isActive = selectedRim === rim;
                return (
                  <button
                    key={rim}
                    type="button"
                    onClick={() => setSelectedRim(rim)}
                    className={`shrink-0 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[12px] sm:text-[13px] font-black uppercase transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-[#ed1c24] text-white shadow-2xs"
                        : "bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 hover:border-gray-400 shadow-2xs"
                    }`}
                  >
                    {rim}
                  </button>
                );
              })}
            </div>

            {/* Loading / Error / Empty States */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[50px] sm:h-[54px] bg-gray-100 border border-gray-200/90 rounded-lg sm:rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : error && sizes.length === 0 ? (
              <div className="py-16 text-center text-sm font-medium text-gray-400">
                Couldn&apos;t load tyre sizes.
              </div>
            ) : filteredSizes.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-base font-bold text-gray-800 mb-1">
                  No matching tyre sizes found
                </p>
                <p className="text-xs text-gray-400">
                  Try searching for a different size or clear filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedRim("ALL");
                  }}
                  className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              /* Tyre Sizes Grid — 5 columns with rounded styled cards */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {filteredSizes.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSizeClick(item)}
                    className="h-[50px] sm:h-[54px] bg-white hover:bg-red-50/10 border border-gray-200/90 hover:border-[#ed1c24] rounded-lg sm:rounded-xl px-4 flex items-center justify-center text-center text-[14px] sm:text-[15px] font-black text-gray-900 hover:text-[#ed1c24] shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer active:scale-[0.99]"
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
      </div>

      {/* ── Sticky Bottom TyreFinder Bar (same as Products / Category page) ── */}
      <StickyBottomFinder locale={locale} />
    </div>
  );
}
