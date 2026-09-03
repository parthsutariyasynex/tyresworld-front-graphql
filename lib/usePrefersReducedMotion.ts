"use client";

import { useEffect, useState } from "react";

/**
 * True when the visitor has asked the OS for reduced motion.
 *
 * Starts `false` so server and first client render agree (no hydration
 * mismatch), then updates on mount and whenever the setting changes.
 * Carousels use it to skip autoplay rather than pausing on hover — hover
 * pausing makes a hero look broken to everyone, while this turns motion
 * off only for the people who actually asked for that.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);

    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
