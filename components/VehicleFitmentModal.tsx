"use client";

import { useEffect, useState } from "react";
import {
  X,
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  ArrowUpDown,
  CircleDot,
} from "lucide-react";
import { useScrollLock } from "@/lib/useScrollLock";

export type Model = { name: string; years: string; href: string };
export type MakeGroup = { make: string; logo: string; models: Model[] };

/**
 * "Which cars fit this size" modal.
 *
 * Styled to match the TyreFinder size/vehicle popups (components/TyreFinder.tsx):
 * red gradient header, #851214 selection badge, amber step chips, white body on
 * the shared .finder-modal-scroll scrollbar, and the Cancel / action footer bar.
 * The three chips are read-only here — this modal looks a size up rather than
 * stepping through one, so they display the size being queried.
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

  /* Same "— / — R—" formatting the TyreFinder badge uses. */
  const sizeFormatted = `${width || "—"} / ${height || "—"} R${rim || "—"}`;

  /* Read-only chips: WIDTH / HEIGHT / RIM, in the finder's filled state. */
  const chips: { label: string; value: string; icon: React.ReactNode }[] = [
    { label: "WIDTH",  value: width  || "—",              icon: <ArrowLeftRight size={18} strokeWidth={2.5} /> },
    { label: "HEIGHT", value: height || "—",              icon: <ArrowUpDown size={18} strokeWidth={2.5} /> },
    { label: "RIM",    value: rim ? `R${rim}` : "—",      icon: <CircleDot size={18} strokeWidth={2.5} /> },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-[760px] h-[580px] sm:h-[610px] max-h-[90vh] bg-white rounded-[22px] shadow-2xl overflow-hidden flex flex-col border border-gray-100 z-10 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fitment-modal-title"
      >
        {/* ── RED HEADER ── */}
        <div
          className="text-white p-[20px_20px_10px] relative rounded-t-[22px] flex-shrink-0"
          style={{ background: "linear-gradient(#D52D27 0%, #D52D27 55%, #D52D27 100%)" }}
        >
          {/* Top Close Button */}
          <button
            type="button"
            className="absolute top-4 right-5 text-white/90 hover:text-white hover:scale-110 transition-transform p-1 cursor-pointer z-10"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} strokeWidth={2.5} />
          </button>

          {/* Top Row: Title + Tyre Size badge */}
          <div className="flex items-start justify-between gap-2 mb-3.5 pr-8">
            <div className="min-w-0 flex-1">
              <h2
                id="fitment-modal-title"
                className="text-xl sm:text-2xl font-bold text-white leading-tight m-0 tracking-tight"
              >
                {productName}
              </h2>
              <p className="text-white/85 text-xs sm:text-[13px] font-normal mt-1 mb-0 leading-relaxed">
                Vehicles that fit this tyre size — pick a model to shop it.
              </p>
            </div>

            {/* Tyre Size Box */}
            <div className="bg-[#851214] rounded-xl px-4 py-2 text-center min-w-[140px] sm:min-w-[155px] border border-white/10 shrink-0">
              <span className="text-[9px] uppercase font-bold tracking-wider text-white/70 block leading-tight">
                TYRE SIZE
              </span>
              <span className="text-sm font-bold text-white tracking-widest block mt-0.5 leading-tight font-sans">
                {sizeFormatted}
              </span>
            </div>
          </div>

          {/* Step Chips Row (WIDTH / HEIGHT / RIM) */}
          <div className="grid grid-cols-3 gap-3.5 mt-4">
            {chips.map((c) => (
              <div
                key={c.label}
                className="relative rounded-xl sm:rounded-2xl p-3 flex items-center gap-3 text-left bg-white/10 border border-white/20 select-none"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#f4a923] text-white">
                  {c.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider block leading-tight text-white">
                    {c.label}
                  </span>
                  <span className="text-xs sm:text-[14px] font-bold block leading-tight mt-0.5 truncate text-[#f4a923]">
                    {c.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── WHITE BODY ── */}
        <div className="px-5 py-1 flex-1 overflow-y-auto finder-modal-scroll bg-white flex flex-col justify-start">
          {loading && (
            <div className="flex justify-center items-center py-16 flex-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/loader-style1.svg" alt="Loading" width={56} height={56} />
            </div>
          )}

          {!loading && error && (
            <div className="py-14 text-center text-sm font-medium text-gray-400">
              Couldn&apos;t load compatible vehicles.
            </div>
          )}

          {!loading && !error && groups && groups.length === 0 && (
            <div className="py-14 text-center text-sm font-medium text-gray-400">
              No compatible vehicles found for this tyre size.
            </div>
          )}

          {!loading && groups && groups.length > 0 && (
            <div className="divide-y divide-gray-100">
              {groups.map((g) => (
                <div
                  key={g.make}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5"
                >
                  {/* Left: Make Brand Box */}
                  <div className="w-full sm:w-[165px] h-[44px] border border-gray-200 rounded-xl bg-white px-3 flex items-center justify-center sm:justify-start gap-2.5 shrink-0 select-none">
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
                    <span className="text-[13px] font-bold text-gray-900 uppercase tracking-tight truncate">
                      {g.make}
                    </span>
                  </div>

                  {/* Right: Model Pills */}
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    {g.models.map((m, idx) => (
                      <a
                        key={`${m.name}-${idx}`}
                        href={m.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-[44px] border border-gray-200 rounded-xl px-4 bg-white text-gray-900 hover:border-gray-400 hover:shadow-sm transition-all duration-150 active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer"
                      >
                        <span className="text-[15px] font-bold">{m.name}</span>
                        {m.years && (
                          <span className="text-gray-400 font-medium text-[12px]">
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

        {/* ── FOOTER ── */}
        <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between bg-white shrink-0 rounded-b-[22px]">
          <button
            type="button"
            className="text-sm font-bold text-gray-900 hover:text-black flex items-center gap-1.5 transition-colors cursor-pointer"
            onClick={onClose}
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="bg-black hover:bg-gray-900 text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-lg px-8 py-2.5 sm:py-3 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
          >
            <span>Done</span>
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
