"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HeroSliderSkeleton } from "@/components/HomeSkeletons";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

type Slide = {
  id: string;
  badge: string;
  eyebrow: string;
  heading: string;
  sub: string;
  cta: { label: string; href: string };
  secondary: { label: string; href: string };
  gradient?: string;
  image?: string;
};

export default function HeroSlider() {
  const swiperRef = useRef<SwiperType | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <HeroSliderSkeleton />;
  if (slides.length === 0) return null;

  return (
    <section className="hero-section">
      {/*
       * .banner-aspect: aspect-ratio: 1905/644 gives the container its height
       * without any vh units, eliminating CLS.
       * All image dimensions are 1920×590 which maps perfectly to this ratio.
       *
       * Layout chain (each layer fills its parent):
       *   .banner-aspect  →  .hero-swiper (CSS: absolute, inset:0, h:100%)
       *   .hero-swiper    →  .swiper-slide (CSS: h:100%)
       *   .swiper-slide   →  .slide-img-wrap (relative, w-full, h-full)
       *   .slide-img-wrap →  next/image fill (object-cover)
       */}
      <div className="banner-aspect">

        {/* Swiper — CSS class controls all sizing (see globals.css .hero-swiper rules) */}
        <Swiper
          onSwiper={(s) => { swiperRef.current = s; }}
          modules={[Autoplay, Pagination, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          autoplay={{ delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }}
          pagination={{ clickable: true, el: ".hero-pagination" }}
          loop
          className="hero-swiper"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={slide.id}>
              {/*
               * .slide-img-wrap must be position:relative for next/image fill.
               * w-full h-full ensures it fills the slide (which Swiper sizes to 100% via CSS).
               */}
              <div className="slide-img-wrap relative w-full h-full">
                {slide.image ? (
                  <>
                    <Image
                      src={slide.image}
                      alt={slide.heading}
                      fill
                      priority={index === 0}
                      sizes="100vw"
                      className="object-cover object-center"
                    />
                    {/* No overlay, image is displayed with full brightness */}
                  </>
                ) : (
                  /* Fallback gradient when no image URL is provided */
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${
                      slide.gradient || "from-gray-900 to-gray-700"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                  </div>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Pagination dots — z-10 so they sit above the Swiper */}
        <div className="hero-pagination absolute bottom-8 z-10 flex items-center pointer-events-none" />

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

      </div>
    </section>
  );
}
