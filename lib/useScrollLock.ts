import { useEffect } from "react";

let lockCount = 0;
let originalBodyOverflow = "";
let originalHtmlOverflow = "";

/**
 * Locks page scroll while `locked` is true.
 * Preserves html scrollbar gutter to prevent any layout shift across the page,
 * fixed headers, or centered wrappers.
 *
 * globals.css sets `html { overflow-y: scroll }`, which makes <html> (not
 * <body>) the actual scrolling element, so <body> alone must also be locked
 * on <html> or the page behind the modal can still be scrolled with it.
 * `scrollbar-gutter: stable` on <html> is a permanent CSS rule, so hiding
 * its overflow here doesn't release that reserved gutter — no width jump.
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof document === "undefined") return;

    const body = document.body;
    const html = document.documentElement;

    if (lockCount === 0) {
      originalBodyOverflow = body.style.overflow;
      originalHtmlOverflow = html.style.overflow;

      body.style.overflow = "hidden";
      html.style.overflow = "hidden";
    }
    lockCount++;

    return () => {
      lockCount--;
      if (lockCount <= 0) {
        lockCount = 0;
        body.style.overflow = originalBodyOverflow;
        html.style.overflow = originalHtmlOverflow;
      }
    };
  }, [locked]);
}

