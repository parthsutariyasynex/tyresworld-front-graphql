"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useScrollLock } from "@/lib/useScrollLock";

export type Model = { name: string; years: string; href: string };
export type MakeGroup = { make: string; logo: string; models: Model[] };

/**
 * "Which cars fit this size" modal — pixel-perfect match to Magento theme.
 * Displays make with logo in a red-bordered box, models in red-bordered pills,
 * and dashed horizontal dividers.
 */
export default function VehicleFitmentModal({
  open,
  onClose,
  productName,
  width,
  height,
  rim,
  locale = "en",
}: {
  open: boolean;
  onClose: () => void;
  productName: string;
  width?: string;
  height?: string;
  rim?: string;
  locale?: string;
}) {
  const [groups, setGroups] = useState<MakeGroup[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !width || !height || !rim) return;
    let active = true;
    setLoading(true);
    setError(null);
    setGroups(null);

    fetch(`/api/vehicle-fitment?width=${encodeURIComponent(width)}&height=${encodeURIComponent(height)}&rim=${encodeURIComponent(rim)}&store=${locale}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d.error && !d.groups?.length) setError(d.error);
        setGroups(d.groups ?? []);
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [open, width, height, rim, locale]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-4xl h-[580px] sm:h-[640px] max-h-[90vh] bg-white rounded-xl sm:rounded-2xl shadow-2xl flex flex-col z-10 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fitment-modal-title"
      >
        {/* Top Header */}
        <div className="relative px-6 pt-6 pb-4 sm:px-8 sm:pt-7 shrink-0 text-center border-b border-gray-100">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 sm:right-6 sm:top-6 text-gray-700 hover:text-black p-1 transition-colors cursor-pointer"
          >
            <X size={22} strokeWidth={2.2} />
          </button>
          <h2
            id="fitment-modal-title"
            className="text-[17px] sm:text-[20px] font-black uppercase tracking-tight text-gray-950 px-8"
          >
            {productName}
          </h2>
        </div>

        {/* Modal Body / Rows List */}
        <div className="flex-1 overflow-y-auto pl-6 sm:pl-8 pr-3 sm:pr-4 py-4 sm:py-6 custom-red-scrollbar">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full py-16 text-gray-500 gap-3">
              <Loader2 size={32} className="animate-spin text-[#ed1c24]" />
              <p className="text-sm font-semibold">Loading compatible vehicles…</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center justify-center h-full text-center py-12 text-gray-500">
              <p className="text-sm font-semibold">Couldn&apos;t load compatible vehicles.</p>
            </div>
          )}

          {!loading && !error && groups && groups.length === 0 && (
            <div className="flex items-center justify-center h-full text-center py-12 text-gray-500">
              <p className="text-sm font-semibold">No compatible vehicles found for this tyre size.</p>
            </div>
          )}

          {!loading && groups && groups.length > 0 && (
            <div className="divide-y divide-dashed divide-gray-300">
              {groups.map((g) => (
                <div
                  key={g.make}
                  className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
                >
                  {/* Left: Make Brand Box (Red border outline) */}
                  <div className="border border-[#ed1c24] rounded-[4px] px-3 bg-white flex items-center justify-center sm:justify-start gap-2.5 w-[140px] sm:w-[155px] h-[36px] shrink-0 shadow-2xs select-none">
                    {g.logo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={g.logo}
                        alt={g.make}
                        loading="lazy"
                        className="h-5 w-auto max-w-[34px] object-contain shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}
                    <span className="text-[12px] sm:text-[13px] font-bold text-gray-900 uppercase tracking-tight truncate">
                      {g.make}
                    </span>
                  </div>

                  {/* Right: Model Pills (Red border outline) */}
                  <div className="flex flex-wrap items-center gap-2.5 flex-1">
                    {g.models.map((m, idx) => (
                      <a
                        key={`${m.name}-${idx}`}
                        href={m.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-[36px] border border-[#ed1c24] rounded-[4px] px-3.5 bg-white hover:bg-red-50/60 transition-colors inline-flex items-center gap-2 text-[12px] sm:text-[13px] cursor-pointer shadow-2xs"
                      >
                        <span className="font-bold text-gray-900">{m.name}</span>
                        {m.years && (
                          <span className="text-gray-400 font-medium text-[11px] sm:text-[12px]">
                            {m.years}
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
