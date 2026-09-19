"use client";

import { useEffect } from "react";

/**
 * Robust FAQ / Accordion behaviour for Bootstrap 4 & 5 CMS markup.
 * Handles [data-bs-toggle="collapse"], [data-toggle="collapse"], and .accordion-button.
 * Overrides Tailwind CSS's default `.collapse { visibility: collapse; }` conflict.
 */
export default function CmsAccordion() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const targetEl = e.target as HTMLElement | null;
      if (!targetEl) return;

      const btn = targetEl.closest<HTMLElement>(
        '.cms-content [data-bs-toggle="collapse"], .cms-content [data-toggle="collapse"], .cms-content .accordion-button'
      );
      if (!btn) return;

      e.preventDefault();

      const targetSelector =
        btn.getAttribute("data-bs-target") ||
        btn.getAttribute("data-target") ||
        btn.getAttribute("href");
      if (!targetSelector) return;

      const target = document.querySelector<HTMLElement>(targetSelector);
      if (!target) return;

      const isAlreadyOpen = target.classList.contains("show") || target.classList.contains("in");
      const opening = !isAlreadyOpen;

      const parentSelector =
        target.getAttribute("data-bs-parent") || target.getAttribute("data-parent");
      if (opening && parentSelector) {
        const parent = document.querySelector(parentSelector);
        if (parent) {
          parent.querySelectorAll<HTMLElement>(".accordion-collapse.show, .collapse.show, .collapse.in").forEach((sibling) => {
            if (sibling === target) return;
            sibling.classList.remove("show", "in");
            sibling.style.display = "none";
            sibling.style.visibility = "hidden";
            const siblingId = sibling.id;
            if (siblingId) {
              const siblingBtn = parent.querySelector<HTMLElement>(
                `[data-bs-target="#${siblingId}"], [data-target="#${siblingId}"], [href="#${siblingId}"]`
              );
              siblingBtn?.classList.add("collapsed");
              siblingBtn?.setAttribute("aria-expanded", "false");
            }
          });
        }
      }

      if (opening) {
        target.classList.add("show", "in");
        target.style.display = "block";
        target.style.visibility = "visible";
        btn.classList.remove("collapsed");
        btn.setAttribute("aria-expanded", "true");
      } else {
        target.classList.remove("show", "in");
        target.style.display = "none";
        target.style.visibility = "hidden";
        btn.classList.add("collapsed");
        btn.setAttribute("aria-expanded", "false");
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
