"use client";

import { useState } from "react";
import { ChevronDown, X, SlidersHorizontal } from "lucide-react";
import type { FilterGroup } from "@/lib/magento";

type Props = {
  /** Filter groups from the GraphQL `aggregations` response. */
  groups: FilterGroup[];
  /** code → selected option values */
  selected: Record<string, string[]>;
  onToggle: (code: string, value: string) => void;
  onClear: () => void;
  loading?: boolean;
};

const OPTIONS_PREVIEW = 8;

function Checkbox({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group py-1">
      {/* Real (visually hidden) checkbox so clicks/keyboard actually fire onChange */}
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div
        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ink/30 ${
          checked ? "bg-ink border-ink" : "border-ink/20 group-hover:border-ink/50"
        }`}
      >
        {checked && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="text-sm text-ink/65 group-hover:text-ink transition-colors flex-1 truncate">
        {label}
      </span>
      <span className="text-[11px] text-ink/30 tabular-nums">{count}</span>
    </label>
  );
}

function GroupSection({
  group,
  selected,
  onToggle,
  defaultOpen,
}: {
  group: FilterGroup;
  selected: string[];
  onToggle: (value: string) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? group.options : group.options.slice(0, OPTIONS_PREVIEW);

  return (
    <div className="border-b border-ink/6 py-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-sm font-semibold text-ink">{group.label}</span>
        <ChevronDown size={15} className={`text-ink/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-4">
          {visible.map((opt) => (
            <Checkbox
              key={opt.value}
              label={opt.label}
              count={opt.count}
              checked={selected.includes(opt.value)}
              onChange={() => onToggle(opt.value)}
            />
          ))}
          {group.options.length > OPTIONS_PREVIEW && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="mt-2 text-xs font-medium text-accent hover:underline"
            >
              {showAll ? "Show less" : `Show all ${group.options.length}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const EXCLUDED_FILTER_CODES = new Set([
  "height",
  "width",
  "rim",
  "tyre_height",
  "tyre_width",
  "tyre_rim",
  "rim_size",
]);

export default function FilterSidebar({ groups, selected, onToggle, onClear, loading }: Props) {
  const visibleGroups = groups.filter(
    (g) =>
      !EXCLUDED_FILTER_CODES.has(g.code.toLowerCase()) &&
      !["height", "width", "rim", "rim size", "aspect ratio", "section width"].includes(
        g.label.toLowerCase().trim()
      )
  );

  const activeCount = Object.values(selected).reduce((n, vals) => n + vals.length, 0);

  return (
    <aside className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-1 pb-5 border-b border-ink/6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-ink" />
          <span className="text-sm font-semibold text-ink">Filters</span>
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-ink/50 hover:text-ink transition-colors"
          >
            <X size={12} /> Clear all
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && visibleGroups.length === 0 ? (
        <div className="py-5 space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-3.5 w-24 rounded bg-ink/10 animate-pulse" />
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-3 w-full rounded bg-ink/5 animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      ) : visibleGroups.length === 0 ? (
        <p className="py-6 text-sm text-ink/40">No filters available.</p>
      ) : (
        visibleGroups.map((group, i) => (
          <GroupSection
            key={group.code}
            group={group}
            selected={selected[group.code] ?? []}
            onToggle={(value) => onToggle(group.code, value)}
            defaultOpen={i < 3}
          />
        ))
      )}
    </aside>
  );
}
