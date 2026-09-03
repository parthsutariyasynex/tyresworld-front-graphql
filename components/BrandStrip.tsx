"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * "Shop by Tyre Brands".
 *
 * Everything is served by /api/brands: names and filter values come from the
 * catalogue's `mgs_brand` aggregation, and logos are resolved there from
 * public/brands/mgs_brand. Nothing about a brand is hardcoded in this file,
 * and a brand the endpoint can't supply a logo for simply isn't returned.
 *
 * If the endpoint returns nothing, the section shows its empty state rather
 * than any placeholder artwork.
 */

/**
 * The homepage shows a preview only — 20 fills the 5-column grid exactly
 * four rows deep. "All Brands" leads to the full list.
 */
const PREVIEW_COUNT = 20;

/** One entry as /api/brands returns it. */
type Brand = {
  name: string;
  filterValue: string;
  logo: string;
  /** Products carrying this brand — decides which brands make the preview. */
  count: number;
};

function toBrand(entry: Partial<Brand> | null | undefined): Brand | null {
  const name = entry?.name?.trim();
  const filterValue = entry?.filterValue;
  const logo = entry?.logo;

  if (!name || !filterValue || !logo) return null;
  return { name, filterValue, logo, count: entry?.count ?? 0 };
}

export default function BrandStrip() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "ar" ? "ar" : "en";
  const isAr = locale === "ar";

  const [brands, setBrands] = useState<Brand[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/brands")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const list: Brand[] = (data?.brands ?? [])
          .map(toBrand)
          .filter((b: Brand | null): b is Brand => b !== null);

        // Most-stocked brands first, then trim to the preview. Which brands
        // appear is decided by the catalogue, not by a list kept here.
        setBrands(
          [...list].sort((a, b) => b.count - a.count).slice(0, PREVIEW_COUNT),
        );
      })
      .catch((err) => {
        console.error("Failed to load brands", err);
        if (active) setBrands(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const hasBrands = !!brands && brands.length > 0;

  return (
    <section className="section section-padding brands">
      <div className="container">

        {/* ── Section title ───────────────────────────────────── */}
        <div className="section-heading">
          <h2 className="!font-sans !font-black !text-2xl sm:!text-3xl lg:!text-[34px] !tracking-wide !leading-tight">
            {isAr ? "تسوق حسب " : "Shop by "}
            <span className="theme_color">
              {isAr ? "ماركات الإطارات" : "Tyre Brands"}
            </span>
          </h2>
          <p>
            {isAr
              ? "تصفّح مجموعة واسعة من ماركات إطارات السيارات واشترِ الإطارات عبر الإنترنت بأفضل الأسعار. شركاء التركيب لدينا في جميع أنحاء الإمارات جاهزون لتقديم خدمة استثنائية لك."
              : "Browse a wide selection of car tyre brands and purchase tyres online at the best prices. Our customer friendly fitment partners across the UAE are ready to provide you with exceptional service."}
          </p>
        </div>

        {/* ── Brand grid — 2 / 3 / 4 / 5 columns ────────────────
             Nesting mirrors the theme: .box > a > .image-wrap > img */}
        {loading ? (
          <div className="brands-list animate-pulse">
            <ul className="brand-grid">
              {Array.from({ length: 15 }, (_, i) => (
                <li key={i}>
                  <div className="box h-[90px] bg-gray-100/80 rounded-lg flex items-center justify-center p-4">
                    <div className="w-20 h-7 bg-gray-200/80 rounded" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : hasBrands ? (
          <div className="brands-list">
            <ul className="brand-grid">
              {brands!.map((brand) => {
                const brandSlug = brand.name.toLowerCase().replace(/[^a-z0-9]+/g, "").replace(/(^-|-$)/g, "");
                return (
                  <li key={brand.filterValue}>
                    <div className="box hover-transition">
                      <Link
                        href={`/${locale}/tyres/brand/${brandSlug || encodeURIComponent(brand.filterValue)}`}
                        className="brand-link"
                        aria-label={isAr ? `إطارات ${brand.name}` : `${brand.name} tyres`}
                      >
                        <div className="image-wrap no-position">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="brands-empty" role="status" aria-live="polite">
            {isAr ? "لا تتوفر ماركات للعرض حالياً." : "No brands available to display right now."}
          </p>
        )}

        {/* ── CTA ─────────────────────────────────────────────── */}
        <div className="section-cta">
          <Link href={`/${locale}/brands`} className="button-primary">
            <span>{isAr ? "جميع الماركات" : "All Brands"}</span>
          </Link>
        </div>

      </div>
    </section>
  );
}
