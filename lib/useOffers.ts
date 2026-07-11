"use client";

import { useState, useEffect } from "react";
import type { OfferOption } from "@/app/api/offers/route";
import type { Product } from "@/lib/data";

export type { OfferOption };

export interface UseOffersResult {
  offers: OfferOption[];
  loading: boolean;
  error: string | null;
}

export interface UseOfferProductsResult {
  products: Product[];
  total: number;
  totalPages: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
}

/** Fetch the dynamic offers list from /api/offers */
export function useOffers(store = "default"): UseOffersResult {
  const [offers,  setOffers]  = useState<OfferOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/offers?store=${store}`)
      .then(r => r.json())
      .then(d => {
        if (!active) return;
        if (d.error) setError(d.error);
        setOffers(d.offers ?? []);
        setLoading(false);
      })
      .catch(e => { if (active) { setError(e.message); setLoading(false); } });
    return () => { active = false; };
  }, [store]);

  return { offers, loading, error };
}

/** Fetch products for a selected offer value */
export function useOfferProducts(
  offerValue: string | null,
  { store = "default", pageSize = 12, page = 1 } = {}
): UseOfferProductsResult {
  const [products,    setProducts]    = useState<Product[]>([]);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!offerValue) { setProducts([]); setTotal(0); return; }
    let active = true;
    setLoading(true);
    const p = new URLSearchParams({
      offer: offerValue, store, pageSize: String(pageSize), page: String(page),
    });
    fetch(`/api/offers?${p}`)
      .then(r => r.json())
      .then(d => {
        if (!active) return;
        if (d.error) setError(d.error);
        setProducts(d.products ?? []);
        setTotal(d.total ?? 0);
        setTotalPages(d.totalPages ?? 1);
        setCurrentPage(d.currentPage ?? page);
        setLoading(false);
      })
      .catch(e => { if (active) { setError(e.message); setLoading(false); } });
    return () => { active = false; };
  }, [offerValue, store, pageSize, page]);

  return { products, total, totalPages, currentPage, loading, error };
}
