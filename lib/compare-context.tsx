"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Product } from "./data";
import Link from "next/link";
import { X } from "lucide-react";
import { useParams } from "next/navigation";

type CompareContextType = {
  comparedProducts: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string | number) => void;
  isCompared: (productId: string | number) => boolean;
  clearCompare: () => void;
  showComparePopup: (product: Product) => void;
};

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);
  const [popupProduct, setPopupProduct] = useState<Product | null>(null);
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  useEffect(() => {
    try {
      const stored = localStorage.getItem("compared_products");
      if (stored) {
        setComparedProducts(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load compared products", e);
    }
  }, []);

  // Rehydrate Magento compare list on mount so the UID stays valid across sessions.
  useEffect(() => {
    const uid = localStorage.getItem("compare_list_uid");
    if (!uid) return;
    fetch(`/api/compare?uid=${encodeURIComponent(uid)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.list?.uid && data.list.uid !== uid) {
          localStorage.setItem("compare_list_uid", data.list.uid);
        }
        // If the server returns null the list was deleted — clear local state too.
        if (!data.list) {
          localStorage.removeItem("compare_list_uid");
          localStorage.removeItem("compared_products");
          setComparedProducts([]);
        }
      })
      .catch(() => {});
  }, []);

  const saveToStorage = (products: Product[]) => {
    try {
      localStorage.setItem("compared_products", JSON.stringify(products));
    } catch (e) {
      console.error("Failed to save compared products", e);
    }
  };

  const addToCompare = async (product: Product) => {
    if (comparedProducts.some((p) => p.id === product.id)) return;
    const updated = [...comparedProducts, product];
    setComparedProducts(updated);
    saveToStorage(updated);
    setPopupProduct(product);

    // Magento sync
    try {
      const token = localStorage.getItem("customer_token") || undefined;
      const uid = localStorage.getItem("compare_list_uid");
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: uid ? "add" : "create",
          token,
          uid: uid || undefined,
          products: [String(product.id)],
        }),
      });
      const data = await res.json();
      if (data.list?.uid) {
        localStorage.setItem("compare_list_uid", data.list.uid);
      }
    } catch (e) {
      console.error("Magento compare add failed", e);
    }
  };

  const removeFromCompare = async (productId: string | number) => {
    const updated = comparedProducts.filter((p) => p.id !== productId);
    setComparedProducts(updated);
    saveToStorage(updated);

    // Magento sync
    try {
      const token = localStorage.getItem("customer_token") || undefined;
      const uid = localStorage.getItem("compare_list_uid");
      if (uid) {
        await fetch("/api/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            op: "remove",
            token,
            uid,
            products: [String(productId)],
          }),
        });
      }
    } catch (e) {
      console.error("Magento compare remove failed", e);
    }
  };

  const isCompared = (productId: string | number) => {
    return comparedProducts.some((p) => p.id === productId);
  };

  const clearCompare = async () => {
    setComparedProducts([]);
    try {
      localStorage.removeItem("compared_products");
      const uid = localStorage.getItem("compare_list_uid");
      if (uid) {
        localStorage.removeItem("compare_list_uid");
        const token = localStorage.getItem("customer_token") || undefined;
        await fetch("/api/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            op: "delete",
            token,
            uid,
          }),
        });
      }
    } catch {}
  };

  const showComparePopup = (product: Product) => {
    setPopupProduct(product);
  };

  const closePopup = () => {
    setPopupProduct(null);
  };

  return (
    <CompareContext.Provider
      value={{
        comparedProducts,
        addToCompare,
        removeFromCompare,
        isCompared,
        clearCompare,
        showComparePopup,
      }}
    >
      {children}

      {/* ── Compare Popup Modal ────────────────────────────────────── */}
      {popupProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          {/* Backdrop click close */}
          <div className="absolute inset-0" onClick={closePopup} />

          {/* Modal Container */}
          <div 
            className="relative bg-white rounded-md shadow-2xl border border-gray-100 max-w-md w-full mx-4 pt-6 pb-6 px-6 z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center"
            style={{ maxWidth: "440px" }}
          >
            {/* Close button */}
            <button
              onClick={closePopup}
              className="absolute top-3 right-3 text-gray-400 hover:text-black transition-colors"
              aria-label="Close"
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            {/* Heading */}
            <h2 className="text-sm font-extrabold text-black tracking-widest uppercase text-center mb-1">
              ADDED TO COMPARE
            </h2>

            {/* Product Name */}
            <p className="text-[13px] font-black text-gray-900 text-center px-2 mt-3 mb-6 uppercase leading-relaxed max-w-[380px]">
              {popupProduct.name}
            </p>

            {/* Actions */}
            <div className="flex gap-2.5 w-full">
              <Link
                href={`/${locale}/compare`}
                onClick={closePopup}
                className="flex-1 text-center bg-[#ed1c24] hover:bg-[#c6181d] text-white py-2.5 px-4 rounded font-bold uppercase tracking-wider text-[11px] transition-colors"
              >
                VIEW COMPARE LIST
              </Link>
              <button
                onClick={closePopup}
                className="flex-1 text-center bg-black hover:bg-gray-950 text-white py-2.5 px-4 rounded font-bold uppercase tracking-wider text-[11px] transition-colors"
              >
                CONTINUE SHOPPING
              </button>
            </div>
          </div>
        </div>
      )}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (ctx === undefined) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return ctx;
}
