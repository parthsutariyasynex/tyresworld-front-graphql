"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import TyreFinder from "@/components/TyreFinder";
import { useOverviewDrawer } from "@/lib/overview-drawer-context";

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
  const pathname = usePathname();
  const { isOpen: isOverviewOpen } = useOverviewDrawer();

  useEffect(() => {
    const heroTarget =
      document.getElementById("ptr-hero-finder-card") ||
      document.getElementById("ptr-hero-finder-section");

    const checkVisibility = () => {
      if (heroTarget) {
        const rect = heroTarget.getBoundingClientRect();
        // If bottom of hero card is above viewport top (scrolled past), show sticky bar
        if (rect.bottom < 60) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      } else {
        // Fallback for pages without hero finder card: show after slight scroll (> 60px)
        setIsVisible(window.scrollY > 60);
      }
    };

    window.addEventListener("scroll", checkVisibility, { passive: true });
    window.addEventListener("resize", checkVisibility, { passive: true });
    checkVisibility();

    let heroObserver: IntersectionObserver | null = null;
    if (heroTarget) {
      heroObserver = new IntersectionObserver(() => checkVisibility(), {
        threshold: [0, 1],
      });
      heroObserver.observe(heroTarget);
    }

    return () => {
      window.removeEventListener("scroll", checkVisibility);
      window.removeEventListener("resize", checkVisibility);
      if (heroObserver) heroObserver.disconnect();
    };
  }, [pathname]);

  const shouldShow = isVisible && !isOverviewOpen;

  return (
    <div
      className={`fixed bottom-2 sm:bottom-5 left-0 right-0 z-[45] px-2.5 sm:px-6 transition-all duration-300 ease-out ${
        shouldShow
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-8 pointer-events-none"
      }`}
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-hidden={!shouldShow}
    >
      <div className="max-w-5xl mx-auto">
        <div className="ptr-sticky-bottom-card relative rounded-2xl sm:rounded-full bg-[#181617]/95 backdrop-blur-md border border-[#ed1c24]/50 shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_25px_rgba(237,28,36,0.3)] p-1 transition-all duration-300 hover:border-[#ed1c24] hover:shadow-[0_15px_45px_rgba(0,0,0,0.8),0_0_35px_rgba(237,28,36,0.4)]">
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
