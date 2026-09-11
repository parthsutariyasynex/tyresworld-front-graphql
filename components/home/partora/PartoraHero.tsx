"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import CategoryRail from "@/components/home/partora/CategoryRail";
import HomeSearchBar from "@/components/home/partora/HomeSearchBar";

/* Shapes as /api/homepage already returns them — unchanged. */
type Slide = {
  id: string;
  image?: string;
  imageMobile?: string;
  href?: string;
  alt?: string;
  heading?: string;
};

/**
 * Homepage hero, laid out the way Partora lays out theirs:
 *
 *   ┌ dark band ────────────────────────────────────────────────┐
 *   │  [ Browse All Categories ] [ search                     ] │
 *   └───────────────────────────────────────────────────────────┘
 *     [ category rail 3 ][ banner slider 9 ]
 *
 * The banner slider is fed by /api/homepage — the same request and the
 * same `banners` shape the previous hero used.
 */
export default function PartoraHero({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const swiperRef = useRef<SwiperType | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/homepage")
      .then((res) => res.json())
      .then((data) => {
        if (active) setSlides(data?.banners ?? []);
      })
      .catch((err) => console.error("Failed to load hero slides", err))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="ptr-hero pt-1 sm:pt-2">
      <div className="ptr-container">
        {/* Mobile Search Bar (Only visible on mobile screens) */}
        <div className="md:hidden mb-3">
          <HomeSearchBar locale={locale} />
        </div>

        {/* ── Hero grid ───────────────────────────────────────────── */}
        <div className="ptr-grid items-stretch">
          {/* Left — categories */}
          <div className="col-span-12 hidden lg:block lg:col-span-3 ptr-hero-col relative z-40">
            <CategoryRail locale={locale} />
          </div>

          {/* Right — single banner slider */}
          <div className="col-span-12 lg:col-span-9">
            <div className="ptr-hero-stage">
              {loading || slides.length === 0 ? (
                <div className="ptr-hero-slide ptr-skel" aria-hidden="true" />
              ) : (
                <Swiper
                  onSwiper={(s) => {
                    swiperRef.current = s;
                  }}
                  modules={[Autoplay, Pagination]}
                  slidesPerView={1}
                  spaceBetween={20}
                  loop={slides.length > 1}
                  speed={700}
                  autoplay={
                    reducedMotion
                      ? false
                      : { delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }
                  }
                  pagination={{ clickable: true }}
                  className="ptr-hero-swiper"
                >
                  {slides.map((slide, index) => {
                    const alt = (slide.alt ?? slide.heading ?? "").replace(/\n/g, " ");

                    const artwork = (
                      <div className="ptr-hero-slide">
                        <picture>
                          <source media="(min-width: 768px)" srcSet={slide.image} />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={slide.imageMobile || slide.image}
                            alt={alt}
                            loading={index === 0 ? "eager" : "lazy"}
                            fetchPriority={index === 0 ? "high" : "auto"}
                          />
                        </picture>
                      </div>
                    );

                    return (
                      <SwiperSlide key={slide.id}>
                        {slide.href ? (
                          <Link
                            href={`/${locale}${slide.href}`}
                            aria-label={alt}
                            className="block w-full h-full relative"
                          >
                            {artwork}
                          </Link>
                        ) : (
                          artwork
                        )}
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
