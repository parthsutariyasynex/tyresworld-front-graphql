"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronUp, ChevronDown, Search, Loader2 } from "lucide-react";
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
  loading: boolean;
  selected: Record<string, string[]>;
  onChange: (code: string, values: string[]) => void;
  dir?: "ltr" | "rtl";
  /** Category url_key — enables server-side "View More" search per filter group */
  urlKey?: string;
}

// Show "View More" button when a group has more options than this threshold
const VIEW_MORE_THRESHOLD = 8;

/* ── View More Modal (portaled to document.body) ─────────────────
   Renders above the filter panel by escaping its stacking context.
   Fetches all options server-side via viewMoreFilter, supports
   debounced keyword search. ──────────────────────────────────── */
function ViewMoreModal({
  group,
  selected,
  onToggle,
  urlKey,
  onClose,
}: {
  group: FilterGroup;
  selected: string[];
  onToggle: (value: string) => void;
  urlKey: string;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [options, setOptions] = useState<FilterOption[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Debounce search input by 300 ms to avoid hammering the API
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch from /api/view-more-filter whenever filterName, search, or urlKey changes
  useEffect(() => {
    let active = true;
    setFetchLoading(true);
    const p = new URLSearchParams({
      filterName: group.code,
      search: debouncedSearch,
      urlKey,
    });
    fetch(`/api/view-more-filter?${p}`)
      .then(r => r.json())
      .then((d: { options?: FilterOption[] }) => {
        if (!active) return;
        setOptions(d.options ?? []);
        setFetchLoading(false);
      })
      .catch(() => { if (active) setFetchLoading(false); });
    return () => { active = false; };
  }, [group.code, debouncedSearch, urlKey]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Card */}
      <div className="relative z-[101] w-full max-w-[320px] max-h-[80vh] bg-white rounded-xl shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <span className="text-[11px] font-black uppercase tracking-[1.5px] text-gray-800">
            {group.label}
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search an option .."
              className="w-full pl-8 pr-3 py-2 text-[12px] border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Options list */}
        <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          {fetchLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={18} className="animate-spin text-gray-400" />
            </div>
          ) : options.length === 0 ? (
            <p className="text-[12px] text-gray-400 py-4 text-center">No options found.</p>
          ) : (
            <div className="space-y-1">
              {options.map(opt => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 py-1.5 cursor-pointer group"
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${selected.includes(opt.value)
                        ? "bg-[#ed1c24] border-[#ed1c24]"
                        : "border-gray-300 bg-white group-hover:border-gray-500"
                      }`}
                    onClick={() => onToggle(opt.value)}
                  >
                    {selected.includes(opt.value) && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3l2.5 2.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span
                    className="text-[13px] text-gray-700 group-hover:text-black transition-colors flex-1 leading-snug"
                    onClick={() => onToggle(opt.value)}
                  >
                    {opt.label}
                    {opt.count > 0 && (
                      <span className="text-gray-400 ml-1">({opt.count})</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );

  // Portal to body — escapes the filter panel's transition-transform stacking context
  return typeof document !== "undefined"
    ? createPortal(modal, document.body)
    : null;
}

/* ── Filter group section ────────────────────────────────────────── */
function FilterGroupSection({
  group,
  selected,
  onChange,
  defaultOpen,
  urlKey,
}: {
  group: FilterGroup;
  selected: string[];
  onChange: (values: string[]) => void;
  defaultOpen: boolean;
  urlKey?: string;
}) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const [search, setSearch] = useState("");
  const [viewMoreOpen, setViewMoreOpen] = useState(false);

  const filtered = group.options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const showViewMore = !!urlKey && group.options.length > VIEW_MORE_THRESHOLD;

  return (
    <div className="border-b border-gray-100 last:border-0">
      {/* Section header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-[11px] font-black uppercase tracking-[1.5px] text-gray-800">
          {group.label.toUpperCase()}
          {selected.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#ed1c24] text-white text-[9px] font-black">
              {selected.length}
            </span>
          )}
        </span>
        {expanded
          ? <ChevronUp size={14} className="text-gray-500 shrink-0" />
          : <ChevronDown size={14} className="text-gray-500 shrink-0" />
        }
      </button>

      {/* Options */}
      {expanded && (
        <div className="px-5 pb-4">
          {/* Client-side search — unchanged */}
          {group.options.length > 6 && (
            <div className="relative mb-3">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search an option .."
                className="w-full pl-8 pr-3 py-2 text-[12px] border border-gray-200 rounded-lg outline-none focus:border-gray-400 bg-white placeholder:text-gray-400"
              />
            </div>
          )}

          {/* Checkbox list — unchanged */}
          <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filtered.map(opt => (
              <label
                key={opt.value}
                className="flex items-center gap-3 py-1.5 cursor-pointer group"
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${selected.includes(opt.value)
                      ? "bg-[#ed1c24] border-[#ed1c24]"
                      : "border-gray-300 bg-white group-hover:border-gray-500"
                    }`}
                  onClick={() => toggle(opt.value)}
                >
                  {selected.includes(opt.value) && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3l2.5 2.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span
                  className="text-[13px] text-gray-700 group-hover:text-black transition-colors flex-1 leading-snug"
                  onClick={() => toggle(opt.value)}
                >
                  {opt.label}
                </span>
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="text-[12px] text-gray-400 py-2">No options found.</p>
            )}
          </div>

          {/* View More — triggers server-side search via viewMoreFilter (Commented out as requested)
          {showViewMore && (
            <button
              onClick={() => setViewMoreOpen(true)}
              className="mt-2 text-[11px] font-bold text-[#ed1c24] hover:underline uppercase tracking-wide"
            >
              View More
            </button>
          )}
          */}
        </div>
      )}

      {/* View More modal — portaled outside the panel's stacking context */}
      {viewMoreOpen && urlKey && (
        <ViewMoreModal
          group={group}
          selected={selected}
          onToggle={toggle}
          urlKey={urlKey}
          onClose={() => setViewMoreOpen(false)}
        />
      )}
    </div>
  );
}

/* ── Main panel ──────────────────────────────────────────────────── */
export default function FilterPanel({
  open,
  onClose,
  filters,
  loading,
  selected,
  onChange,
  dir = "ltr",
  urlKey,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  /* close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useScrollLock(open);

  const hasAnySelected = Object.values(selected).some(v => v.length > 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        ref={panelRef}
        dir={dir}
        className={`fixed top-0 z-50 h-full w-[300px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${dir === "rtl"
            ? `left-0 ${open ? "translate-x-0" : "-translate-x-full"}`
            : `right-0 ${open ? "translate-x-0" : "translate-x-full"}`
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#ed1c24] shrink-0">
          <h2 className="text-white font-black text-[15px] uppercase tracking-wider">
            Filter By
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-white/70 transition-colors"
            aria-label="Close filter"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Clear all */}
        {hasAnySelected && (
          <div className="px-5 py-2 border-b border-gray-100 bg-gray-50 shrink-0">
            <button
              onClick={() => {
                filters.forEach(f => onChange(f.code, []));
              }}
              className="text-[11px] font-bold text-[#ed1c24] hover:underline uppercase tracking-wide"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Filter groups */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-5 space-y-4 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gray-200 rounded" />
                        <div className="h-3 bg-gray-200 rounded w-20" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : filters.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 text-sm">No filters available.</p>
            </div>
          ) : (
            filters.map((group, i) => (
              <FilterGroupSection
                key={group.code}
                group={group}
                selected={selected[group.code] ?? []}
                onChange={values => onChange(group.code, values)}
                defaultOpen={i === 0}
                urlKey={urlKey}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
