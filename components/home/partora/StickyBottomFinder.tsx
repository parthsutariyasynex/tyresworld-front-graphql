"use client";

import React, { useEffect, useState } from "react";
import TyreFinder from "@/components/TyreFinder";

interface StickyBottomFinderProps {
  locale: string;
  categoryUid?: string;
  basePath?: string;
  /** Force "Search Tyre Size" only, hiding "Search By Vehicle" — needed
      wherever TyreFinder's own pathname-based motorcycle detection can't
      see it (e.g. a product detail page URL has no "motorcycle" in it). */
  sizeOnly?: boolean;
}

export default function StickyBottomFinder({
  locale,
  categoryUid,
  basePath,
  sizeOnly,
}: StickyBottomFinderProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const target =
      document.getElementById("ptr-hero-finder-card") ||
      document.getElementById("ptr-hero-finder-section");

    if (!target) {
      // Fallback to scroll position on pages without a hero finder card
      // Shows as soon as header scrolls a little bit (> 30px)
      const handleScroll = () => {
        setIsVisible(window.scrollY > 30);
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
      return () => window.removeEventListener("scroll", handleScroll);
    }

    // Observer: trigger when hero card goes completely out of view (or comes back into view)
    const observer = new IntersectionObserver(
      ([entry]) => {
        // If the card is currently visible on screen, HIDE sticky bottom finder
        if (entry.isIntersecting) {
          setIsVisible(false);
        } else {
          // Only show if the user has scrolled DOWN past the card
          const isScrolledPast = entry.boundingClientRect.top < 0;
          setIsVisible(isScrolledPast);
        }
      },
      {
        root: null,
        threshold: 0, // Triggers as soon as even 1px is visible / hidden
        rootMargin: "0px",
      }
    );

    observer.observe(target);

    // Also listen to scroll to handle quick re-evaluations
    const handleScroll = () => {
      const rect = target.getBoundingClientRect();
      // If bottom of card is above viewport top (scrolled past), show sticky bar
      if (rect.bottom < 60) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      className={`fixed bottom-3 sm:bottom-5 left-0 right-0 z-[60] px-3 sm:px-6 transition-all duration-300 ease-out pointer-events-none ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      }`}
      aria-hidden={!isVisible}
    >
      <div className="max-w-5xl mx-auto pointer-events-auto">
        <div className="ptr-sticky-bottom-card relative rounded-full bg-[#181617]/95 backdrop-blur-md border border-[#ed1c24]/50 shadow-[0_12px_40px_rgba(0,0,0,0.65),0_0_25px_rgba(237,28,36,0.25)] p-1 transition-all duration-300 hover:border-[#ed1c24] hover:shadow-[0_15px_45px_rgba(0,0,0,0.7),0_0_35px_rgba(237,28,36,0.4)]">
          <TyreFinder
            locale={locale}
            disableSticky={true}
            categoryUid={categoryUid}
            basePath={basePath}
            sizeOnly={sizeOnly}
          />
        </div>
      </div>
    </div>
  );
}
