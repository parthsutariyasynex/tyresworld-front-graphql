"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Search } from "lucide-react";
import { fetchMakes, type VehicleOption } from "@/lib/vehicleFinderApi";

/**
 * /tyres/cars — "Buy Car Tyres Online: Select by Make & Model"
 *
 * The equivalent Magento category (id 1119, url tyres/cars) is not attached
 * to this store's active category tree, so it's unreachable through any
 * Magento GraphQL category query — categories / categoryList / category(id)
 * all return nothing for it, even though the old PHP storefront still
 * renders it by loading the category directly from its URL rewrite. That's
 * a Magento catalog/category-tree data gap, not something fixable here.
 *
 * This page rebuilds the same "browse tyres by vehicle brand" experience
 * without depending on that category at all: the brand list (name + logo)
 * comes live from the same Klever_PartsFinder API
 * (/api/tyre-finder/vehicle?step=makes) that already powers the homepage's
 * "Search By Vehicle" finder (components/TyreFinder.tsx) — same source,
 * same data, just a full-page browser instead of a modal.
 */
export default function CarsBrandBrowserPage() {
  const params = useParams();
  const locale = String(params.locale ?? "en");
  const isAr = locale === "ar";

  const [makes, setMakes] = useState<VehicleOption[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState<string>("ALL");

  useEffect(() => {
    let active = true;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetchMakes(locale, ctrl.signal)
      .then(({ options, error: err }) => {
        if (!active) return;
        setMakes(options);
        if (err && options.length === 0) setError(err);
      })
      .catch((e) => {
        if (!active || ctrl.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Network error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [locale]);

  /* Only letters that actually have at least one make — never a fixed A–Z. */
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    for (const m of makes ?? []) {
      const first = m.label.trim().charAt(0).toUpperCase();
      if (first) letters.add(first);
    }
    return Array.from(letters).sort();
  }, [makes]);

  const filteredMakes = useMemo(() => {
    let list = makes ?? [];
    if (letter !== "ALL") {
      list = list.filter((m) => m.label.trim().charAt(0).toUpperCase() === letter);
    }
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((m) => m.label.toLowerCase().includes(q));
    return list;
  }, [makes, letter, query]);

  return (
    <div className="bg-white min-h-screen pb-16">
      {/* ── Hero ── */}
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
              <span className="base">
                {isAr
                  ? "شراء إطارات السيارات أونلاين - اختر حسب الماركة والموديل"
                  : "Buy Car Tyres Online – Select by Make & Model"}
              </span>
            </h1>
          </div>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="container py-2.5">
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap font-medium">
            <Link href={`/${locale}`} className="hover:text-black transition-colors">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <ChevronRight size={12} className="shrink-0 text-gray-400" />
            <Link href={`/${locale}/tyres`} className="hover:text-black transition-colors">
              {isAr ? "الإطارات" : "Tyres"}
            </Link>
            <ChevronRight size={12} className="shrink-0 text-gray-400" />
            <span className="text-black font-semibold">{isAr ? "السيارات" : "Cars"}</span>
          </nav>
        </div>
      </div>

      <div className="container py-8 lg:py-10">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-gray-950 text-center mb-6">
          {isAr ? "استكشف أفضل ماركات السيارات" : "Explore the Finest Car Brands"}
        </h2>

        {/* ── Search + A–Z filter ── */}
        <div className="max-w-3xl mx-auto bg-[#f8f9fa] border border-gray-200/90 rounded-2xl p-4 sm:p-5 mb-8">
          <div className="relative mb-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isAr ? "ابدأ بكتابة ماركة السيارة..." : "Start typing car brand..."}
              className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-11 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#ed1c24]"
            />
            <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setLetter("ALL")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-black uppercase tracking-wide transition-colors ${
                letter === "ALL"
                  ? "bg-[#ed1c24] text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-gray-400"
              }`}
            >
              {isAr ? "الكل" : "All"}
            </button>
            {availableLetters.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLetter(l)}
                className={`w-8 h-8 rounded-md text-xs font-black transition-colors ${
                  letter === l
                    ? "bg-[#ed1c24] text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-gray-400"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* ── Brand grid ── */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full mb-3" />
                <div className="h-3 w-20 mx-auto bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (makes ?? []).length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="font-bold text-gray-900 mb-1">
              {isAr ? "تعذر تحميل ماركات السيارات" : "Couldn't load car brands"}
            </p>
            <p className="text-sm">{isAr ? "يرجى المحاولة مرة أخرى." : "Please try again shortly."}</p>
          </div>
        )}

        {!loading && !error && filteredMakes.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            {isAr ? "لا توجد ماركات مطابقة لبحثك." : "No car brands match your search."}
          </div>
        )}

        {!loading && filteredMakes.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredMakes.map((m) => (
              <Link
                key={m.value}
                href={`/${locale}/tyres/cars/${m.value}`}
                className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-center gap-3 text-center hover:border-[#ed1c24] hover:shadow-md transition-all"
              >
                {m.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.logo}
                    alt={m.label}
                    loading="lazy"
                    className="h-14 w-auto max-w-[72px] object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-gray-50 border border-gray-100" />
                )}
                <span className="text-sm font-bold text-gray-900">{m.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
