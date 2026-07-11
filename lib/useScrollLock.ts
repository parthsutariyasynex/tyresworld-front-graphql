import { useEffect } from "react";

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [locked]);
}
