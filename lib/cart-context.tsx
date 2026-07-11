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

const CART_KEY = "magento_cart_id";
const AUTH_KEY = "customer_token"; // mirrors auth-context's STORAGE_KEY

type CartContextValue = {
  cart: ServerCart | null;
  cartId: string | null;
  cartToken: string | null;
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
  loginWithToken: (token: string) => Promise<void>;
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
  const [cartId, setCartId]   = useState<string | null>(null);
  const [cart, setCart]       = useState<ServerCart | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady]     = useState(false);
  const cartIdRef = useRef<string | null>(null);
  const tokenRef  = useRef<string | null>(null);

  const persistId = useCallback((id: string | null) => {
    cartIdRef.current = id;
    setCartId(id);
    try {
      if (id) localStorage.setItem(CART_KEY, id);
      else    localStorage.removeItem(CART_KEY);
    } catch {/* ignore */}
  }, []);

  /* Hydrate: prefer customer cart when a token exists. */
  useEffect(() => {
    let active = true;
    (async () => {
      let authToken: string | null = null;
      try { authToken = localStorage.getItem(AUTH_KEY); } catch {/* ignore */}

      if (authToken) {
        tokenRef.current = authToken;
        const { cartId: customerId } = await api({ op: "customerCart", token: authToken });
        if (!active) return;
        if (customerId) {
          cartIdRef.current = customerId;
          setCartId(customerId);
          try { localStorage.setItem(CART_KEY, customerId); } catch {}
          const { cart: c } = await api({ op: "get", cartId: customerId, token: authToken });
          if (!active) return;
          if (c) setCart(c);
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
  }, [persistId]);

  /* Called by CartAuthSync after a successful login. */
  const loginWithToken = useCallback(async (token: string) => {
    tokenRef.current = token;
    setLoading(true);
    try {
      const { cartId: customerCartId } = await api({ op: "customerCart", token });
      if (!customerCartId) return;

      const guestId = cartIdRef.current;
      if (guestId && guestId !== customerCartId) {
        await api({ op: "mergeCart", guestCartId: guestId, customerCartId, token });
      }

      cartIdRef.current = customerCartId;
      setCartId(customerCartId);
      try { localStorage.setItem(CART_KEY, customerCartId); } catch {}
      const { cart: c } = await api({ op: "get", cartId: customerCartId, token });
      if (c) setCart(c);
    } finally {
      setLoading(false);
    }
  }, []);

  /* Called by CartAuthSync on logout. */
  const logoutCart = useCallback(() => {
    // Mark the customer cart inactive on Magento before clearing local state.
    // Fire-and-forget: UI clears immediately; network call runs in background.
    const idToInactivate = cartIdRef.current;
    const tokToUse = tokenRef.current;
    if (idToInactivate) {
      api({ op: "setInactive", cartId: idToInactivate, token: tokToUse || undefined })
        .catch(() => {/* best-effort */});
    }
    tokenRef.current = null;
    persistId(null);
    setCart(null);
  }, [persistId]);

  const refresh = useCallback(async () => {
    if (!cartIdRef.current) return;
    const { cart: c } = await api({ op: "get", cartId: cartIdRef.current, token: tokenRef.current || undefined });
    setCart(c ?? null);
  }, []);

  const addItem = useCallback(async (product: Product, qty = 1): Promise<{ error?: string }> => {
    if (!product.sku) {
      return { error: "This product cannot be added to cart (missing SKU)." };
    }

    const cartItems = [{ sku: product.sku, quantity: qty }];
    const tok = tokenRef.current || undefined;

    setLoading(true);
    try {
      // ── No cart yet: create cart + add item in one Magento round-trip ──────
      if (!cartIdRef.current) {
        const res = await api({ op: "addToNewCart", cartItems, token: tok });
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
      let res = await api({ op: "add", cartId: cartIdRef.current, cartItems, token: tok });

      // Stale cartId (e.g. cart expired on Magento): clear and recover with a fresh cart
      if (!res.cart && res.error) {
        persistId(null);
        const retryRes = await api({ op: "addToNewCart", cartItems, token: tok });
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
    const tok = tokenRef.current || undefined;
    if (qty <= 0) {
      setLoading(true);
      try {
        const res = await api({ op: "remove", cartId: cartIdRef.current, uid, token: tok });
        if (res.cart) setCart(res.cart);
      } finally { setLoading(false); }
      return;
    }
    setLoading(true);
    try {
      const res = await api({ op: "update", cartId: cartIdRef.current, uid, qty, token: tok });
      if (res.cart) setCart(res.cart);
    } finally { setLoading(false); }
  }, []);

  const removeItem = useCallback(async (uid: string) => {
    if (!cartIdRef.current) return;
    setLoading(true);
    try {
      const res = await api({ op: "remove", cartId: cartIdRef.current, uid, token: tokenRef.current || undefined });
      if (res.cart) setCart(res.cart);
    } finally { setLoading(false); }
  }, []);

  const applyCoupon = useCallback(async (code: string): Promise<string | null> => {
    if (!cartIdRef.current) return "No cart";
    setLoading(true);
    try {
      const res = await api({ op: "applyCoupon", cartId: cartIdRef.current, code, token: tokenRef.current || undefined });
      if (res.cart) { setCart(res.cart); return null; }
      return res.error ?? "Could not apply coupon";
    } finally { setLoading(false); }
  }, []);

  const removeCoupon = useCallback(async () => {
    if (!cartIdRef.current) return;
    setLoading(true);
    try {
      const res = await api({ op: "removeCoupon", cartId: cartIdRef.current, token: tokenRef.current || undefined });
      if (res.cart) setCart(res.cart);
    } finally { setLoading(false); }
  }, []);

  const clearLocal = useCallback(() => {
    persistId(null);
    setCart(null);
  }, [persistId]);

  const setInactive = useCallback(async (id: string): Promise<{ success: boolean; error?: string | null }> => {
    if (!id) return { success: false, error: "cartId is required" };
    const res = await api({ op: "setInactive", cartId: id, token: tokenRef.current || undefined });
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
        cart, cartId, cartToken: tokenRef.current, items, count,
        subtotal, grandTotal, currency, loading, ready,
        addItem, updateQty, removeItem, applyCoupon, removeCoupon,
        refresh, clearLocal, setInactive, loginWithToken, logoutCart,
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
