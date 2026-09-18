"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2 } from "lucide-react";
import { useScrollLock } from "@/lib/useScrollLock";

/**
 * "Fully Fitted Price per Item" inclusions popup — what that price covers.
 * Shared by every place that shows the "Fully Fitted Price per Item" label
 * (product cards on listing pages, PDP's pricing card) so the wording and
 * design stay in one place instead of four separate copies.
 */
const INCLUSIONS = [
  "VAT",
  "Professional tyre fitting (Beadlock wheels excluded)",
  "Wheel balancing",
  "New standard rubber valve",
  "Delivery to the installer",
  "Eco-friendly disposal of old tyres",
  "Bonus: When you buy 4 tyres, enjoy 1 FREE tyre rotation every 20,000 km (up to once per year)",
];

export default function FullyFittedPriceModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || typeof document === "undefined") return null;

  const modalContent = (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 transition-opacity duration-200 ease-out ${
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fully-fitted-price-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className={`relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full p-6 sm:p-8 z-10 transition-all duration-200 ease-out ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-500 hover:text-black hover:scale-110 transition-all p-1 cursor-pointer"
          aria-label="Close"
        >
          <X size={20} strokeWidth={2.2} />
        </button>

        <h3
          id="fully-fitted-price-title"
          className="text-sm sm:text-[15px] font-black uppercase tracking-wider text-gray-950 mb-5 pr-8"
        >
          Fully Fitted Price per Tire Includes:
        </h3>

        <ul className="space-y-4">
          {INCLUSIONS.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <CheckCircle2 size={20} className="shrink-0 mt-0.5 text-[#ed1c24]" strokeWidth={2.2} />
              <span className="text-xs sm:text-sm text-gray-700 leading-snug font-medium">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
