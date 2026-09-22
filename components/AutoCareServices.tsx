"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import type { KleverHomeServices } from "@/lib/services/homepage.service";

interface AutoCareServicesProps {
  locale?: string;
}

export interface AutoCareCategory {
  id: string;
  slug: string;
  title: string;
  bannerTitle: string;
  bannerBg: string;
  roundImg: string;
  badge: string;
  description: string;
  feature: string;
  ctaText: string;
}

/** Per-category visual/cosmetic presentation — badge text, CTA label, and
    banner/round images have no field in kleverHomepage.services.tiles
    (which only has title/description/image/url), so they stay local,
    keyed by the real tile's own title. Real title/description/url always
    come from the API tile itself. */
const PRESENTATION: Record<string, {
  bannerTitle: string; bannerBg: string; roundImg: string; badge: string; feature: string; ctaText: string;
}> = {
  "car tyres": {
    bannerTitle: "PREMIUM CAR TYRES",
    bannerBg: "/bg/car-tyre-new-1.webp",
    roundImg: "/YourTrustedAutoCare/service-sample.jpg",
    badge: "100% Fitment",
    feature: "Free Mobile Doorstep Fitting",
    ctaText: "Shop Tyres",
  },
  "car insurance": {
    bannerTitle: "CAR INSURANCE ONLINE",
    bannerBg: "/images/bg/car-insurance-banner.webp",
    roundImg: "/images/bg/car-insurance-banner.webp",
    badge: "Instant Quotes",
    feature: "Best Rates & Instant Policy",
    ctaText: "Get Insurance",
  },
  "rims/wheels": {
    bannerTitle: "ALLOY RIMS & WHEELS",
    bannerBg: "/YourTrustedAutoCare/car-rim.jpg",
    roundImg: "/YourTrustedAutoCare/car-rim.jpg",
    badge: "Custom Alloys",
    feature: "Precision Wheel Fitment",
    ctaText: "Explore Rims",
  },
  "battery": {
    bannerTitle: "EXPRESS BATTERY FITTING",
    bannerBg: "/images/bg/car-battery-banner.png",
    roundImg: "/images/bg/car-battery-banner.png",
    badge: "30-Min Delivery",
    feature: "Official Warranty Included",
    ctaText: "Order Battery",
  },
  "car service": {
    bannerTitle: "COMPLETE AUTO REPAIR",
    bannerBg: "/YourTrustedAutoCare/car-service-img.jpg",
    roundImg: "/YourTrustedAutoCare/car-service-img.jpg",
    badge: "Full Diagnostics",
    feature: "Certified Expert Mechanics",
    ctaText: "Book Service",
  },
  "motorbike tyres": {
    bannerTitle: "MOTORBIKE TYRES",
    bannerBg: "/YourTrustedAutoCare/motorbike-tyre.jpg",
    roundImg: "/YourTrustedAutoCare/motorbike-tyre.jpg",
    badge: "High Grip",
    feature: "Top Brands for All Bikes",
    ctaText: "Shop Bike Tyres",
  },
};
const FALLBACK_PRESENTATION = PRESENTATION["car service"];

