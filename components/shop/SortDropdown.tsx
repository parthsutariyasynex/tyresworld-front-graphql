"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

// Only sorts the Magento store actually supports (position, relevance).
export const sortOptions = [
  { value: "featured",  label: "Featured" },
  { value: "relevance", label: "Best Match" },
];

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function SortDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = sortOptions.find((o) => o.value === value) ?? sortOptions[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium text-ink bg-white border border-ink/10 rounded-xl px-4 py-2.5 hover:border-ink/25 transition-colors"
      >
        <span className="text-ink/50 hidden sm:inline">Sort:</span>
        {selected.label}
        <ChevronDown size={14} className={`text-ink/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-ink/8 rounded-2xl shadow-cardHover py-2 z-30 animate-fade-in">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-ink/65 hover:text-ink hover:bg-cream transition-colors"
            >
              {opt.label}
              {opt.value === value && <Check size={14} className="text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
