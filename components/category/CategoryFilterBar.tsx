"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import type { FilterGroup } from "@/components/FilterPanel";
import { buildBrandSlug } from "@/lib/filterBuilder";
import { SORT_OPTS } from "@/components/category/sortOptions";

interface CategoryFilterBarProps {
  selected: Record<string, string[]>;
  filterGroups: FilterGroup[];
  onOpenMoreFilters: () => void;
  onChange?: (code: string, values: string[]) => void;
  onClearAll?: () => void;
  brandFilter?: string;
  basePath: string;
  categoryUid?: string;
  total?: number;
  /** Current sort value + setter — same state the page's own SortBar uses,
      so picking a sort here or there always stays in sync. */
  sort?: string;
  onSortChange?: (value: string) => void;
}

/** Sort button styled for the dark red bar — same dropdown behavior as the
    page's standalone SortBar, just themed to match Clear All/More Filters. */
function RedBarSortButton({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const cur = SORT_OPTS.find((o) => o.value === value) ?? SORT_OPTS[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/25 hover:bg-black/35 active:scale-95 text-white font-bold text-[11px] uppercase tracking-wider rounded-lg border border-white/20 shadow-xs transition-all cursor-pointer"
        aria-label="Sort"
      >
        <span>{cur.en}</span>
        <ChevronDown size={12} strokeWidth={2.5} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-30 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 min-w-[190px] overflow-hidden">
            {SORT_OPTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                  opt.value === value ? "text-[#ed1c24] bg-red-50" : "text-gray-800 hover:bg-gray-50"
                }`}
              >
                {opt.en}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const SIZE_CODES = new Set([
  "width",
  "height",
  "haight",
  "rim",
  "width_rear",
  "rear_width",
  "rwidth",
  "haight_rear",
  "height_rear",
  "rear_height",
  "rheight",
  "rim_rear",
  "rear_rim",
  "rrim",
]);

export default function CategoryFilterBar({
  selected,
  filterGroups,
  onOpenMoreFilters,
  onChange,
  onClearAll,
  brandFilter,
  basePath,
  sort,
  onSortChange,
}: CategoryFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 100% Dynamic filter groups directly from API aggregations (matching the drawer)
  const seenLabels = new Set<string>();
  const dynamicGroups = filterGroups.filter((g) => {
    if (SIZE_CODES.has(g.code.toLowerCase())) return false;
    if (!g.options || g.options.length === 0) return false;
    const norm = g.label.trim().toLowerCase();
    if (seenLabels.has(norm)) return false;
    seenLabels.add(norm);
    return true;
  });

  const hasMoreFilters = dynamicGroups.length > 5;
  // If more than 5 filters exist, show top 5 + "More Filters" button.
  // If 5 or fewer filters exist, show all of them and hide "More Filters".
  const barGroups = hasMoreFilters ? dynamicGroups.slice(0, 5) : dynamicGroups;

  const handleSelectChange = (code: string, value: string) => {
    if (onChange) {
      onChange(code, value ? [value] : []);
      return;
    }

    const isBrand = code === "mgs_brand" || code === "brand";
    if (isBrand && value && (basePath === "/tyres" || basePath.startsWith("/tyres/brand/"))) {
      const opt = filterGroups.find((g) => g.code === code)?.options.find((o) => o.value === value || o.label === value);
      const brandName = opt?.label || value;
      const brandSlug = buildBrandSlug(brandName);
      if (brandSlug) {
        const p = new URLSearchParams(searchParams.toString());
        p.delete("mgs_brand");
        p.delete("brand");
        p.delete("page");
        const query = p.toString() ? `?${p}` : "";
        router.replace(`/tyres/brand/${brandSlug}${query}`, { scroll: false });
        return;
      }
    }

    const p = new URLSearchParams(searchParams.toString());
    if (value) {
      p.set(code, value);
    } else {
      p.delete(code);
    }
    p.delete("page");
    const targetBase = basePath.startsWith("/tyres/brand/") ? "/tyres" : basePath;
    router.replace(p.toString() ? `${targetBase}?${p}` : targetBase, { scroll: false });
  };

  if (barGroups.length === 0) {
    return null;
  }

  const gridColsClass =
    barGroups.length === 5
      ? "lg:grid-cols-5"
      : barGroups.length === 4
      ? "lg:grid-cols-4"
      : barGroups.length === 3
      ? "lg:grid-cols-3"
      : barGroups.length === 2
      ? "lg:grid-cols-2"
      : "lg:grid-cols-1";

  // Active Filter Items to show directly inside the Red Header
  const hasSize = Array.from(SIZE_CODES).some((k) => (selected[k]?.length ?? 0) > 0);
  const otherFilterEntries = Object.entries(selected).filter(
    ([code, vals]) => !SIZE_CODES.has(code.toLowerCase()) && vals.length > 0
  );

  const widthVal = selected.width?.[0];
  const heightVal = selected.height?.[0] ?? selected.haight?.[0];
  const rimVal = selected.rim?.[0];

  const rearWidthVal =
    selected.width_rear?.[0] ?? selected.rear_width?.[0] ?? selected.rwidth?.[0];
  const rearHeightVal =
    selected.haight_rear?.[0] ??
    selected.height_rear?.[0] ??
    selected.rear_height?.[0] ??
    selected.rheight?.[0];
  const rearRimVal =
    selected.rim_rear?.[0] ?? selected.rear_rim?.[0] ?? selected.rrim?.[0];

  const widthOpt = filterGroups.find((g) => g.code === "width")?.options.find((o) => o.value === widthVal || o.label === widthVal)?.label ?? widthVal;
  const heightOpt = filterGroups.find((g) => g.code === "height" || g.code === "haight")?.options.find((o) => o.value === heightVal || o.label === heightVal)?.label ?? heightVal;
  const rimOpt = filterGroups.find((g) => g.code === "rim")?.options.find((o) => o.value === rimVal || o.label === rimVal)?.label ?? rimVal;

  const rearWidthOpt = filterGroups.find((g) => g.code === "width_rear" || g.code === "rear_width" || g.code === "rwidth" || g.code === "width")?.options.find((o) => o.value === rearWidthVal || o.label === rearWidthVal)?.label ?? rearWidthVal;
  const rearHeightOpt = filterGroups.find((g) => g.code === "haight_rear" || g.code === "height_rear" || g.code === "rear_height" || g.code === "rheight" || g.code === "height")?.options.find((o) => o.value === rearHeightVal || o.label === rearHeightVal)?.label ?? rearHeightVal;
  const rearRimOpt = filterGroups.find((g) => g.code === "rim_rear" || g.code === "rear_rim" || g.code === "rrim" || g.code === "rim")?.options.find((o) => o.value === rearRimVal || o.label === rearRimVal)?.label ?? rearRimVal;

  let frontFormatted = "";
  if (widthOpt && heightOpt && rimOpt) {
    const cleanRim = rimOpt.replace(/^R/i, "");
    frontFormatted = `${widthOpt}/${heightOpt} R${cleanRim}`;
  } else if (widthOpt && heightOpt) {
    frontFormatted = `${widthOpt}/${heightOpt}`;
  } else if (widthOpt && rimOpt) {
    const cleanRim = rimOpt.replace(/^R/i, "");
    frontFormatted = `${widthOpt} R${cleanRim}`;
  } else if (widthOpt) {
    frontFormatted = `${widthOpt}`;
  } else if (heightOpt) {
    frontFormatted = `/${heightOpt}`;
  } else if (rimOpt) {
    const cleanRim = rimOpt.replace(/^R/i, "");
    frontFormatted = `R${cleanRim}`;
  }

  let rearFormatted = "";
  if (rearWidthOpt && rearHeightOpt && rearRimOpt) {
    const cleanRearRim = rearRimOpt.replace(/^R/i, "");
    rearFormatted = `${rearWidthOpt}/${rearHeightOpt} R${cleanRearRim}`;
  } else if (rearWidthOpt && rearHeightOpt) {
    rearFormatted = `${rearWidthOpt}/${rearHeightOpt}`;
  } else if (rearWidthOpt && rearRimOpt) {
    const cleanRearRim = rearRimOpt.replace(/^R/i, "");
    rearFormatted = `${rearWidthOpt} R${cleanRearRim}`;
  } else if (rearWidthOpt) {
    rearFormatted = `${rearWidthOpt}`;
  }

  let sizeFormatted = frontFormatted;
  if (frontFormatted && rearFormatted) {
    sizeFormatted = `${frontFormatted} – ${rearFormatted}`;
  } else if (!frontFormatted && rearFormatted) {
    sizeFormatted = rearFormatted;
  }

  const handleRemoveSizeFilter = () => {
    if (onChange) {
      SIZE_CODES.forEach((k) => onChange(k, []));
      return;
    }
    const p = new URLSearchParams(searchParams.toString());
    SIZE_CODES.forEach((k) => p.delete(k));
    p.delete("page");
    const targetBase = basePath.startsWith("/tyres/brand/") ? "/tyres" : basePath;
    router.replace(p.toString() ? `${targetBase}?${p}` : targetBase, { scroll: false });
  };

  return (
    <div className="w-full mb-2 sm:mb-2.5">
      <div className="bg-white rounded-xl border border-gray-200/90 shadow-xs">
        {/* ── Top Red Header Bar ── */}
        <div className="bg-[#ed1c24] rounded-t-xl px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 text-white font-black text-xs uppercase tracking-wider bg-black/20 px-2.5 py-0.5 rounded-md">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>Filters</span>
            </div>

            {/* Size Filter Pill in Red Bar */}
            {hasSize && sizeFormatted && (
              <button
                type="button"
                onClick={handleRemoveSizeFilter}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-gray-900 rounded-md text-[11px] font-bold shadow-xs hover:bg-gray-100 transition-colors cursor-pointer group"
                title={`Remove ${sizeFormatted}`}
              >
                <span className="text-[#ed1c24] font-black text-[10px] group-hover:scale-110 transition-transform">✕</span>
                <span>{sizeFormatted}</span>
              </button>
            )}

            {/* Other Active Filter Pills in Red Bar */}
            {otherFilterEntries.map(([code, values]) => {
              const group = filterGroups.find((g) => g.code === code);
              return values.map((val) => {
                const opt = group?.options.find(
                  (o) => o.value === val || o.label.toLowerCase() === val.toLowerCase()
                );
                const label = opt?.label ?? val;
                return (
                  <button
                    key={`${code}-${val}`}
                    type="button"
                    onClick={() => {
                      if (onChange) {
                        onChange(code, values.filter((v) => v !== val));
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-gray-900 rounded-md text-[11px] font-bold shadow-xs hover:bg-gray-100 transition-colors cursor-pointer group"
                    title={`Remove ${label}`}
                  >
                    <span className="text-[#ed1c24] font-black text-[10px] group-hover:scale-110 transition-transform">✕</span>
                    <span>{label}</span>
                  </button>
                );
              });
            })}
          </div>




          {/* Right side of Red Bar: Sort, Clear All & More Filters Button */}
          <div className="flex items-center gap-2 ml-auto">
             {(hasSize || otherFilterEntries.length > 0) && (
              <button
                type="button"
                onClick={onClearAll}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/25 hover:bg-black/35 text-white rounded-md text-[11px] font-bold transition-colors cursor-pointer border border-white/20"
              >
                <span>✕ Clear All</span>
              </button>
            )}
            {/* Sort Button inside Red Bar — same sort state as the page's toolbar SortBar */}
            {onSortChange && (
              <RedBarSortButton value={sort ?? "low-to-high"} onChange={onSortChange} />
            )}

            {/* Clear All Button inside Red Bar */}
            {/* {(hasSize || otherFilterEntries.length > 0) && (
              <button
                type="button"
                onClick={onClearAll}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/25 hover:bg-black/35 text-white rounded-md text-[11px] font-bold transition-colors cursor-pointer border border-white/20"
              >
                <span>✕ Clear All</span>
              </button>
            )} */}

            {/* More Filters Action Button (Placed at the LAST of the Red Line, shown only when total filters > 5) */}
            {hasMoreFilters && (
              <button
                type="button"
                onClick={onOpenMoreFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/25 hover:bg-black/35 active:scale-95 text-white font-bold text-[11px] uppercase tracking-wider rounded-lg border border-white/20 shadow-xs transition-all cursor-pointer"
              >
                <SlidersHorizontal size={12} strokeWidth={2.5} />
                <span>More Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Dynamic Dropdown Selectors Row (100% from API aggregations) ── */}
        <div className="p-2 sm:p-2.5 bg-white rounded-b-xl">
          <div className={`grid grid-cols-2 sm:grid-cols-3 ${gridColsClass} gap-2 sm:gap-2.5 items-center`}>
            {barGroups.map((group) => {
              const currentValues = selected[group.code] ?? [];
              const matchedOption = group.options.find(
                (o) =>
                  currentValues.includes(o.value) ||
                  currentValues.includes(o.label) ||
                  currentValues.some(
                    (v) =>
                      v.toLowerCase() === o.value.toLowerCase() ||
                      v.toLowerCase() === o.label.toLowerCase()
                  )
              );
              const currentValue = matchedOption ? matchedOption.value : (currentValues[0] ?? "");
              return (
                <div key={group.code} className="relative">
                  <label
                    className="block text-[9.5px] sm:text-[10px] font-black text-gray-700 uppercase tracking-wider mb-0.5 truncate"
                    title={group.label}
                  >
                    {group.label}
                  </label>
                  <div className="relative">
                    <select
                      value={currentValue}
                      onChange={(e) => handleSelectChange(group.code, e.target.value)}
                      className="w-full h-8 sm:h-8.5 pl-2.5 pr-7 bg-white border border-gray-200 hover:border-[#ed1c24] focus:border-[#ed1c24] focus:ring-1 focus:ring-[#ed1c24] rounded-md text-xs font-bold text-gray-900 appearance-none outline-none transition-colors cursor-pointer shadow-2xs truncate"
                    >
                      <option value="">{`Select ${group.label}`}</option>
                      {currentValue && !group.options.some((o) => o.value === currentValue) && (
                        <option value={currentValue}>{currentValues[0] || currentValue}</option>
                      )}
                      {group.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={13}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