const DEFAULT_CATEGORIES: AutoCareCategory[] = [
  {
    id: "cat-tyres",
    slug: "tyres",
    title: "Car Tyres",
    bannerTitle: "PREMIUM CAR TYRES",
    bannerBg: "/bg/car-tyre-new-1.webp",
    roundImg: "/images/home/car-tyres.png",
    badge: "100% Fitment",
    description: "Premium car, SUV & 4x4 tyres from top global brands with manufacturer warranty and free mobile doorstep fitting.",
    feature: "Free Mobile Doorstep Fitting",
    ctaText: "Shop Tyres",
  },
  {
    id: "cat-insurance",
    slug: "car-insurance",
    title: "Car Insurance",
    bannerTitle: "CAR INSURANCE ONLINE",
    bannerBg: "/images/bg/car-insurance-banner.webp",
    roundImg: "/images/home/car-insurance.png",
    badge: "Instant Quotes",
    description: "Compare comprehensive & third-party car insurance quotes instantly from UAE's leading insurance providers.",
    feature: "Best Rates & Instant Policy",
    ctaText: "Get Insurance",
  },
  {
    id: "cat-rims",
    slug: "car-wheels",
    title: "Rims / Wheels",
    bannerTitle: "ALLOY RIMS & WHEELS",
    bannerBg: "/YourTrustedAutoCare/car-rim.jpg",
    roundImg: "/images/home/car-rim.png",
    badge: "Custom Alloys",
    description: "Discover stylish alloy wheels, high-performance rims, precision fitment, and professional rim repair services.",
    feature: "Precision Wheel Fitment",
    ctaText: "Explore Rims",
  },
  {
    id: "cat-battery",
    slug: "car-battery-replacement",
    title: "Car Battery",
    bannerTitle: "EXPRESS BATTERY FITTING",
    bannerBg: "/images/bg/car-battery-banner.png",
    roundImg: "/images/home/car-battery.png",
    badge: "30-Min Delivery",
    description: "Battery testing, on-site replacement, and installation using reliable battery brands suited for UAE conditions.",
    feature: "Official Warranty Included",
    ctaText: "Order Battery",
  },
  {
    id: "cat-service",
    slug: "car-service",
    title: "Car Service",
    bannerTitle: "CAR REPAIR & SERVICE",
    bannerBg: "/images/bg/car-service-banner.webp",
    roundImg: "/images/home/car-service.png",
    badge: "Expert Mechanics",
    description: "Full mechanical checkups, oil changes, brake pads, AC services, wheel alignment, and minor repairs.",
    feature: "Certified Service Packages",
    ctaText: "Book Service",
  },
  {
    id: "cat-moto",
    slug: "motorcycle-tyre",
    title: "Motorcycle Tyres",
    bannerTitle: "MOTORBIKE TYRES",
    bannerBg: "/images/bg/motorcycle-tyre-banner.webp",
    roundImg: "/images/home/motorbike.png",
    badge: "Top Road Grip",
    description: "High-performance motorcycle tyres engineered for extreme heat and demanding asphalt in UAE.",
    feature: "Professional Moto Fitting",
    ctaText: "Shop Moto Tyres",
  },
];

