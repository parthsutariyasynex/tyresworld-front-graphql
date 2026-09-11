"use client";

import { X, CheckCircle2 } from "lucide-react";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-150 max-w-md w-full p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-900 hover:text-black transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-5 pr-8">
          Fully Fitted Price per Tire Includes:
        </h3>

        <ul className="space-y-4">
          {INCLUSIONS.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <CheckCircle2 size={20} className="shrink-0 mt-0.5 text-[#ed1c24]/70" strokeWidth={2} />
              <span className="text-sm text-gray-700 leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
