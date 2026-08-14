"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Customer } from "./types";

/* The session token lives in an httpOnly cookie set by /api/account (see
   lib/auth-cookie.ts). It is never stored in or read from JS — login state
   is derived from whether the server returns a customer. */

type AuthContextValue = {
  customer: Customer | null;
  isLoggedIn: boolean;
  ready: boolean;
  busy: boolean;
  login: (email: string, password: string) => Promise<string | null>;          // null = success
  register: (input: RegisterInput) => Promise<string | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

type RegisterInput = { firstname: string; lastname: string; email: string; password: string };

const AuthContext = createContext<AuthContextValue | null>(null);

async function api(payload: Record<string, unknown>): Promise<Record<string, any>> {
  try {
    const res = await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { return { error: `Account service error (HTTP ${res.status})` }; }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Network error reaching account service" };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  /* Ask the server who we are — it reads the httpOnly cookie. */
  const fetchCustomer = useCallback(async () => {
    const { customer: c, error } = await api({ op: "customer" });
    if (c) setCustomer(c);
    else {
      setCustomer(null);
      if (error && error !== "Not authenticated") console.warn("[auth] session check:", error);
    }
  }, []);

  /* On load, resolve session from the cookie. */
  useEffect(() => {
    let active = true;
    (async () => {
      await fetchCustomer();
      if (active) setReady(true);
    })();
    return () => { active = false; };
  }, [fetchCustomer]);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    setBusy(true);
    try {
      const { ok, error } = await api({ op: "login", email, password });   // sets httpOnly cookie
      if (!ok) return error ?? "Invalid email or password.";
      await fetchCustomer();
      return null;
    } finally { setBusy(false); }
  }, [fetchCustomer]);

  const register = useCallback(async (input: RegisterInput): Promise<string | null> => {
    setBusy(true);
    try {
      const { ok, error } = await api({ op: "register", ...input });
      if (!ok) return error ?? "Could not create account.";
      // Auto-login after successful registration.
      return await login(input.email, input.password);
    } finally { setBusy(false); }
  }, [login]);

  const logout = useCallback(async () => {
    setBusy(true);
    try {
      await api({ op: "logout" });   // clears the httpOnly cookie
      setCustomer(null);
    } finally { setBusy(false); }
  }, []);

  return (
    <AuthContext.Provider
      value={{ customer, isLoggedIn: !!customer, ready, busy, login, register, logout, refresh: fetchCustomer }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
