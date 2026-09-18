import { useEffect } from "react";

let lockCount = 0;
let originalBodyOverflow = "";
let originalBodyPaddingRight = "";

/**
 * Locks page scroll while `locked` is true.
 * Preserves html scrollbar gutter to prevent any layout shift across the page,
 * fixed headers, or centered wrappers.
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof document === "undefined") return;

    const body = document.body;

    if (lockCount === 0) {
      originalBodyOverflow = body.style.overflow;
      originalBodyPaddingRight = body.style.paddingRight;

      const prevClientWidth = document.documentElement.clientWidth;
      body.style.overflow = "hidden";

      const delta = document.documentElement.clientWidth - prevClientWidth;
      if (delta > 0) {
        body.style.paddingRight = `${delta}px`;
      }
    }
    lockCount++;

    return () => {
      lockCount--;
      if (lockCount <= 0) {
        lockCount = 0;
        body.style.overflow = originalBodyOverflow;
        body.style.paddingRight = originalBodyPaddingRight;
      }
    };
  }, [locked]);
}