export default function AutoCareServices({ locale = "en" }: AutoCareServicesProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [servicesData, setServicesData] = useState<KleverHomeServices | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/homepage?locale=${locale}`)
      .then((res) => res.json())
      .then((data) => { if (active) setServicesData(data?.services ?? null); })
      .catch(() => { /* use defaults */ });
    return () => { active = false; };
  }, [locale]);

  const categories = (servicesData?.tiles && servicesData.tiles.length > 0)
    ? servicesData.tiles.map((tile, idx) => {
        const key = (tile.title ?? "").trim().toLowerCase();
        const fallback = DEFAULT_CATEGORIES[idx % DEFAULT_CATEGORIES.length];
        const presentation = PRESENTATION[key] ?? fallback;
        const cleanSlug = (tile.url ?? "").replace(/^\/en\//, "").replace(/^\//, "").split("?")[0];
        return {
          id: key || `tile-${idx}`,
          slug: cleanSlug || fallback.slug,
          title: tile.title ?? fallback.title,
          description: tile.description ?? fallback.description,
          bannerTitle: presentation.bannerTitle,
          bannerBg: presentation.bannerBg,
          roundImg: presentation.roundImg,
          badge: presentation.badge,
          feature: presentation.feature,
          ctaText: presentation.ctaText,
        };
      })
    : DEFAULT_CATEGORIES;

  return (
    <section className="ptr-section bg-[#fbfbfb] py-12 lg:py-16 border-t border-b border-gray-100/80">
      <div className="ptr-container">
        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#ed1c24]/10 border border-[#ed1c24]/20 text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#ed1c24] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#ed1c24] animate-pulse" />
            {"ONE-STOP AUTO CARE"}
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-gray-950 font-sans uppercase">
            {"YOUR TRUSTED ONE-STOP "}{" "}
            <span className="text-[#ed1c24]">
              {"SHOP FOR AUTO CARE"}
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-gray-600 mt-2.5 leading-relaxed font-normal">
            {"At TyresWorld, we provide a wide range of car and motorcycle tyres across the UAE. Our experienced technicians use modern equipment and quality products to keep your vehicle safe and road-ready."}
          </p>
        </div>

        {/* ── Carousel Slider Wrapper ── */}
        <div className="relative group/slider">
          {/* Custom Navigation Buttons (Brand Red) */}
          <button
            type="button"
            onClick={() => swiperRef.current?.slidePrev()}
            aria-label="Previous slide"
            className={`absolute top-1/2 -translate-y-1/2 -left-3 sm:-left-5 z-20 w-10 h-10 rounded-full bg-[#ed1c24] hover:bg-[#c81018] text-white flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer ${isBeginning ? "opacity-40 cursor-not-allowed" : "opacity-95 hover:opacity-100 hover:scale-105"
              }`}
          >
            <ChevronLeft size={20} strokeWidth={2.4} />
          </button>

          <button
            type="button"
            onClick={() => swiperRef.current?.slideNext()}
            aria-label="Next slide"
            className={`absolute top-1/2 -translate-y-1/2 -right-3 sm:-right-5 z-20 w-10 h-10 rounded-full bg-[#ed1c24] hover:bg-[#c81018] text-white flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer ${isEnd ? "opacity-40 cursor-not-allowed" : "opacity-95 hover:opacity-100 hover:scale-105"
              }`}
          >
            <ChevronRight size={20} strokeWidth={2.4} />
          </button>

          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            onSlideChange={(swiper) => {
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            modules={[Navigation, Autoplay]}
            spaceBetween={18}
            slidesPerView={1.15}
            breakpoints={{
              540: { slidesPerView: 2, spaceBetween: 16 },
              768: { slidesPerView: 2.5, spaceBetween: 18 },
              1024: { slidesPerView: 3.5, spaceBetween: 20 },
              1280: { slidesPerView: 4, spaceBetween: 20 },
            }}
            className="!pb-4 !px-1"
          >
            {categories.map((item) => (
              <SwiperSlide key={item.id} className="h-auto">
                <div className="ptr-sp-card h-full flex flex-col bg-white rounded-2xl border border-gray-200/90 hover:border-[#ed1c24]/50 hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  {/* ── Top Banner Image ── */}
                  <div className="relative h-40 sm:h-44 w-full bg-zinc-950 overflow-hidden flex items-center justify-center">
                    {/* Background Artwork */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.bannerBg}
                      alt={item.title}
                      className="ptr-sp-photo absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="ptr-sp-veil absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/35" />

                    {/* Bold Centered Banner Artwork Title */}
                    <div className="relative z-10 px-4 text-center max-w-[88%]">
                      <span className="text-sm sm:text-base font-black uppercase tracking-wide leading-tight line-clamp-2 text-white drop-shadow-md">
                        {item.bannerTitle}
                      </span>
                    </div>

                    {/* Top Right: Badge Tag */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className="bg-white/95 backdrop-blur-sm text-gray-800 text-[10.5px] font-bold px-2 py-0.5 rounded shadow-sm tracking-tight">
                        {item.badge}
                      </span>
                    </div>

                    {/* Bottom Right: Verified Badge */}
                    <div className="absolute bottom-2.5 right-2.5 z-10">
                      <span className="bg-white/95 backdrop-blur-sm text-[#ed1c24] text-[10.5px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                        <CheckCircle2 size={12} className="text-[#ed1c24] stroke-[2.5]" />
                        Verified
                      </span>
                    </div>
                  </div>

                  {/* ── Circular Category Photo (Overlapping with Red Ring Border) ── */}
                  <div className="relative px-4 flex items-end -mt-8 z-20">
                    <div className="w-16 h-16 rounded-full border-2 border-white shadow-xl ring-2 ring-[#ed1c24] bg-zinc-900 overflow-hidden shrink-0 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center p-0.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.roundImg}
                        alt={item.title}
                        className="w-full h-full object-cover rounded-full"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* ── Card Body Content ── */}
                  <div className="p-4 pt-3 flex flex-col flex-1 justify-between">
                    <div>
                      {/* Category Title */}
                      <h3 className="text-sm sm:text-[15px] font-bold text-gray-900 group-hover:text-[#ed1c24] transition-colors line-clamp-1 leading-snug">
                        <Link href={`/${locale}/${item.slug}`}>
                          {item.title}
                        </Link>
                      </h3>

                      {/* Description */}
                      <p className="text-[11.5px] text-gray-500 mt-2 line-clamp-2 leading-relaxed font-normal">
                        {item.description}
                      </p>
                    </div>

                    {/* Footer metadata & CTA */}
                    <div className="pt-3 mt-3 border-t border-gray-100">
                      {/* Key Feature Badge */}
                      <div className="text-[11px] text-gray-600 flex items-center gap-1.5 font-medium mb-3">
                        <ShieldCheck size={13} className="text-[#ed1c24] shrink-0" />
                        <span className="truncate">{item.feature}</span>
                      </div>

                      {/* Action Button */}
                      <Link
                        href={`/${locale}/${item.slug}`}
                        className="btn-cta w-full py-2 px-3 rounded-xl text-xs shadow-sm"
                      >
                        <span>{item.ctaText}</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
