"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const OFFER_BANNERS = [
  {
    id: "matrax-3plus1",
    image: "/offers/buy3-get1-free-matrax-tyres-uae.webp",
    alt: "Matrax 3+1 Free Tyre Offers in UAE",
    title: "Matrax 3+1 Free Tyre Offers in UAE",
    href: "/tyres?mgs_brand=Matrax&offers=Buy+3+Get+1+Free",
  },
  {
    id: "installments",
    image: "/offers/buy-tyres-pay-in-easy-installments-uae.webp",
    alt: "Shop tyres online and pay in installments",
    title: "Shop tyres online and pay in installments",
    href: "/tyres",
  },
  {
    id: "2026-tyres",
    image: "/offers/2026-tyres-online-uae_1.webp",
    alt: "2026 Tyres",
    title: "2026 Tyres",
    href: "/tyres?year=2026",
  },
  {
    id: "free-wheel-alignment",
    image: "/offers/free-wheel-alignment-offer-on-tyres-uae_1.webp",
    alt: "Free Wheel Alignment",
    title: "Free Wheel Alignment",
    href: "/tyres?offers=Free+Wheel+Alignment",
  },
  {
    id: "vredestein-3plus1",
    image: "/offers/buy3-get1-free-vredestein-tyres-uae.webp",
    alt: "Buy 3 Vredestein tyres online and get 1 free",
    title: "Buy 3 Vredestein tyres online and get 1 free",
    href: "/tyres?mgs_brand=Vredestein&offers=Buy+3+Get+1+Free",
  },
];

// Duplicate list for smooth infinite Swiper looping
const SLIDE_TRACK = [...OFFER_BANNERS, ...OFFER_BANNERS];

export default function OffersSection() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "ar" ? "ar" : "en";
  const isAr = locale === "ar";
  const swiperRef = useRef<SwiperType | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  return (
    <section className="section section-padding offers py-12 md:py-16 bg-white overflow-hidden">
      <div className="container custom-width max-w-[1440px] mx-auto px-4 sm:px-6">
        {/* ── Section Title (Exact match to screenshot) ──────── */}
        <div className="section-title mb-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-tight text-black mb-2">
            {isAr ? "عروض " : "EXCLUSIVE "}
            <span className="text-[#ed1c24] theme_color">
              {isAr ? "حصرية" : "OFFERS"}
            </span>
          </h2>
          <p className="text-black text-xs sm:text-[14px] font-bold tracking-tight m-0">
            {isAr
              ? "تبحث عن أفضل عروض الإطارات عبر الإنترنت في الإمارات؟"
              : "Searching for the Best Tyre Deals Online in the UAE?"}
          </p>
        </div>

        {/* ── Offer Slider with exact side navigation & aspect ratio ── */}
        <div className="relative px-2 sm:px-12 md:px-14">
          <Swiper
            onSwiper={(s) => {
              swiperRef.current = s;
            }}
            modules={[Autoplay, Navigation, Pagination]}
            autoplay={
              reducedMotion
                ? false
                : {
                    delay: 4000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }
            }
            speed={700}
            spaceBetween={15}
            slidesPerView={1}
            loop={true}
            pagination={{
              clickable: true,
              bulletClass: "swiper-pagination-bullet !w-4 !h-[3px] !rounded-sm !bg-gray-300 !opacity-100 transition-all cursor-pointer",
              bulletActiveClass: "!bg-[#ed1c24] !w-7 !h-[3px]",
            }}
            breakpoints={{
              540: { slidesPerView: 2, spaceBetween: 15 },
              992: { slidesPerView: 3, spaceBetween: 15 },
            }}
            className="pb-5 [&_.swiper-pagination]:!bottom-0"
          >
            {SLIDE_TRACK.map((banner, idx) => (
              <SwiperSlide key={`${banner.id}-${idx}`}>
                <div className="box relative overflow-hidden rounded-[14px] bg-white transition-all duration-300 group">
                  <Link
                    href={`/${locale}${banner.href}`}
                    className="link block relative w-full aspect-[559/391] overflow-hidden rounded-[14px] shadow-sm hover:shadow-md transition-shadow"
                    title={banner.title}
                    aria-label={banner.alt}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={banner.image}
                      alt={banner.alt}
                      width={559}
                      height={391}
                      className="w-full h-full object-cover rounded-[14px] transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </Link>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Solid Red Circle Left Arrow — Positioned outside cards */}
          <button
            type="button"
            onClick={() => swiperRef.current?.slidePrev()}
            className="hidden sm:flex absolute left-0 sm:left-1 top-[44%] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#ed1c24] hover:bg-[#c6181d] text-white items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer focus:outline-none"
            aria-label="Previous Offer"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>

          {/* Solid Red Circle Right Arrow — Positioned outside cards */}
          <button
            type="button"
            onClick={() => swiperRef.current?.slideNext()}
            className="hidden sm:flex absolute right-0 sm:right-1 top-[44%] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#ed1c24] hover:bg-[#c6181d] text-white items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer focus:outline-none"
            aria-label="Next Offer"
          >
            <ChevronRight size={22} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </section>
  );
}
