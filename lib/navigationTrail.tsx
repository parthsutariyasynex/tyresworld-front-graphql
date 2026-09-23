"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

export interface NavigationTrailEntry {
  path: string;
  label: string;
}

interface NavigationTrailContextValue {
  /** Ordered list of distinct pages visited this session, oldest first. */
  trail: NavigationTrailEntry[];
  /** Records (or moves to) the current page in the trail with its display label. */
  visit: (path: string, label: string) => void;
}

const NavigationTrailContext = createContext<NavigationTrailContextValue | null>(null);

const STORAGE_KEY = "tw_nav_trail_v1";
const MAX_ENTRIES = 15;

function normalizePath(path: string): string {
  const stripped = path.replace(/^\/(en|ar)(?=\/|$)/, "") || "/";
  return stripped.length > 1 ? stripped.replace(/\/+$/, "") : stripped;
}

function readStoredTrail(): NavigationTrailEntry[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredTrail(trail: NavigationTrailEntry[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trail));
  } catch {
    // Private-mode / quota errors — the in-memory trail still works for this tab.
  }
}

export function NavigationTrailProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [trail, setTrail] = useState<NavigationTrailEntry[]>([]);
  const hydrated = useRef(false);

  // Seeds `trail` from sessionStorage exactly once per mount. Split out from
  // `visit` (rather than reading storage inside its setState updater) because
  // React Strict Mode's dev-only double-invoke of updater functions would
  // otherwise run the read/mutate/write sequence twice against a stale
  // snapshot and silently drop earlier entries.
  const ensureHydrated = useCallback(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const stored = readStoredTrail();
    if (stored.length) setTrail(stored);
  }, []);

  // Returning to the homepage starts a fresh journey.
  useEffect(() => {
    if (normalizePath(pathname || "/") === "/") {
      hydrated.current = true;
      setTrail([]);
    }
  }, [pathname]);

  // Persist every committed change — decoupled from `visit` so it only ever
  // runs against the real, current state instead of a function that Strict
  // Mode may invoke twice with mismatched snapshots.
  useEffect(() => {
    if (hydrated.current) writeStoredTrail(trail);
  }, [trail]);

  const visit = useCallback(
    (path: string, label: string) => {
      if (!label) return;
      const normalized = normalizePath(path);
      if (normalized === "/") return;

      ensureHydrated();

      setTrail((prev) => {
        const existingIdx = prev.findIndex((e) => e.path === normalized);
        if (existingIdx !== -1) {
          if (existingIdx === prev.length - 1 && prev[existingIdx].label === label) {
            return prev;
          }
          // Revisiting an earlier page (Back/Forward, or clicking an earlier
          // crumb): drop everything visited after it and refresh its label.
          const next = prev.slice(0, existingIdx + 1);
          next[existingIdx] = { path: normalized, label };
          return next;
        }
        return [...prev, { path: normalized, label }].slice(-MAX_ENTRIES);
      });
    },
    [ensureHydrated]
  );

  return (
    <NavigationTrailContext.Provider value={{ trail, visit }}>
      {children}
    </NavigationTrailContext.Provider>
  );
}

export function useNavigationTrail() {
  const ctx = useContext(NavigationTrailContext);
  if (!ctx) {
    throw new Error("useNavigationTrail must be used within a NavigationTrailProvider");
  }
  return ctx;
}
