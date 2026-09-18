"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import { useScrollLock } from "@/lib/useScrollLock";

export type Model = { name: string; years: string; href: string };
export type MakeGroup = { make: string; logo: string; models: Model[] };

/**
 * "Which cars fit this size" fitment modal.
 * Clean, modern white card with dashed dividers and bold typography.
 * Rendered through a portal with smooth opening and closing animations.
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
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [groups, setGroups] = useState<MakeGroup[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      const timer = setTimeout(() => {
        setMounted(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

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

  if (!mounted || typeof document === "undefined") return null;

  const modalContent = (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 transition-opacity duration-200 ease-out ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fitment-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card — dynamically fits content height */}
      <div
        className={`relative w-full max-w-[700px] max-h-[85vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 z-10 p-6 sm:p-8 transition-all duration-200 ease-out ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button (X) */}
        <button
          type="button"
          className="absolute top-4 sm:top-6 right-4 sm:right-6 text-gray-500 hover:text-black hover:scale-110 transition-transform p-1.5 cursor-pointer z-10"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={24} strokeWidth={2.2} />
        </button>

        {/* ── Centered Bold Black Title ── */}
        <div className="text-center mb-6 sm:mb-8 pr-8 pl-8 shrink-0">
          <h2
            id="fitment-modal-title"
            className="text-xl sm:text-2xl font-black text-black leading-tight tracking-tight uppercase"
          >
            {productName}
          </h2>
        </div>

        {/* ── Body: Vehicles List with Dashed Dividers ── */}
        <div className="overflow-y-auto finder-modal-scroll pr-1 flex flex-col">
          {loading && (
            <div className="flex flex-col justify-center items-center py-10 animate-fade-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/loader-style1.svg" alt="Loading" width={48} height={48} />
              <span className="text-xs font-semibold text-gray-400 mt-3 tracking-wide">
                Finding compatible vehicles...
              </span>
            </div>
          )}

          {!loading && error && (
            <div className="py-10 text-center text-sm font-medium text-gray-400 animate-fade-in">
              Couldn&apos;t load compatible vehicles.
            </div>
          )}

          {!loading && !error && groups && groups.length === 0 && (
            <div className="py-10 text-center text-sm font-medium text-gray-400 animate-fade-in">
              No compatible vehicles found for this tyre size.
            </div>
          )}

          {!loading && groups && groups.length > 0 && (
            <div className="divide-y divide-dashed divide-gray-300 animate-fade-in">
              {groups.map((g) => (
                <div
                  key={g.make}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
                >
                  {/* Left: Make Brand Box */}
                  <div className="w-full sm:w-[170px] h-[46px] border border-gray-300/90 rounded-md bg-white px-3.5 flex items-center justify-start gap-2.5 shrink-0 select-none shadow-2xs">
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
                    <span className="text-[13px] font-bold text-gray-900 uppercase tracking-wider truncate">
                      {g.make}
                    </span>
                  </div>

                  {/* Right: Model Pills */}
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    {g.models.map((m, idx) => (
                      <Link
                        key={`${m.name}-${idx}`}
                        href={m.href}
                        onClick={onClose}
                        className="h-[46px] border border-gray-300/90 rounded-md px-4 bg-white text-gray-900 hover:border-[#ed1c24] hover:text-[#ed1c24] hover:shadow-2xs transition-all duration-150 active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer shadow-2xs"
                      >
                        <span className="text-[14px] sm:text-[15px] font-bold text-gray-900">{m.name}</span>
                        {m.years && (
                          <span className="text-gray-400 font-normal text-[13px]">
                            {m.years}
                          </span>
                        )}
                      </Link>
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

  return createPortal(modalContent, document.body);
}
