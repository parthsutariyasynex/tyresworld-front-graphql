"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildBrandSlug } from "@/lib/filterBuilder";
import type { KleverHomeSection } from "@/lib/services/homepage.service";
import { isBrokenCmsHtml } from "@/lib/services/homepage.service";

const PREVIEW_COUNT = 20;

interface BrandStripProps {
  /** kleverHomepage.brands — an admin-authored CMS HTML intro block, shown
      above the (separately-fetched, already real) /api/brands grid. */
  initialBrandsSection?: KleverHomeSection | null;
}

/** One entry as /api/brands returns it. */
type Brand = {
  name: string;
  filterValue: string;
  logo: string;
  category: string;
  isFeatured: boolean;
  sortOrder: number;
  urlKey?: string;
};

function toBrand(entry: Partial<Brand> | null | undefined): Brand | null {
  const name = entry?.name?.trim();
  const filterValue = entry?.filterValue;
  const logo = entry?.logo;

  if (!name || !filterValue || !logo) return null;
  return {
    name,
    filterValue,
    logo,
    category: entry?.category ?? "Other",
    isFeatured: entry?.isFeatured ?? false,
    sortOrder: entry?.sortOrder ?? 0,
    urlKey: entry?.urlKey,
  };
}

export default function BrandStrip({ initialBrandsSection }: BrandStripProps) {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "en";

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
          .filter((b: Brand | null): b is Brand => b !== null)
          // This strip is specifically "Shop by TYRE Brands" — the same
          // endpoint now also returns Battery/Wheels/Motorcycle categories.
          .filter((b: Brand) => b.category === "Tyres");

        // Admin-configured featured flag + sort order (real Magento data)
        // instead of the old "most products in stock" heuristic.
        setBrands(
          [...list]
            .sort((a, b) => {
              if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
              return a.sortOrder - b.sortOrder;
            })
            .slice(0, PREVIEW_COUNT),
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
    <section className="section section-padding brands py-14 bg-white">
      <div className="container custom-width max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Section title — admin-authored CMS block when available,
             matching the real kleverHomepage.brands section (this strip's
             own brand grid below is separate, real /api/brands data
             regardless) ───────────────────────────────────────────── */}
        {initialBrandsSection?.enabled && initialBrandsSection.html && !isBrokenCmsHtml(initialBrandsSection.html) ? (
          <div
            className="cms-content brand-strip-heading mb-10 text-center max-w-3xl mx-auto"
            dangerouslySetInnerHTML={{ __html: initialBrandsSection.html }}
          />
        ) : (
          <div className="section-title mb-10 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-black uppercase tracking-wide text-black mb-3 leading-tight">
              {"Shop by "}{" "}
              <span className="text-[#ed1c24] theme_color">
                {"Tyre Brands"}
              </span>
            </h2>
            <p className="text-gray-700 text-xs sm:text-[13.5px] leading-relaxed font-normal max-w-2xl mx-auto m-0 tracking-normal">
              {"Browse a wide selection of car tyre brands and purchase tyres online at the best prices. Our customer friendly fitment partners across the UAE are ready to provide you with exceptional service."}
            </p>
          </div>
        )}

        {/* ── Brand grid — 2 / 3 / 4 / 5 columns ──────────────── */}
        {loading ? (
          <div className="brands-list animate-pulse">
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 list-none p-0 m-0">
              {Array.from({ length: 15 }, (_, i) => (
                <li key={i}>
                  <div className="box h-[76px] bg-[#f5f5f5] rounded-xl flex items-center justify-center p-2.5">
                    <div className="w-20 h-6 bg-gray-200/80 rounded" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : hasBrands ? (
          <div className="brands-list">
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 list-none p-0 m-0">
              {brands!.map((brand) => {
                const slug = buildBrandSlug({ name: brand.name, url_key: brand.urlKey });
                const brandHref = `/tyres/brand/${slug}`;
                return (
                  <li key={brand.filterValue}>
                    <div className="box h-[76px] bg-white rounded-xl border border-gray-200/80 hover:border-[#ed1c24] hover:shadow-md flex items-center justify-center p-2.5 transition-all duration-300 group">
                      <Link
                        href={brandHref}
                        className="brand-link w-full h-full flex items-center justify-center"
                        aria-label={`${brand.name} tyres`}
                      >
                        <div className="image-wrap w-full h-full flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="max-h-[36px] max-w-[80%] object-contain transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
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
          <p className="text-center text-gray-500 py-6" role="status" aria-live="polite">
            No brands available to display right now.
          </p>
        )}

        {/* ── CTA ─────────────────────────────────────────────── */}
        <div className="section-cta text-center mt-10">
          <Link
            href={`/${locale}/brands`}
            className="button-primary inline-flex items-center justify-center px-8 py-3 rounded-lg bg-[#ed1c24] text-white text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-[#c6181d] transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>All Brands</span>
          </Link>
        </div>

      </div>
    </section>
  );
}
