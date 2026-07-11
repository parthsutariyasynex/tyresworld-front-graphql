import { type RefObject, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────

export interface UseStickySearchOptions {
  /**
   * Height of the fixed site header in px.
   * The search bar sticks at exactly this offset from the viewport top.
   * Also written to `--header-offset` on <html> so the CSS rule
   *   `.search-wrap.tyreform.sticky { top: var(--header-offset, 70px) }`
   * stays accurate without any inline positioning style on the element.
   * @default 70
   */
  headerOffset?: number;
}

export interface UseStickySearchResult {
  /** True when the hero has scrolled fully above the header edge. */
  isSticky: boolean;
  /**
   * Current rendered height of the search section.
   * Assign to the wrapper div's inline `height` while isSticky is true
   * so the surrounding layout does not collapse when the section leaves flow.
   */
  placeholderHeight: number;
}

// ─── Hook ─────────────────────────────────────────────────────────

/**
 * useStickySearch
 * ---------------
 * Watches a hero element and activates sticky mode on a search section
 * once the hero scrolls fully above the header.
 *
 * Pattern
 * -------
 * ```tsx
 * const heroRef   = useRef<HTMLDivElement>(null);
 * const searchRef = useRef<HTMLElement>(null);
 * const { isSticky, placeholderHeight } = useStickySearch(heroRef, searchRef);
 *
 * <div ref={heroRef}>…hero…</div>
 *
 * // Wrapper holds the search bar's height when it leaves normal flow
 * <div style={isSticky ? { height: placeholderHeight } : undefined}>
 *   <section
 *     ref={searchRef}
 *     className={`search-wrap tyreform${isSticky ? " sticky" : ""}`}
 *   >
 *     …form…
 *   </section>
 * </div>
 * ```
 *
 * All positioning (position: fixed, top, left) lives in CSS — the hook
 * only toggles the class name and tracks the placeholder height.
 */
export function useStickySearch(
  heroRef: RefObject<HTMLElement | null>,
  searchRef: RefObject<HTMLElement | null>,
  { headerOffset = 70 }: UseStickySearchOptions = {},
): UseStickySearchResult {
  const [isSticky, setIsSticky]             = useState(false);
  const [placeholderHeight, setPlaceholder] = useState(0);

  // Tracks the previous sticky value without triggering a re-render —
  // prevents redundant setState calls on every scroll event.
  const prevSticky = useRef(false);
  const rafId      = useRef<number>(0);

  useEffect(() => {
    // SSR guard — window / document do not exist during server rendering.
    if (typeof window === "undefined") return;

    const hero   = heroRef.current;
    const search = searchRef.current;
    if (!hero || !search) return;

    // ── CSS variable sync ──────────────────────────────────────────
    // Writing to <html> keeps the element itself free of inline styles;
    // the CSS rule uses var(--header-offset, 70px) for `top`.
    document.documentElement.style.setProperty(
      "--header-offset",
      `${headerOffset}px`,
    );

    // ── Height measurement ─────────────────────────────────────────
    const measureHeight = () =>
      setPlaceholder(search.getBoundingClientRect().height || search.offsetHeight);

    measureHeight();

    // ── Scroll handler ─────────────────────────────────────────────
    // Deferred into rAF so it never blocks the browser's paint step.
    // Only calls setState when the boolean actually flips.
    const onScroll = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const heroBottom =
          heroRef.current?.getBoundingClientRect().bottom ?? Infinity;
        const next = heroBottom <= headerOffset;

        if (next !== prevSticky.current) {
          prevSticky.current = next;
          setIsSticky(next);
        }
      });
    };

    // ── ResizeObserver ─────────────────────────────────────────────
    // Keeps placeholder height accurate when the search bar resizes
    // (tab switch, viewport rotation, content change, etc.).
    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(measureHeight)
      : null;
    ro?.observe(search);

    window.addEventListener("scroll", onScroll, { passive: true });

    // Run once on mount so a pre-scrolled page starts in the right state.
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId.current);
      ro?.disconnect();
    };
    // heroRef / searchRef are stable object references — safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerOffset]);

  return { isSticky, placeholderHeight };
}
