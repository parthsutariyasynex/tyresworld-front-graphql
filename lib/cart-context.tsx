"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Product } from "./data";
import type { ServerCart, ServerCartItem } from "./cart-queries";

const STORAGE_KEY = "magento_cart_id";

type CartContextValue = {
  cart: ServerCart | null;
  cartId: string | null;
  items: ServerCartItem[];
  count: number;
  subtotal: number;
  grandTotal: number;
  currency: string;
  loading: boolean;
  ready: boolean;
  addItem: (product: Product, qty?: number) => Promise<{ error?: string }>;
  updateQty: (uid: string, qty: number) => Promise<void>;
  removeItem: (uid: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<string | null>;
  removeCoupon: () => Promise<void>;
  refresh: () => Promise<void>;
  clearLocal: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

async function api(payload: Record<string, unknown>): Promise<Record<string, any>> {
  try {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      // Route returned HTML (error page / 404 / 500), not JSON.
      console.warn("[cart] non-JSON response, HTTP", res.status);
      return { error: `Cart service error (HTTP ${res.status})` };
    }
  } catch (e) {
    // Network error / aborted request — never throw to the UI.
    console.warn("[cart] request failed:", e);
    return { error: e instanceof Error ? e.message : "Network error reaching cart API" };
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartId, setCartId] = useState<string | null>(null);
  const [cart, setCart] = useState<ServerCart | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const cartIdRef = useRef<string | null>(null);

  const persistId = useCallback((id: string | null) => {
    cartIdRef.current = id;
    setCartId(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {/* ignore */}
  }, []);

  /* Hydrate: load saved cart id and fetch its contents. */
  useEffect(() => {
    let active = true;
    (async () => {
      let id: string | null = null;
      try { id = localStorage.getItem(STORAGE_KEY); } catch {/* ignore */}
      if (id) {
        const { cart: c } = await api({ op: "get", cartId: id });
        if (!active) return;
        if (c) { cartIdRef.current = id; setCartId(id); setCart(c); }
        else { persistId(null); }   // expired/invalid cart id
      }
      if (active) setReady(true);
    })();
    return () => { active = false; };
  }, [persistId]);

  /* Ensure a cart exists, returning its id. */
  const ensureCart = useCallback(async (): Promise<string | null> => {
    if (cartIdRef.current) return cartIdRef.current;
    const { cartId: id } = await api({ op: "create" });
    if (id) persistId(id);
    return id ?? null;
  }, [persistId]);

  const refresh = useCallback(async () => {
    if (!cartIdRef.current) return;
    const { cart: c } = await api({ op: "get", cartId: cartIdRef.current });
    setCart(c ?? null);
  }, []);

  const addItem = useCallback(async (product: Product, qty = 1): Promise<{ error?: string }> => {
    if (!product.sku) {
      const msg = "This product cannot be added to cart (missing SKU).";
      console.warn("[cart] product has no SKU, cannot add:", product.id);
      return { error: msg };
    }
    setLoading(true);
    try {
      let id = await ensureCart();
      if (!id) return { error: "Could not create cart. Please try again." };

      let res = await api({ op: "add", cartId: id, sku: product.sku, qty });

      // Cart expired between sessions → make a fresh one and retry once.
      if (!res.cart && res.error) {
        persistId(null);
        id = await ensureCart();
        if (!id) return { error: "Could not create cart. Please try again." };
        res = await api({ op: "add", cartId: id, sku: product.sku, qty });
      }

      // userError (e.g. OUT_OF_STOCK, PRODUCT_NOT_FOUND) takes priority —
      // Magento still returns the unchanged cart on failure so we must check this first.
      if (res.userError) return { error: res.userError };
      if (res.error)     return { error: res.error };
      if (res.cart) {
        setCart(res.cart);
        return {};
      }
      return { error: "Could not add item to cart." };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to add item." };
    } finally {
      setLoading(false);
    }
  }, [ensureCart, persistId]);

  const updateQty = useCallback(async (uid: string, qty: number) => {
    if (!cartIdRef.current) return;
    // qty ≤ 0 means remove the item entirely
    if (qty <= 0) {
      setLoading(true);
      try {
        const res = await api({ op: "remove", cartId: cartIdRef.current, uid });
        if (res.cart) setCart(res.cart);
      } finally { setLoading(false); }
      return;
    }
    setLoading(true);
    try {
      const res = await api({ op: "update", cartId: cartIdRef.current, uid, qty });
      if (res.cart) setCart(res.cart);
    } finally { setLoading(false); }
  }, []);

  const removeItem = useCallback(async (uid: string) => {
    if (!cartIdRef.current) return;
    setLoading(true);
    try {
      const res = await api({ op: "remove", cartId: cartIdRef.current, uid });
      if (res.cart) setCart(res.cart);
    } finally { setLoading(false); }
  }, []);

  const applyCoupon = useCallback(async (code: string): Promise<string | null> => {
    if (!cartIdRef.current) return "No cart";
    setLoading(true);
    try {
      const res = await api({ op: "applyCoupon", cartId: cartIdRef.current, code });
      if (res.cart) { setCart(res.cart); return null; }
      return res.error ?? "Could not apply coupon";
    } finally { setLoading(false); }
  }, []);

  const removeCoupon = useCallback(async () => {
    if (!cartIdRef.current) return;
    setLoading(true);
    try {
      const res = await api({ op: "removeCoupon", cartId: cartIdRef.current });
      if (res.cart) setCart(res.cart);
    } finally { setLoading(false); }
  }, []);

  const clearLocal = useCallback(() => {
    persistId(null);
    setCart(null);
  }, [persistId]);

  const items = cart?.items ?? [];
  const count = cart?.total_quantity ?? 0;
  const subtotal = cart?.prices?.subtotal_excluding_tax?.value ?? 0;
  const grandTotal = cart?.prices?.grand_total?.value ?? 0;
  const currency = cart?.prices?.grand_total?.currency ?? "AED";

  return (
    <CartContext.Provider
      value={{
        cart, cartId, items, count, subtotal, grandTotal, currency,
        loading, ready, addItem, updateQty, removeItem,
        applyCoupon, removeCoupon, refresh, clearLocal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
