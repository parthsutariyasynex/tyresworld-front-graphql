"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Customer } from "./auth-queries";

const STORAGE_KEY = "customer_token";

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
  const tokenRef = useRef<string | null>(null);

  const setToken = useCallback((t: string | null) => {
    tokenRef.current = t;
    try {
      if (t) localStorage.setItem(STORAGE_KEY, t);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {/* ignore */}
  }, []);

  const fetchCustomer = useCallback(async () => {
    if (!tokenRef.current) { setCustomer(null); return; }
    const { customer: c, error } = await api({ op: "customer", token: tokenRef.current });
    if (c) setCustomer(c);
    else { setToken(null); setCustomer(null); if (error) console.warn("[auth] session expired:", error); }
  }, [setToken]);

  /* Hydrate from stored token. */
  useEffect(() => {
    let active = true;
    (async () => {
      let t: string | null = null;
      try { t = localStorage.getItem(STORAGE_KEY); } catch {/* ignore */}
      if (t) { tokenRef.current = t; await fetchCustomer(); }
      if (active) setReady(true);
    })();
    return () => { active = false; };
  }, [fetchCustomer]);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    setBusy(true);
    try {
      const { token, error } = await api({ op: "login", email, password });
      if (!token) return error ?? "Invalid email or password.";
      setToken(token);
      await fetchCustomer();
      return null;
    } finally { setBusy(false); }
  }, [setToken, fetchCustomer]);

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
      await api({ op: "logout", token: tokenRef.current });
      setToken(null);
      setCustomer(null);
    } finally { setBusy(false); }
  }, [setToken]);

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
