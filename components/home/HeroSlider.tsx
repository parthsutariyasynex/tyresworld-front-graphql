"use client";

import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination, EffectFade } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

/* Presentational hero content (no product/API source). */
const heroSlides = [
  {
    id: "slide-1",
    badge: "Premium Range",
    eyebrow: "Tyres for every road",
    heading: "Grip the road,\nwhatever the weather",
    sub: "Thousands of car, SUV and performance tyres from the brands you trust — fitted and delivered across the UAE.",
    cta: { label: "Shop Tyres", href: "/shop?categoryUid=MTg=" },
    secondary: { label: "Browse all", href: "/shop" },
    gradient: "from-ink to-slate-700",
  },
  {
    id: "slide-2",
    badge: "Free Fitting",
    eyebrow: "Wheels & rims",
    heading: "Style that\nrolls with you",
    sub: "Alloy wheels and rim protectors engineered to fit — upgrade your ride with a perfect match.",
    cta: { label: "Shop Wheels", href: "/shop?categoryUid=MTExNw==" },
    secondary: { label: "View deals", href: "/shop" },
    gradient: "from-accent to-rose-700",
  },
  {
    id: "slide-3",
    badge: "Same-Day",
    eyebrow: "Batteries & more",
    heading: "Power that\nnever lets you down",
    sub: "Reliable car batteries with quick fitting and warranty — keep moving without the wait.",
    cta: { label: "Shop Batteries", href: "/shop?categoryUid=MTExOA==" },
    secondary: { label: "Learn more", href: "/about" },
    gradient: "from-emerald-800 to-emerald-600",
  },
];

export default function HeroSlider() {
  const swiperRef = useRef<SwiperType | null>(null);

  return (
    <section className="relative overflow-hidden h-[88vh] min-h-[580px] max-h-[900px]">
      <Swiper
        onSwiper={(s) => { swiperRef.current = s; }}
        modules={[Autoplay, Navigation, Pagination, EffectFade]}
        effect="fade"
        autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ clickable: true, el: ".hero-pagination" }}
        loop
        className="hero-swiper h-full"
      >
        {heroSlides.map((slide) => (
          <SwiperSlide key={slide.id} className="relative">
            {/* Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/45 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="relative h-full container flex items-center">
              <div className="max-w-2xl">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span className="text-xs font-semibold text-white uppercase tracking-widest">
                    {slide.badge}
                  </span>
                </div>

                <p className="text-white/60 text-sm font-medium uppercase tracking-[0.18em] mb-4">
                  {slide.eyebrow}
                </p>

                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.03] tracking-tight mb-6 whitespace-pre-line">
                  {slide.heading}
                </h1>

                <p className="text-white/65 text-base lg:text-lg leading-relaxed max-w-md mb-9">
                  {slide.sub}
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={slide.cta.href}
                    className="btn bg-accent text-white px-8 py-3.5 text-sm hover:brightness-95 active:scale-[0.98]"
                  >
                    {slide.cta.label}
                    <ArrowRight size={15} />
                  </Link>
                  <Link
                    href={slide.secondary.href}
                    className="btn border border-white/30 text-white px-8 py-3.5 text-sm hover:bg-white/10"
                  >
                    {slide.secondary.label}
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom pagination */}
      <div className="hero-pagination absolute bottom-8 z-10 flex items-center" />

      {/* Nav buttons */}
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
    </section>
  );
}
