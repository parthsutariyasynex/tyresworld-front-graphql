"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronDown, Search, Loader2 } from "lucide-react";
import { useScrollLock } from "@/lib/useScrollLock";

export interface FilterOption {
  label: string;
  value: string;
  count: number;
}

export interface FilterGroup {
  code: string;
  label: string;
  options: FilterOption[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  filters: FilterGroup[];
  allFilters?: FilterGroup[];
  loading: boolean;
  selected: Record<string, string[]>;
  onChange: (code: string, values: string[]) => void;
  /** Clear every applied filter in one update (avoids per-code races). */
  onClearAll?: () => void;
  dir?: "ltr" | "rtl";
  urlKey?: string;
}

/* ── Individual Filter Group Accordion ───────────────────────────── */
function FilterGroupSection({
  group,
  selected,
  onChange,
  defaultOpen = false,
}: {
  group: FilterGroup;
  selected: string[];
  onChange: (values: string[]) => void;
  defaultOpen?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const [search, setSearch] = useState("");

  const filtered = group.options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (opt: FilterOption) => {
    const isSelected =
      selected.includes(opt.value) ||
      selected.includes(opt.label) ||
      selected.some(
        (v) =>
          v.toLowerCase() === opt.value.toLowerCase() ||
          v.toLowerCase() === opt.label.toLowerCase()
      );

    if (isSelected) {
      onChange(
        selected.filter(
          (v) =>
            v !== opt.value &&
            v !== opt.label &&
            v.toLowerCase() !== opt.value.toLowerCase() &&
            v.toLowerCase() !== opt.label.toLowerCase()
        )
      );
    } else {
      onChange([...selected, opt.value]);
    }
  };

  return (
    <div className="border-b border-gray-200/80 bg-white">
      {/* Section Header Button */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/60 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-black uppercase tracking-wider text-gray-900">
            {group.label}
          </span>
          {selected.length > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#ed1c24] text-white text-[9px] font-black">
              {selected.length}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-black transition-transform duration-200 shrink-0 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Accordion Content */}
      {expanded && (
        <div className="px-5 pb-4 pt-1">
          {/* Search bar inside group if many options */}
          {group.options.length > 6 && (
            <div className="relative mb-2.5">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-[12px] border border-gray-200 rounded-md outline-none focus:border-[#ed1c24] bg-white placeholder:text-gray-400"
              />
            </div>
          )}

          {/* Options list */}
          <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filtered.map(opt => {
              const isChecked = selected.includes(opt.value) || selected.includes(opt.label) || selected.some(s => s.toLowerCase() === opt.label.toLowerCase() || s.toLowerCase() === opt.value.toLowerCase());
              return (
                <label
                  key={opt.value}
                  className="flex items-center gap-2.5 py-1.5 cursor-pointer group select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(opt)}
                    className="w-4 h-4 rounded border-gray-300 text-[#ed1c24] focus:ring-[#ed1c24] accent-[#ed1c24] cursor-pointer"
                  />
                  <span
                    className={`text-[12.5px] transition-colors flex-1 leading-snug ${
                      isChecked ? "font-bold text-gray-900" : "font-medium text-gray-700 group-hover:text-black"
                    }`}
                  >
                    {opt.label}
                  </span>
                  {opt.count > 0 && (
                    <span className="text-[11px] text-gray-400 font-medium">
                      ({opt.count})
                    </span>
                  )}
                </label>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-[12px] text-gray-400 py-2 m-0 text-center">No options found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Drawer Panel ───────────────────────────────────────────── */
export default function FilterPanel({
  open,
  onClose,
  filters,
  allFilters,
  loading,
  selected,
  onChange,
  onClearAll,
  dir = "ltr",
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useScrollLock(open);

  /* Width/Height/Rim (front + rear/staggered variants) are deliberately
     hidden from this drawer — by explicit product decision, not because
     they're wrong or unavailable. They're still fully functional: the
     sticky "Search Tyre Size" finder sets them, they still reach the API
     as real filter params, and results still narrow correctly — this only
     hides them from being duplicated as checkboxes here. Every other real
     aggregation (Brand, Pattern, etc.) still shows, in Magento's own order. */
  const SIZE_FILTER_CODES = new Set([
    "width", "height", "haight", "rim",
    "width_rear", "rear_width", "rwidth",
    "haight_rear", "height_rear", "rear_height", "rheight",
    "rim_rear", "rear_rim", "rrim",
  ]);
  const seenFilterLabels = new Set<string>();
  const visibleFilters = filters.filter((f) => {
    if (SIZE_FILTER_CODES.has(f.code.toLowerCase()) || !f.options || f.options.length === 0) {
      return false;
    }
    const norm = f.label.trim().toLowerCase();
    if (seenFilterLabels.has(norm)) return false;
    seenFilterLabels.add(norm);
    return true;
  });

  /* Check only non-size filter selections */
  const activeFilterEntries = Object.entries(selected).filter(
    ([code, vals]) => !SIZE_FILTER_CODES.has(code.toLowerCase()) && vals.length > 0
  );
  const hasAnySelected = activeFilterEntries.length > 0;

  /* If there are no filters available from backend and nothing selected, do not open/render */
  useEffect(() => {
    if (open && !loading && visibleFilters.length === 0 && !hasAnySelected) {
      onClose();
    }
  }, [open, loading, visibleFilters.length, hasAnySelected, onClose]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Close on Escape key */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  if (!loading && visibleFilters.length === 0 && !hasAnySelected) {
    return null;
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] ${
        open ? "visible pointer-events-auto" : "invisible pointer-events-none"
      } transition-[visibility] duration-300 ease-in-out`}
      style={{
        transitionDelay: open ? "0ms" : "300ms",
      }}
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        dir={dir}
        className={`fixed top-0 bottom-0 z-10 h-full w-[310px] sm:w-[340px] max-w-[85vw] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform ${
          dir === "rtl"
            ? `left-0 ${open ? "translate-x-0" : "-translate-x-full"}`
            : `right-0 ${open ? "translate-x-0" : "translate-x-full"}`
        }`}
      >
        {/* Top Header: Pure Red banner with FILTER BY title and White X close button */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#ed1c24] shrink-0 min-h-[50px]">
          <span className="text-white font-black text-sm uppercase tracking-wider">
            {dir === "rtl"
              ? "تصفية حسب"
              : allFilters && allFilters.length > filters.length
              ? "MORE FILTERS"
              : "FILTER BY"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-white/80 p-1 transition-colors cursor-pointer"
            aria-label="Close filter"
          >
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Clear all filters if selected */}
        {hasAnySelected && (
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                {dir === "rtl" ? "الفلاتر النشطة" : "Active Filters"}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (onClearAll) { onClearAll(); return; }
                  Object.keys(selected).forEach(code => onChange(code, []));
                }}
                className="text-[11px] font-bold text-[#ed1c24] hover:underline uppercase tracking-wide cursor-pointer"
              >
                {dir === "rtl" ? "مسح الكل" : "Clear All"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5 max-h-[90px] overflow-y-auto">
              {activeFilterEntries.map(([code, vals]) =>
                vals.map((val) => {
                  const lookupList = allFilters && allFilters.length > 0 ? allFilters : filters;
                  const group = lookupList.find((g) => g.code === code);
                  const opt = group?.options.find((o) => o.value === val || o.label.toLowerCase() === val.toLowerCase());
                  const label = opt?.label ?? val;
                  return (
                    <span
                      key={`${code}-${val}`}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-gray-200 rounded text-[11px] font-bold text-gray-800 shadow-2xs"
                    >
                      <span>{label}</span>
                      <button
                        type="button"
                        onClick={() => onChange(code, vals.filter((v) => v !== val))}
                        className="text-gray-400 hover:text-[#ed1c24] transition-colors cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Accordion Filter groups */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-5 space-y-4 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border-b border-gray-100 pb-3">
                  <div className="h-4 bg-gray-200 rounded w-28 mb-2" />
                </div>
              ))}
            </div>
          ) : (
            visibleFilters.map((group) => (
              <FilterGroupSection
                key={group.code}
                group={group}
                selected={selected[group.code] ?? []}
                onChange={values => onChange(group.code, values)}
                defaultOpen={false}
              />
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
