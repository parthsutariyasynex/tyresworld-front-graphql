"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";

/**
 * Bridges auth and cart contexts without circular dependencies.
 * Must be rendered inside both AuthProvider and CartProvider.
 * On login it adopts/merges the customer cart; on logout it clears it.
 * (The session cookie authenticates the cart requests server-side.)
 */
export default function CartAuthSync() {
  const { isLoggedIn, ready: authReady } = useAuth();
  const { syncCustomerCart, logoutCart }  = useCart();
  const prevRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!authReady) return;

    const prev = prevRef.current;
    prevRef.current = isLoggedIn;

    // Skip the very first tick — cart hydration already handled initial state.
    if (prev === null) return;

    if (isLoggedIn && prev === false) {
      syncCustomerCart();
    } else if (!isLoggedIn && prev === true) {
      logoutCart();
    }
  }, [isLoggedIn, authReady, syncCustomerCart, logoutCart]);

  return null;
}
