"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";

const AUTH_KEY = "customer_token";

/**
 * Bridges auth and cart contexts without circular dependencies.
 * Must be rendered inside both AuthProvider and CartProvider.
 */
export default function CartAuthSync() {
  const { isLoggedIn, ready: authReady } = useAuth();
  const { loginWithToken, logoutCart }   = useCart();
  const prevRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!authReady) return;

    const prev = prevRef.current;
    prevRef.current = isLoggedIn;

    // Skip the very first tick — cart hydration already read the token on mount.
    if (prev === null) return;

    if (isLoggedIn && prev === false) {
      let token: string | null = null;
      try { token = localStorage.getItem(AUTH_KEY); } catch {/* ignore */}
      if (token) loginWithToken(token);
    } else if (!isLoggedIn && prev === true) {
      logoutCart();
    }
  }, [isLoggedIn, authReady, loginWithToken, logoutCart]);

  return null;
}
