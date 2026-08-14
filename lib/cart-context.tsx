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
import type { ServerCart, ServerCartItem } from "./types";
import { useAuth } from "./auth-context";

const CART_KEY = "magento_cart_id";

/* The customer token is no longer read on the client — it lives in an
   httpOnly cookie that the browser sends automatically to /api/cart, and
   the route reads it server-side. Login state comes from useAuth(). */

type CartContextValue = {
  cart: ServerCart | null;
  cartId: string | null;
  cartToken: string | null;   // always null now (cookie-based); kept for compat
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
  setInactive: (cartId: string) => Promise<{ success: boolean; error?: string | null }>;
  syncCustomerCart: () => Promise<void>;
  logoutCart: () => void;
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
      console.warn("[cart] non-JSON response, HTTP", res.status);
      return { error: `Cart service error (HTTP ${res.status})` };
    }
  } catch (e) {
    console.warn("[cart] request failed:", e);
    return { error: e instanceof Error ? e.message : "Network error reaching cart API" };
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, ready: authReady } = useAuth();
  const [cartId, setCartId]   = useState<string | null>(null);
  const [cart, setCart]       = useState<ServerCart | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady]     = useState(false);
  const cartIdRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);

  const persistId = useCallback((id: string | null) => {
    cartIdRef.current = id;
    setCartId(id);
    try {
      if (id) localStorage.setItem(CART_KEY, id);
      else    localStorage.removeItem(CART_KEY);
    } catch {/* ignore */}
  }, []);

  /* Hydrate once, after auth is resolved: customer cart (cookie) if logged
     in, otherwise the stored guest cart. Login/logout transitions during the
     session are handled by CartAuthSync → syncCustomerCart / logoutCart. */
  useEffect(() => {
    if (!authReady || hydratedRef.current) return;
    hydratedRef.current = true;

    let active = true;
    (async () => {
      if (isLoggedIn) {
        const { cartId: customerId } = await api({ op: "customerCart" });
        if (!active) return;
        if (customerId) {
          persistId(customerId);
          const { cart: c } = await api({ op: "get", cartId: customerId });
          if (active && c) setCart(c);
        }
      } else {
        let id: string | null = null;
        try { id = localStorage.getItem(CART_KEY); } catch {/* ignore */}
        if (id) {
          const { cart: c } = await api({ op: "get", cartId: id });
          if (!active) return;
          if (c) { cartIdRef.current = id; setCartId(id); setCart(c); }
          else   { persistId(null); }
        }
      }
      if (active) setReady(true);
    })();
    return () => { active = false; };
  }, [authReady, isLoggedIn, persistId]);

  /* Called by CartAuthSync after a login transition: adopt (and merge into)
     the customer cart. The cookie authenticates the request. */
  const syncCustomerCart = useCallback(async () => {
    setLoading(true);
    try {
      const { cartId: customerCartId } = await api({ op: "customerCart" });
      if (!customerCartId) return;

      const guestId = cartIdRef.current;
      if (guestId && guestId !== customerCartId) {
        await api({ op: "mergeCart", guestCartId: guestId, customerCartId });
      }

      persistId(customerCartId);
      const { cart: c } = await api({ op: "get", cartId: customerCartId });
      if (c) setCart(c);
    } finally {
      setLoading(false);
    }
  }, [persistId]);

  /* Called by CartAuthSync on logout. */
  const logoutCart = useCallback(() => {
    const idToInactivate = cartIdRef.current;
    if (idToInactivate) {
      api({ op: "setInactive", cartId: idToInactivate }).catch(() => {/* best-effort */});
    }
    persistId(null);
    setCart(null);
  }, [persistId]);

  const refresh = useCallback(async () => {
    if (!cartIdRef.current) return;
    const { cart: c } = await api({ op: "get", cartId: cartIdRef.current });
    setCart(c ?? null);
  }, []);

  const addItem = useCallback(async (product: Product, qty = 1): Promise<{ error?: string }> => {
    if (!product.sku) {
      return { error: "This product cannot be added to cart (missing SKU)." };
    }

    const cartItems = [{ sku: product.sku, quantity: qty }];

    setLoading(true);
    try {
      // ── No cart yet: create cart + add item in one Magento round-trip ──────
      if (!cartIdRef.current) {
        const res = await api({ op: "addToNewCart", cartItems });
        if (res.userError) return { error: String(res.userError) };
        if (res.error)     return { error: String(res.error) };
        if (res.cart?.id) {
          persistId(res.cart.id as string);
          setCart(res.cart as ServerCart);
          return {};
        }
        return { error: "Could not add item to cart." };
      }

      // ── Cart exists: add to existing cart ───────────────────────────────────
      const res = await api({ op: "add", cartId: cartIdRef.current, cartItems });

      // Stale cartId (e.g. cart expired on Magento): clear and recover with a fresh cart
      if (!res.cart && res.error) {
        persistId(null);
        const retryRes = await api({ op: "addToNewCart", cartItems });
        if (retryRes.userError) return { error: String(retryRes.userError) };
        if (retryRes.error)     return { error: String(retryRes.error) };
        if (retryRes.cart?.id) {
          persistId(retryRes.cart.id as string);
          setCart(retryRes.cart as ServerCart);
          return {};
        }
        return { error: "Could not add item to cart." };
      }

      if (res.userError) return { error: String(res.userError) };
      if (res.error)     return { error: String(res.error) };
      if (res.cart)      { setCart(res.cart as ServerCart); return {}; }
      return { error: "Could not add item to cart." };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Failed to add item." };
    } finally {
      setLoading(false);
    }
  }, [persistId]);

  const updateQty = useCallback(async (uid: string, qty: number) => {
    if (!cartIdRef.current) return;
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

  const setInactive = useCallback(async (id: string): Promise<{ success: boolean; error?: string | null }> => {
    if (!id) return { success: false, error: "cartId is required" };
    const res = await api({ op: "setInactive", cartId: id });
    return { success: res.success === true, error: res.error ?? null };
  }, []);

  const items     = cart?.items ?? [];
  const count     = cart?.total_quantity ?? 0;
  const subtotal  = cart?.prices?.subtotal_excluding_tax?.value ?? 0;
  const grandTotal = cart?.prices?.grand_total?.value ?? 0;
  const currency  = cart?.prices?.grand_total?.currency ?? "SAR";

  return (
    <CartContext.Provider
      value={{
        cart, cartId, cartToken: null, items, count,
        subtotal, grandTotal, currency, loading, ready,
        addItem, updateQty, removeItem, applyCoupon, removeCoupon,
        refresh, clearLocal, setInactive, syncCustomerCart, logoutCart,
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
