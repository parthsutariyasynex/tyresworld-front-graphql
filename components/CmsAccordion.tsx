"use client";

import { useEffect } from "react";

/**
 * Minimal behaviour for the Bootstrap-accordion markup that shows up in
 * Magento Page Builder CMS content (e.g. the FAQ section on car-insurance
 * and similar service pages). The project ships no Bootstrap JS, so
 * `data-bs-toggle="collapse"` buttons are otherwise inert — clicking a
 * question never reveals its answer.
 *
 * This wires up exactly what that markup expects: clicking a
 * `[data-bs-toggle="collapse"]` button toggles `.show` on its
 * `data-bs-target` and `.collapsed` + `aria-expanded` on the button
 * itself; if the target sits under a `data-bs-parent`, every open sibling
 * in that group closes first (standard Bootstrap "accordion" behaviour).
 *
 * Scoped to `.cms-content` so it only ever touches CMS-authored
 * accordions, never an unrelated component that happens to reuse
 * Bootstrap's class names.
 */
export default function CmsAccordion() {
  useEffect(() => {
    const buttons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('.cms-content [data-bs-toggle="collapse"]'),
    );

    const handlers: { btn: HTMLButtonElement; handler: () => void }[] = [];

    buttons.forEach((btn) => {
      const targetSelector = btn.getAttribute("data-bs-target") || btn.getAttribute("href");
      if (!targetSelector) return;
      const target = document.querySelector<HTMLElement>(targetSelector);
      if (!target) return;

      const handler = () => {
        const opening = !target.classList.contains("show");

        const parentSelector = target.getAttribute("data-bs-parent");
        if (opening && parentSelector) {
          const parent = document.querySelector(parentSelector);
          if (parent) {
            parent.querySelectorAll(".accordion-collapse.show").forEach((sibling) => {
              if (sibling === target) return;
              sibling.classList.remove("show");
              const siblingBtn = parent.querySelector<HTMLButtonElement>(
                `[data-bs-target="#${sibling.id}"]`,
              );
              siblingBtn?.classList.add("collapsed");
              siblingBtn?.setAttribute("aria-expanded", "false");
            });
          }
        }

        target.classList.toggle("show", opening);
        btn.classList.toggle("collapsed", !opening);
        btn.setAttribute("aria-expanded", String(opening));
      };

      btn.addEventListener("click", handler);
      handlers.push({ btn, handler });
    });

    return () => handlers.forEach(({ btn, handler }) => btn.removeEventListener("click", handler));
  }, []);

  return null;
}
