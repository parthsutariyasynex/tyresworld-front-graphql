"use client";

import type { RefObject } from "react";

interface HeroSectionProps {
  /**
   * Ref forwarded to the outermost hero element.
   * The parent passes this in so useStickySearch can observe
   * when the hero exits the viewport.
   */
  heroRef: RefObject<HTMLDivElement>;
  children?: React.ReactNode;
}

/**
 * HeroSection
 * -----------
 * Pure UI wrapper for the page hero / banner.
 * Accepts a forwarded ref so the parent can hand it to useStickySearch
 * without this component needing to know anything about sticky behaviour.
 *
 * Usage
 * -----
 * ```tsx
 * const heroRef = useRef<HTMLDivElement>(null);
 * <HeroSection heroRef={heroRef}>
 *   <HeroSlider />
 * </HeroSection>
 * ```
 */
export default function HeroSection({ heroRef, children }: HeroSectionProps) {
  return (
    <div ref={heroRef} className="hero-section">
      {children}
    </div>
  );
}
