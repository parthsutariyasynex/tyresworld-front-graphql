"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { ArrowRight, ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import type { KleverHomeOffers } from "@/lib/services/homepage.service";
import { isBrokenCmsHtml } from "@/lib/services/homepage.service";

interface OffersSectionProps {
  locale?: string;
  initialOffers?: KleverHomeOffers | null;
}

export default function OffersSection({
  locale: propLocale,
  initialOffers,
}: OffersSectionProps) {
  const pathname = usePathname();
  const locale = propLocale || pathname?.split("/")[1] || "en";
  const reducedMotion = usePrefersReducedMotion();
  const swiperRef = useRef<SwiperType | null>(null);

  const [offersData, setOffersData] = useState<KleverHomeOffers | null>(
    () => initialOffers ?? null,
  );

  useEffect(() => {
    if (initialOffers) return;
    let active = true;

    fetch(`/api/homepage?locale=${locale}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data?.offers) setOffersData(data.offers);
      })
      .catch((err) => console.error("Failed to load offers", err));

    return () => {
      active = false;
    };
  }, [locale, initialOffers]);

  const banners = offersData?.banners ?? [];

  const slides = banners.map((b, i) => {
    let href = b.url ?? "/tyres";
    try {
      if (href.startsWith("http://") || href.startsWith("https://")) {
        const u = new URL(href);
        href = u.pathname + u.search + u.hash;
      }
    } catch {
      // ignore
    }
    if (!href.startsWith(`/${locale}`) && !href.startsWith("http")) {
      href = `/${locale}${href.startsWith("/") ? "" : "/"}${href}`;
    }
    return {
      id: `offer-banner-${i}`,
      title: b.title ?? "Exclusive Offer",
      image: b.image || "",
      mobileImage: b.mobile_image || b.image || "",
      href,
    };
  }).filter((s) => Boolean(s.image));

  // The section heading is now an admin-authored CMS HTML block
  // (offers.heading.{enabled,html}), not separate title/subtitle strings.
  const headingHtml =
    offersData?.heading?.enabled && offersData.heading.html && !isBrokenCmsHtml(offersData.heading.html)
      ? offersData.heading.html
      : null;

  if (slides.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#fafafa] py-10 sm:py-14 border-t border-b border-gray-100">
      <div className="ptr-container">
        {/* ── Section Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#ed1c24] mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ed1c24] animate-pulse" />
              <Tag size={13} className="text-[#ed1c24]" />
              SPECIAL PROMOTIONS
            </div>

            {headingHtml ? (
              <div
                className="cms-content offers-heading"
                dangerouslySetInnerHTML={{ __html: headingHtml }}
              />
            ) : (
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-tight text-gray-950 font-sans uppercase leading-tight">
                <span className="text-[#ed1c24]">Exclusive Offers</span>
              </h2>
            )}
          </div>

          {/* Slider Navigation Controls */}
          {slides.length > 3 && (
            <div className="hidden sm:flex items-center gap-2 self-end">
              <button
                type="button"
                onClick={() => swiperRef.current?.slidePrev()}
                aria-label="Previous offers"
                className="w-9 h-9 rounded-full bg-white border border-gray-200 text-gray-800 hover:bg-[#ed1c24] hover:text-white hover:border-[#ed1c24] transition-all flex items-center justify-center shadow-2xs cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => swiperRef.current?.slideNext()}
                aria-label="Next offers"
                className="w-9 h-9 rounded-full bg-white border border-gray-200 text-gray-800 hover:bg-[#ed1c24] hover:text-white hover:border-[#ed1c24] transition-all flex items-center justify-center shadow-2xs cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* ── Dynamic Offers Carousel ── */}
        <div className="relative">
          <Swiper
            onSwiper={(s) => {
              swiperRef.current = s;
            }}
            modules={[Autoplay, Pagination, Navigation]}
            slidesPerView={1}
            spaceBetween={18}
            loop={slides.length > 3}
            speed={600}
            autoplay={
              reducedMotion
                ? false
                : { delay: 4200, disableOnInteraction: false, pauseOnMouseEnter: true }
            }
            pagination={{
              clickable: true,
              bulletClass: "swiper-custom-bullet",
              bulletActiveClass: "swiper-custom-bullet-active",
            }}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 24 },
            }}
            className="offers-carousel !pb-10"
          >
            {slides.map((slide) => (
              <SwiperSlide key={slide.id}>
                <Link
                  href={slide.href}
                  className="bg-white rounded-2xl border-2 border-gray-200/90 hover:border-[#ed1c24] shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 p-4 sm:p-5 flex flex-col justify-between group h-full block"
                >
                  {/* Banner Image Container */}
                  <div className="relative w-full aspect-[559/380] rounded-xl overflow-hidden bg-[#fafafa] border border-gray-100 flex items-center justify-center p-2">
                    <picture>
                      <source media="(max-width: 640px)" srcSet={slide.mobileImage} />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </picture>
                  </div>

                  {/* Title & CTA Button */}
                  <div className="mt-4 flex flex-col items-center text-center">
                    <h3 className="text-sm sm:text-[15px] font-bold text-gray-900 group-hover:text-[#ed1c24] transition-colors leading-snug line-clamp-2 min-h-[42px] flex items-center">
                      {slide.title}
                    </h3>

                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#ed1c24] group-hover:translate-x-0.5 transition-transform">
                      <span>View Offer</span>
                      <ArrowRight size={13} />
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
