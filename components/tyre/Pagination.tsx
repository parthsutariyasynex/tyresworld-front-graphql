"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  current: number;
  total: number;
  onChange: (page: number) => void;
  locale?: string;
};

export default function Pagination({ current, total, onChange, locale = "en" }: Props) {
  if (total <= 1) return null;

  const isAr = locale === "ar";
  const pages: (number | "…")[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push("…");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push("…");
    pages.push(total);
  }

  // Icons based on layout direction
  const PrevIcon = isAr ? ChevronRight : ChevronLeft;
  const NextIcon = isAr ? ChevronLeft : ChevronRight;

  return (
    <div className="flex items-center justify-center gap-2 mt-12 mb-4">
      {/* Previous Button */}
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-250/60 text-gray-500 hover:text-black hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed bg-white transition-colors duration-200"
        aria-label={isAr ? "الصفحة السابقة" : "Previous page"}
      >
        <PrevIcon size={16} />
      </button>

      {/* Pages */}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={`w-9 h-9 rounded-full text-sm font-bold transition-colors duration-200 ${
              p === current
                ? "bg-[#ed1c24] text-white border border-[#ed1c24]"
                : "border border-gray-250/60 text-gray-600 hover:border-gray-400 hover:text-black bg-white"
            }`}
          >
            {p}
          </button>
        )
      )}

      {/* Next Button */}
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-250/60 text-gray-500 hover:text-black hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed bg-white transition-colors duration-200"
        aria-label={isAr ? "الصفحة التالية" : "Next page"}
      >
        <NextIcon size={16} />
      </button>
    </div>
  );
}
