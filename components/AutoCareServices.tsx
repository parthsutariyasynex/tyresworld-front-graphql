"use client";

import { useEffect, useState } from "react";
import type { KleverHomeSection } from "@/lib/services/homepage.service";
import { isBrokenCmsHtml } from "@/lib/services/homepage.service";

interface AutoCareServicesProps {
  locale?: string;
  initialServices?: KleverHomeSection | null;
}

interface ServiceCard {
  title: string;
  description: string;
  href: string;
  imgSrc: string;
  imgAlt: string;
}

function fixImageUrl(src: string): string {
  return src.replace(
    /https:\/\/www1\.tyresworld\.ae\/static\/version(\d+)\/graphql\/_view\/en_US\/images\/([a-z0-9-]+\.png)/gi,
    "https://www1.tyresworld.ae/static/version$1/frontend/Klever/automotive/en_US/images/$2",
  );
}

function toRelativeHref(href: string): string {
  try {
    const url = new URL(href);
    if (url.hostname.includes("tyresworld.ae")) {
      return url.pathname + url.search;
    }
  } catch { /* already relative */ }
  return href;
}

function parseServiceCards(html: string): ServiceCard[] {
  if (typeof window === "undefined") return [];
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const boxes = doc.querySelectorAll(".finder-box");
    const cards: ServiceCard[] = [];
    boxes.forEach((box) => {
      const imgEl = box.querySelector(".box-image img");
      const titleLinkEl = box.querySelector(".text-wrap h3 a");
      const descEl = box.querySelector(".text-wrap p");
      const hrefEl = box.querySelector(".box-image a");
      if (!imgEl || !titleLinkEl) return;
      cards.push({
        title: titleLinkEl.textContent?.trim() ?? "",
        description: descEl?.textContent?.trim() ?? "",
        href: toRelativeHref((hrefEl as HTMLAnchorElement)?.href ?? (titleLinkEl as HTMLAnchorElement).href ?? "#"),
        imgSrc: fixImageUrl((imgEl as HTMLImageElement).src),
        imgAlt: (imgEl as HTMLImageElement).alt ?? "",
      });
    });
    return cards;
  } catch {
    return [];
  }
}

function parseSectionTitle(html: string): { heading: string; subheading: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const h2 = doc.querySelector(".section-title h2");
    const p = doc.querySelector(".section-title p");
    if (!h2) return null;
    return {
      heading: h2.innerHTML.trim(),
      subheading: p?.textContent?.trim() ?? "",
    };
  } catch {
    return null;
  }
}

const ICON_PATHS: Record<string, string> = {
  "car tyres":      "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 4a6 6 0 1 1 0 12A6 6 0 0 1 12 6zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  "car insurance":  "M12 1L3 5v6c0 5.25 3.75 10.15 9 11.35C17.25 21.15 21 16.25 21 11V5l-9-4zm0 4l6 2.67V11c0 3.5-2.33 6.79-6 7.93C8.33 17.79 6 14.5 6 11V7.67L12 5z",
  "rims/wheels":    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z",
  "battery":        "M7 7h10v10H7zm3-4h4v3h-4zM6 20h12v1H6z",
  "car service":    "M22.5 10H20V8.5C20 7.12 18.88 6 17.5 6H15V4H9v2H6.5C5.12 6 4 7.12 4 8.5V10H1.5L0 13h3.5v6.5c0 .83.67 1.5 1.5 1.5H6c.83 0 1.5-.67 1.5-1.5V19h9v.5c0 .83.67 1.5 1.5 1.5h1c.83 0 1.5-.67 1.5-1.5V13H24l-1.5-3zM7.5 15.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm9 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM6 10V8.5c0-.28.22-.5.5-.5h11c.28 0 .5.22.5.5V10H6z",
  "motorbike tyres":"M5.5 5C3.57 5 2 6.57 2 8.5S3.57 12 5.5 12 9 10.43 9 8.5 7.43 5 5.5 5zm0 5C4.67 10 4 9.33 4 8.5S4.67 7 5.5 7 7 7.67 7 8.5 6.33 10 5.5 10zm13-5C16.57 5 15 6.57 15 8.5S16.57 12 18.5 12 22 10.43 22 8.5 20.43 5 18.5 5zm0 5c-.83 0-1.5-.67-1.5-1.5S17.67 7 18.5 7 20 7.67 20 8.5 19.33 10 18.5 10zm-11-3H13l2 4H9l-1.5-4z",
};

function getIcon(title: string): string {
  const key = title.toLowerCase();
  for (const [k, v] of Object.entries(ICON_PATHS)) {
    if (key.includes(k.split(" ")[1] ?? k) || key === k) return v;
  }
  return "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z";
}

export default function AutoCareServices({ locale = "en", initialServices }: AutoCareServicesProps) {
  const [data, setData] = useState<KleverHomeSection | null>(() => initialServices ?? null);
  // Cards and title are parsed client-side only (DOMParser is browser-only).
  // Start as empty/null so SSR and initial client render match → no hydration error.
  const [cards, setCards] = useState<ServiceCard[]>([]);
  const [sectionTitle, setSectionTitle] = useState<{ heading: string; subheading: string } | null>(null);

  useEffect(() => {
    if (initialServices) return;
    let active = true;
    fetch(`/api/homepage?locale=${locale}`)
      .then((res) => res.json())
      .then((d) => { if (active) setData(d?.services ?? null); })
      .catch(() => {});
    return () => { active = false; };
  }, [locale, initialServices]);

  // Parse CMS HTML after mount — runs only in browser, after hydration.
  useEffect(() => {
    if (!data?.html) return;
    setCards(parseServiceCards(data.html));
    setSectionTitle(parseSectionTitle(data.html));
  }, [data?.html]);

  if (!data?.enabled || !data.html || isBrokenCmsHtml(data.html)) return null;

  return (
    <section className="acs-section">

      {/* Ambient glow blobs */}
      <div className="acs-glow acs-glow-left" aria-hidden="true" />
      <div className="acs-glow acs-glow-right" aria-hidden="true" />

      <div className="acs-container">

        {/* ── Heading ── */}
        <div className="acs-heading">
          <span className="acs-eyebrow">Our Services</span>
          {sectionTitle ? (
            <>
              <h2
                className="acs-title"
                dangerouslySetInnerHTML={{ __html: sectionTitle.heading }}
              />
              {sectionTitle.subheading && (
                <p className="acs-subtitle">{sectionTitle.subheading}</p>
              )}
            </>
          ) : (
            <h2 className="acs-title">
              All-in-one <span>Auto Care Solutions</span>
            </h2>
          )}
        </div>

        {/* ── Cards grid ── */}
        {cards.length > 0 && (
          <div className="acs-grid">
            {cards.map((card, idx) => (
              <a key={idx} href={card.href} className="acs-card" aria-label={card.title}>

                {/* Number badge */}
                <span className="acs-num">
                  {String(idx + 1).padStart(2, "0")}
                </span>

                {/* Background photo */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.imgSrc}
                  alt={card.imgAlt}
                  className="acs-card-bg"
                  loading="lazy"
                  decoding="async"
                />

                {/* Overlays */}
                <div className="acs-card-vignette" />
                <div className="acs-card-gradient" />

                {/* Bottom content */}
                <div className="acs-card-body">
                  <div className="acs-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={getIcon(card.title)} />
                    </svg>
                  </div>
                  <h3 className="acs-card-title">{card.title}</h3>
                  <p className="acs-card-desc">{card.description}</p>
                  <span className="acs-card-cta">
                    Explore
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>

                {/* Red hover border */}
                <div className="acs-card-border" />
              </a>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
