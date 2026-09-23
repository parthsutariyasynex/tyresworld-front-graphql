"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useScrollLock } from "@/lib/useScrollLock";
import { useOverviewDrawer } from "@/lib/overview-drawer-context";
import type { AddedModalProduct } from "@/lib/cart-context";

interface AddToCartModalProps {
  product?: AddedModalProduct | null;
  productName?: string | null;
  open: boolean;
  onClose: () => void;
}

export default function AddToCartModal({
  productName,
  open,
  onClose,
}: AddToCartModalProps) {
  const [mounted, setMounted] = useState(false);
  const { openDrawer } = useOverviewDrawer();

  useScrollLock(open);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !mounted || typeof document === "undefined") {
    return null;
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      dir="ltr"
    >
      {/* Click backdrop to close */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div
        className="relative w-full max-w-[540px] bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Added to Cart"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={20} strokeWidth={2.2} />
        </button>

        {/* Modal Title */}
        <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-950 mt-1 mb-3 font-sans">
          {"ADDED TO CART"}
        </h3>

        {/* Product Name */}
        <p className="text-sm sm:text-[15px] font-black text-gray-900 uppercase tracking-tight max-w-[440px] mx-auto leading-snug mb-7 font-sans">
          {productName}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              onClose();
              openDrawer("cart");
            }}
            className="btn-cta w-full sm:w-auto min-w-[190px] text-[13px] py-3.5 px-6 rounded-lg shadow-md cursor-pointer"
          >
            <span>{"PROCEED TO CART"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn-slide-black w-full sm:w-auto min-w-[190px] text-[13px] font-black uppercase tracking-wider py-3.5 px-6 rounded-lg shadow-md cursor-pointer"
          >
            <span>{"CONTINUE SHOPPING"}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
