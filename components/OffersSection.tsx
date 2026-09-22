"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import type { KleverHomeOffers } from "@/lib/services/homepage.service";

const DEFAULT_OFFERS_SLIDES = [
  {
    id: "buy-3-get-1",
    title: "Buy 3 Tyres Get 1 Free on Continental",
    image: "/offers/buy-3-get-1-free-continental.webp",
    href: "/tyres/brand/continental?offers=Buy+3+Get+1+Free",
  },
  {
    id: "2026-tyres",
    title: "Latest 2026 Fresh Dot Tyres in UAE",
    image: "/offers/2026-tyres-online-uae_1.webp",
    href: "/tyres?year=2026",
  },
];

export default function OffersSection() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "en";
  const reducedMotion = usePrefersReducedMotion();

  const [offersData, setOffersData] = useState<KleverHomeOffers | null>(null);

  /* Real promo banners/heading from Magento's kleverHomepage (Klever
     module) — English-only at the source, so both locales render this
     same content. */
  useEffect(() => {
    let active = true;
    fetch(`/api/homepage?locale=${locale}`)
      .then((res) => res.json())
      .then((data) => { if (active) setOffersData(data?.offers ?? null); })
      .catch(() => { /* use defaults */ });
    return () => { active = false; };
  }, [locale]);

  const dynamicSlides = (offersData?.banners ?? []).map((b, i) => {
    // Strip origin if absolute URL to keep SPA navigation
    let href = b.url ?? "/tyres";
    try {
      if (href.startsWith("http://") || href.startsWith("https://")) {
        const u = new URL(href);
        href = u.pathname + u.search + u.hash;
      }
    } catch {
      // ignore
    }
    // Ensure locale prefix if not present
    if (!href.startsWith(`/${locale}`)) {
      href = `/${locale}${href.startsWith("/") ? "" : "/"}${href}`;
    }
    return {
      id: `offer-banner-${i}`,
      title: b.title ?? "Exclusive Offer",
      image: b.image ?? "",
      href,
    };
  }).filter((s) => Boolean(s.image));

  const slides = dynamicSlides.length > 0
    ? dynamicSlides
    : DEFAULT_OFFERS_SLIDES.map((s) => ({
        ...s,
        href: s.href.startsWith(`/${locale}`) ? s.href : `/${locale}${s.href}`,
      }));

  return (
    <section className="bg-white pt-6 sm:pt-8 pb-10 sm:pb-12">
      <div className="ptr-container">
        {/* ── Section Header ── */}
        <div className="mb-8">
          <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#ed1c24] mb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ed1c24]" />
            FLASH SALE
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-black tracking-tight text-gray-950 font-sans uppercase">
            LIMITED TIME <span className="text-[#ed1c24]">OFFERS</span>
          </h2>
        </div>

        {/* ── 3-Column Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* ── Card 1: Flash Sale Card with Full-Fit Image Slider ── */}
          <div className="bg-white rounded-2xl border-2 border-gray-200/90 hover:border-[#ed1c24]/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 p-5 sm:p-6 flex flex-col justify-between">
            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ed1c24]/10 text-[#ed1c24] text-xs font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ed1c24] animate-ping" />
                  Exclusive Promotions
                </span>
                <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                  Special Discounts
                </span>
              </div>

              {/* Slider for Project Offer Banners - Uncropped and clean spacing */}
              <div className="relative">
                <Swiper
                  modules={[Autoplay, Pagination]}
                  slidesPerView={1}
                  loop={slides.length > 1}
                  speed={600}
                  autoplay={
                    reducedMotion
                      ? false
                      : { delay: 3800, disableOnInteraction: false, pauseOnMouseEnter: true }
                  }
                  pagination={{
                    clickable: true,
                    bulletClass: "swiper-custom-bullet",
                    bulletActiveClass: "swiper-custom-bullet-active",
                  }}
                  className="flash-sale-swiper !pb-8"
                >
                  {slides.map((slide) => (
                    <SwiperSlide key={slide.id}>
                      <Link href={slide.href} className="block group/item">
                        {/* Aspect-ratio container with full image fit */}
                        <div className="relative w-full aspect-[559/380] rounded-xl overflow-hidden bg-[#fafafa] border border-gray-100 shadow-sm flex items-center justify-center p-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={slide.image}
                            alt={slide.title}
                            className="w-full h-full object-contain object-center group-hover/item:scale-[1.02] transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>

                        {/* Title positioned with clean bottom margin so bullets don't overlap */}
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 text-center mt-3.5 mb-2 group-hover/item:text-[#ed1c24] transition-colors leading-snug px-1 line-clamp-1">
                          {slide.title}
                        </h3>
                      </Link>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
          </div>

          {/* ── Card 2: Professional Car Care Services Banner ── */}
          <div className="relative min-h-[380px] lg:min-h-[440px] rounded-2xl overflow-hidden bg-zinc-950 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-xl transition-all duration-300 flex flex-col justify-end p-6 sm:p-8 group">
            {/* Background Image from project offers */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/offers/tyresworld/professional-car-service-abu-dhabi.webp"
              alt="Professional Car Service"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-45 group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />

            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/25" />

            {/* Content */}
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                Professional Car Service
              </h3>

              <p className="text-xs sm:text-[13.5px] text-white/80 mt-2.5 leading-relaxed max-w-sm drop-shadow">
                Get expert car maintenance, diagnostics, and oil change services in Abu Dhabi and across the UAE.
              </p>

              <div className="mt-6">
                <Link
                  href={`/${locale}/car-service`}
                  className="btn-cta text-xs sm:text-sm px-6 py-2.5 rounded-lg shadow-md group-hover:scale-105 duration-300"
                >
                  <span>Learn More</span>
                </Link>
              </div>
            </div>
          </div>

          {/* ── Card 3: Free Wheel Alignment & Tyres Offer Banner ── */}
          <div className="relative min-h-[380px] lg:min-h-[440px] rounded-2xl overflow-hidden bg-zinc-950 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-xl transition-all duration-300 flex flex-col justify-end p-6 sm:p-8 group">
            {/* Background Image from project offers */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/offers/free-wheel-alignment-offer-on-tyres-uae_1.webp"
              alt="Free Wheel Alignment Offer"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-45 group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />

            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/25" />

            {/* Content */}
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                Free Wheel Alignment
              </h3>

              <p className="text-xs sm:text-[13.5px] text-white/80 mt-2.5 leading-relaxed max-w-sm drop-shadow">
                Enjoy free 3D computerized laser wheel alignment and expert fitment when you order your tyres online.
              </p>

              <div className="mt-6">
                <Link
                  href={`/${locale}/tyres?offers=Free+Wheel+Alignment`}
                  className="btn-cta text-xs sm:text-sm px-6 py-2.5 rounded-lg shadow-md group-hover:scale-105 duration-300"
                >
                  <span>Learn More</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
