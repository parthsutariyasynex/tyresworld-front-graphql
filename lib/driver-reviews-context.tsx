"use client";

/* ─────────────────────────────────────────────────────────────────
   DRIVER REVIEWS (Klever) — SDK boot + config context

   Ports view/frontend/templates/widget/sdk_script.phtml to headless:
   - fetch config once (/api/driver-reviews)
   - inject the DriverReviews SDK <script> exactly once
   - re-scan widgets on every SPA route change (refreshWidgets)

   Per-product widget data comes from `product.driverReviews`; the
   widget containers are rendered by <DriverReviewsWidget>.
───────────────────────────────────────────────────────────────── */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

export type DriverReviewsConfig = {
  enabled: boolean;
  widget_enabled: boolean;
  sdk_url: string;
  widget_pubkey: string;
  language: string;
  popup_style: string;
  slide_in_popup: boolean;
  product_widget_type: string;
  review_size: number;
  infinite_scroll: boolean;
  show_external_reviews: boolean;
  show_category_rating: boolean;
  show_jsonld: boolean;
};

const SCRIPT_ID = "dr-script";

const DriverReviewsContext = createContext<DriverReviewsConfig | null>(null);

/** Access the DriverReviews config (null until loaded / when disabled). */
export function useDriverReviews(): DriverReviewsConfig | null {
  return useContext(DriverReviewsContext);
}

declare global {
  interface Window {
    driverreviews?: { refreshWidgets?: () => void };
  }
}

function injectSdk(cfg: DriverReviewsConfig): void {
  if (!cfg.enabled || !cfg.widget_enabled || !cfg.widget_pubkey) return;
  if (document.getElementById(SCRIPT_ID)) return; // already loaded

  const s = document.createElement("script");
  s.async = true;
  s.defer = true;
  s.id = SCRIPT_ID;
  s.src = cfg.sdk_url;
  s.setAttribute("data-pubkey", cfg.widget_pubkey);
  s.setAttribute("data-lang", cfg.language); // resolved server-side, never "auto"
  if (cfg.slide_in_popup) s.setAttribute("data-slide-in-popup", ""); // presence-only
  document.head.appendChild(s);
}

/** Ask the SDK to re-scan the DOM for widget containers, retrying until it loads. */
function refreshWidgets(): () => void {
  const delays = [0, 500, 1200, 2500, 4000];
  const timers = delays.map((d) =>
    setTimeout(() => window.driverreviews?.refreshWidgets?.(), d),
  );
  return () => timers.forEach(clearTimeout);
}

export function DriverReviewsProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<DriverReviewsConfig | null>(null);
  const pathname = usePathname();
  const bootedRef = useRef(false);

  // Fetch config once + inject the SDK once.
  useEffect(() => {
    let active = true;
    fetch("/api/driver-reviews")
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        const cfg: DriverReviewsConfig | null = d.config ?? null;
        if (!cfg?.enabled || !cfg.widget_enabled || !cfg.widget_pubkey) return;
        setConfig(cfg);
        if (!bootedRef.current) {
          bootedRef.current = true;
          injectSdk(cfg);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Re-scan widgets after each route change (SPA navigation).
  useEffect(() => {
    if (!config) return;
    const cancel = refreshWidgets();
    return cancel;
  }, [pathname, config]);

  return (
    <DriverReviewsContext.Provider value={config}>
      
      {children}
    </DriverReviewsContext.Provider>
  );
}
