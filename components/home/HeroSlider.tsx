"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";


/**
 * A hero slide is artwork + a link — all the messaging is baked into the
 * image, as it is in the Magento theme. The text fields are optional
 * leftovers from the old overlay treatment and are no longer rendered.
 */
type Slide = {
  id: string;
  /** Desktop artwork (≥768px). */
  image?: string;
  /** Art-directed crop for <768px; falls back to `image`. */
  imageMobile?: string;
  /** Click target for the whole slide, locale prefix added at render. */
  href?: string;
  /** Accessible description of the artwork. */
  alt?: string;
  gradient?: string;
  heading?: string;
};

export default function HeroSlider() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] === "ar" ? "ar" : "en";
  const swiperRef = useRef<SwiperType | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  // The loader stays up past the API response until the first banner image
  // has actually painted (its onLoad/onError), so there's no blank gap
  // between the API completing and the image appearing.
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/homepage")
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          setSlides(data.banners ?? []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load hero slides", err);
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  // If the first slide has no image (gradient fallback), there's nothing to
  // wait for — mark ready so the loader doesn't stay up forever.
  useEffect(() => {
    if (!loading && slides.length > 0 && !slides[0].image) setImageReady(true);
  }, [loading, slides]);

  // Same section loader as the Tyre Finder. Reused for both phases (API
  // fetch, then first-image load) so it stays visible continuously.
  const loaderOverlay = (
    <div
      className="section-loader searchloader"
      style={{ display: "flex" }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="inner d-flex align-items-center justify-content-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="spinner mx-auto"
          src="/images/loader-style1.svg"
          alt=""
          aria-hidden="true"
          width={50}
          height={50}
        />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );

  // API phase — banners not fetched yet. Keep the hero box sized via
  // .banner-aspect so there's no layout shift when the slider mounts.
  if (loading) {
    return (
      <section className="hero-section">
        <div className="banner-aspect">{loaderOverlay}</div>
      </section>
    );
  }
  if (slides.length === 0) return null;

  return (
    <section className="hero-section">
      {/*
       * .banner-aspect gives the container its height from an aspect-ratio
       * rather than vh units, so there's no CLS. It tracks the artwork:
       * 1920/605 above 768px, 425/450 below (the portrait mobile crops).
       *
       * Layout chain (each layer fills its parent):
       *   .banner-aspect  →  .hero-swiper (CSS: absolute, inset:0, h:100%)
       *   .hero-swiper    →  .swiper-slide (CSS: h:100%)
       *   .swiper-slide   →  .slide-img-wrap (relative, w-full, h-full)
       *   .slide-img-wrap →  <picture> (absolute inset-0, object-cover)
       */}
      <div className="banner-aspect">

        {/* Swiper — CSS class controls all sizing (see globals.css .hero-swiper rules) */}
        <Swiper
          onSwiper={(s) => { swiperRef.current = s; }}
          modules={[Autoplay, Pagination, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          /* pauseOnMouseEnter is off on purpose — the hero sits under the
             cursor whenever someone lands on the page, so pausing there
             stops the banner from ever advancing. Reduced-motion users
             get no autoplay at all instead. */
          autoplay={
            reducedMotion
              ? false
              : {
                  delay: 4500,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: false,
                  stopOnLastSlide: false,
                  waitForTransition: true,
                }
          }
          speed={800}
          pagination={{ clickable: true, el: ".hero-pagination" }}
          loop={slides.length > 1}
          className="hero-swiper"
        >
          {slides.map((slide, index) => {
            const alt = (slide.alt ?? slide.heading ?? "").replace(/\n/g, " ");

            /*
             * <picture> rather than next/image: these slides are art-directed
             * (a different crop below 768px, not just a smaller one), which
             * next/image can't express — rendering both and hiding one would
             * download both. The .banner-aspect ratio already prevents CLS,
             * and the first slide is eager + high-priority for LCP.
             */
            const artwork = slide.image ? (
              <picture>
                <source media="(min-width: 768px)" srcSet={slide.image} />
                <img
                  src={slide.imageMobile || slide.image}
                  alt={alt}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  decoding={index === 0 ? "sync" : "async"}
                  {...(index === 0
                    ? {
                        onLoad: () => setImageReady(true),
                        onError: () => setImageReady(true),
                      }
                    : {})}
                />
              </picture>
            ) : (
              /* Fallback gradient when no image URL is provided */
              <div
                className={`absolute inset-0 bg-gradient-to-br ${
                  slide.gradient || "from-gray-900 to-gray-700"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              </div>
            );

            return (
              <SwiperSlide key={slide.id}>
                {/* .slide-img-wrap is the positioning context for the artwork. */}
                <div className="slide-img-wrap relative w-full h-full">
                  {slide.href ? (
                    <Link
                      href={`/${locale}${slide.href}`}
                      className="block absolute inset-0"
                      aria-label={alt}
                    >
                      {artwork}
                    </Link>
                  ) : (
                    artwork
                  )}
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Pagination dots — centered and clickable, above the slide link */}
        <div className="hero-pagination" />

        {/* Prev / Next arrows */}
        <div className="absolute bottom-6 right-6 lg:right-10 z-10 flex gap-2">
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => swiperRef.current?.slideNext()}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Keep the loader on top of the mounted slider until the first
            banner image has painted (onLoad/onError) — prevents the
            white/blank gap between the API response and the image. */}
        {!imageReady && loaderOverlay}

      </div>
    </section>
  );
}
