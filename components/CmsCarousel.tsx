"use client";

import { useEffect } from "react";

/**
 * Minimal behaviour for the Bootstrap-carousel markup that shows up in
 * Magento Page Builder CMS content (e.g. the testimonial slider on
 * car-tyre-service and similar service pages). The project ships no
 * Bootstrap JS, so `data-bs-*` attributes on that markup are otherwise
 * inert — indicator dots don't switch slides and nothing auto-rotates.
 *
 * This wires up exactly the two behaviors that markup expects:
 *   - clicking a `[data-bs-slide-to]` button activates the matching
 *     `.carousel-item` (by index) and its own indicator button
 *   - each `.carousel` auto-advances on its own `data-bs-interval`
 *
 * Scoped to `.cms-content` so it only ever touches CMS-authored
 * carousels, never an unrelated component that happens to reuse
 * Bootstrap's class names.
 */
export default function CmsCarousel() {
  useEffect(() => {
    const carousels = document.querySelectorAll<HTMLElement>(".cms-content .carousel");
    const cleanups: (() => void)[] = [];

    carousels.forEach((carousel) => {
      const items = Array.from(carousel.querySelectorAll<HTMLElement>(".carousel-item"));
      const indicators = Array.from(
        carousel.querySelectorAll<HTMLButtonElement>("[data-bs-slide-to]"),
      );
      if (!items.length) return;

      const activate = (index: number) => {
        items.forEach((item, i) => item.classList.toggle("active", i === index));
        indicators.forEach((btn) => {
          const target = Number(btn.getAttribute("data-bs-slide-to"));
          btn.classList.toggle("active", target === index);
        });
      };

      let current = Math.max(
        0,
        items.findIndex((item) => item.classList.contains("active")),
      );

      const clickHandlers: { btn: HTMLButtonElement; handler: () => void }[] = [];
      indicators.forEach((btn) => {
        const handler = () => {
          current = Number(btn.getAttribute("data-bs-slide-to")) || 0;
          activate(current);
        };
        btn.addEventListener("click", handler);
        clickHandlers.push({ btn, handler });
      });

      const interval = Number(carousel.getAttribute("data-bs-interval")) || 5000;
      const timer = window.setInterval(() => {
        current = (current + 1) % items.length;
        activate(current);
      }, interval);

      cleanups.push(() => {
        window.clearInterval(timer);
        clickHandlers.forEach(({ btn, handler }) => btn.removeEventListener("click", handler));
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
